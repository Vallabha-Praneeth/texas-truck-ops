# Wallet Feature Architecture

## Component Hierarchy

```
BrokerApp (Root Stack Screen)
│
└── BrokerStackNavigator
    │
    ├── BrokerTabs (Tab Navigator)
    │   │
    │   └── Overview Tab
    │       │
    │       └── BrokerDashboard
    │           │
    │           ├── Header (greeting, logout)
    │           ├── WalletBalanceCard ← NEW
    │           │   ├── Balance Display
    │           │   ├── Pending Balance
    │           │   └── View Transactions Button
    │           ├── KPI Cards (requests, offers, bookings, value)
    │           └── Recent Requests List
    │
    └── WalletTransactions (Stack Screen) ← NEW
        │
        └── WalletTransactionsScreen
            ├── Filter Buttons (All, Pending, Completed, Failed)
            └── Transaction List (FlatList)
                └── TransactionCard (for each item)
                    ├── Type & Date
                    ├── Amount (color-coded)
                    ├── Status Badge
                    └── Booking ID (optional)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Query Cache                         │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │ ['wallet',      │        │ ['wallet',               │   │
│  │  'balance']     │        │  'transactions', params] │   │
│  │                 │        │                          │   │
│  │ balance: 123456 │        │ [{ id, amount, type,    │   │
│  │ pending: 5000   │        │    status, date, ... }] │   │
│  └─────────────────┘        └──────────────────────────┘   │
│         ↑                              ↑                     │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │ useWalletBalance()           │ useWalletTransactions()
          │                              │
    ┌─────┴──────┐              ┌────────┴──────────┐
    │            │              │                   │
    │   Wallet   │              │   Transaction     │
    │  Balance   │              │     History       │
    │   Card     │              │     Screen        │
    │            │              │                   │
    └────────────┘              └───────────────────┘
          │                              │
          │ API Call                     │ API Call
          │ (auto-refresh 30s)           │ (auto-refresh 30s)
          │                              │
          ▼                              ▼
    ┌─────────────────────────────────────────────┐
    │         Backend API (NestJS)                │
    │                                             │
    │  GET /api/wallet/balance                   │
    │  GET /api/wallet/transactions?limit=20     │
    │                                             │
    │  Authentication: Bearer <token>            │
    │  (from AsyncStorage)                       │
    └─────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
    ┌─────────────────────────────────────────────┐
    │         Database (PostgreSQL)               │
    │                                             │
    │  wallet_balances table                     │
    │  wallet_transactions table                 │
    └─────────────────────────────────────────────┘
```

## Navigation Flow

```
User Journey:

1. Login as Broker
   │
   ▼
2. BrokerDashboard (Overview Tab)
   │ - See WalletBalanceCard
   │ - Shows: $1,235 available, $50 pending
   │
   ▼
3. Tap "View Transactions"
   │ - Navigation: navigate('WalletTransactions')
   │
   ▼
4. WalletTransactionsScreen
   │ - Header: "Transaction History" with back button
   │ - Filter: All (active) | Pending | Completed | Failed
   │ - List: Shows all transactions
   │
   ▼
5. Tap "Pending" filter
   │ - List updates to show only pending transactions
   │
   ▼
6. Pull down to refresh
   │ - Fetches latest transactions from API
   │ - Updates list with new data
   │
   ▼
7. Tap back button
   │ - Returns to BrokerDashboard
   │ - Wallet card shows updated balance
```

## State Management

### Query Keys Structure

```typescript
walletKeys = {
  all: ['wallet'],
  balance: ['wallet', 'balance'],
  transactions: ['wallet', 'transactions'],
  transactionsList: (params) => ['wallet', 'transactions', { limit: 20, offset: 0 }]
}
```

### Cache Behavior

1. **Balance Query**:
   - Stale time: 30 seconds
   - Auto-refetch: Configurable via options
   - Cache key: `['wallet', 'balance']`
   - Shared across: WalletBalanceCard

2. **Transactions Query**:
   - Stale time: 20 seconds
   - Auto-refetch: 30 seconds
   - Cache key: `['wallet', 'transactions', { limit, offset }]`
   - Shared across: WalletTransactionsScreen

### Refetch Triggers

- **Manual**: Pull-to-refresh
- **Automatic**: Every 30 seconds (configurable)
- **On Focus**: When screen gains focus (React Navigation default)
- **On Network Reconnect**: React Query default behavior

## API Integration

### Endpoint Details

#### GET /api/wallet/balance

**Request**:
```http
GET /api/wallet/balance HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "balance": 123456,
  "pendingBalance": 5000
}
```

**Type Definition**:
```typescript
type WalletBalance = {
  balance: number;        // in cents
  pendingBalance: number; // in cents
}
```

#### GET /api/wallet/transactions

**Request**:
```http
GET /api/wallet/transactions?limit=20&offset=0 HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
[
  {
    "id": "tx_abc123",
    "amount": 50000,
    "type": "deposit",
    "status": "completed",
    "createdAt": "2025-03-15T10:30:00.000Z",
    "bookingId": "booking_xyz789"
  },
  {
    "id": "tx_def456",
    "amount": -2500,
    "type": "fee",
    "status": "completed",
    "createdAt": "2025-03-14T14:20:00.000Z"
  }
]
```

**Type Definition**:
```typescript
type WalletTransaction = {
  id: string;
  amount: number;       // in cents, positive or negative
  type: string;         // "deposit", "fee", "payout", "credit", "debit", etc.
  status: string;       // "pending", "completed", "failed"
  createdAt: string;    // ISO 8601 datetime
  bookingId?: string;   // optional booking reference
}
```

## Component Props & Types

### WalletBalanceCard

```typescript
type WalletBalanceCardProps = {
  onViewTransactions?: () => void;
}

// Usage:
<WalletBalanceCard
  onViewTransactions={() => navigation.navigate('WalletTransactions')}
/>
```

### WalletTransactionsScreen

No props (uses hooks internally).

```typescript
// Internal state:
type TransactionStatus = 'all' | 'pending' | 'completed' | 'failed';

const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
const [offset, setOffset] = useState(0);
```

## Styling System

### Theme Colors Used

```typescript
// Primary actions
theme.colors.primary         // #2563eb (blue) - buttons, active filters
theme.colors.primaryForeground // #ffffff - button text

// Success indicators (deposits, payouts)
theme.colors.success         // #10b981 (green)

// Warning indicators (pending)
theme.colors.warning         // #f59e0b (orange)

// Error indicators (fees, failed)
theme.colors.destructive     // #ef4444 (red)

// Text colors
theme.colors.foreground      // #0f172a (dark) - main text
theme.colors.mutedForeground // #64748b (gray) - labels, meta

// Backgrounds & borders
theme.colors.background      // #ffffff
theme.colors.border          // #e2e8f0
theme.colors.muted           // #f1f5f9
```

### Spacing Scale

```typescript
theme.spacing.xs   // 4px
theme.spacing.sm   // 8px
theme.spacing.md   // 16px
theme.spacing.lg   // 24px
theme.spacing.xl   // 32px
theme.spacing['2xl'] // 48px
```

### Typography Scale

```typescript
theme.fontSize.xs    // 12px - small labels, booking IDs
theme.fontSize.sm    // 14px - secondary text, dates
theme.fontSize.base  // 16px - transaction types, body text
theme.fontSize.lg    // 18px - transaction amounts
theme.fontSize.xl    // 20px - section titles
theme.fontSize['2xl'] // 24px - balance amount
```

## Error Handling

### Network Errors

```typescript
// WalletBalanceCard
if (error) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>
        Unable to load wallet balance
      </Text>
    </View>
  );
}
```

### Loading States

```typescript
// WalletBalanceCard
if (isLoading) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading wallet...</Text>
    </View>
  );
}
```

### Empty States

```typescript
// WalletTransactionsScreen
<FlatList
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {statusFilter === 'all'
          ? 'No transactions yet'
          : `No ${statusFilter} transactions`}
      </Text>
    </View>
  }
/>
```

## Performance Optimizations

### 1. React Query Caching
- Reduces API calls with intelligent caching
- Shares cached data across components
- Background refetching keeps data fresh

### 2. Memoization
```typescript
const filteredTransactions = React.useMemo(() => {
  if (!transactions) return [];
  if (statusFilter === 'all') return transactions;
  return transactions.filter((tx) => tx.status === statusFilter);
}, [transactions, statusFilter]);
```

### 3. FlatList Optimization
- Uses `keyExtractor` for efficient rendering
- Native pull-to-refresh implementation
- Smooth scrolling with virtualization

### 4. Conditional Rendering
```typescript
// Only render pending balance if > 0
{pendingBalance > 0 && (
  <View style={styles.balanceItem}>
    <Text style={styles.pendingLabel}>Pending</Text>
    <Text style={styles.pendingAmount}>
      {formatCurrencyFromCents(pendingBalance)}
    </Text>
  </View>
)}
```

## Security Considerations

### 1. Authentication
- All API requests include Bearer token
- Token stored securely in AsyncStorage
- 401 responses trigger logout and redirect to login

### 2. Data Privacy
- Wallet data is user-specific (filtered by token)
- No sensitive data stored in component state
- React Query cache cleared on logout

### 3. Input Validation
- Currency formatting prevents XSS
- Type safety ensures data integrity
- API responses validated by TypeScript types

## Testing Strategy

### Unit Tests (Future)
```typescript
// Test hooks
describe('useWalletBalance', () => {
  it('fetches balance data', async () => {
    // Mock API response
    // Render hook
    // Assert balance returned
  });
});

// Test components
describe('WalletBalanceCard', () => {
  it('displays formatted balance', () => {
    // Render with mock data
    // Assert $1,235 displayed
  });
});
```

### Integration Tests (Future)
```typescript
describe('Wallet navigation', () => {
  it('navigates to transaction screen', () => {
    // Render BrokerDashboard
    // Tap "View Transactions"
    // Assert WalletTransactionsScreen rendered
  });
});
```

### E2E Tests (Future)
```typescript
describe('Wallet feature', () => {
  it('completes full wallet flow', () => {
    // Login as broker
    // View wallet balance
    // Navigate to transactions
    // Filter transactions
    // Pull to refresh
    // Return to dashboard
  });
});
```

## Maintenance & Updates

### Adding New Transaction Types

1. Update backend to return new type
2. Add color mapping in `getTransactionColor()`:
```typescript
case 'refund':
  return theme.colors.success;
```
3. Add sign mapping in `getTransactionSign()`:
```typescript
case 'refund':
  return '+';
```

### Adding New Filters

1. Update `TransactionStatus` type:
```typescript
type TransactionStatus = 'all' | 'pending' | 'completed' | 'failed' | 'refunded';
```
2. Add filter button:
```typescript
{renderFilterButton('refunded', 'Refunded')}
```

### Customizing Refresh Intervals

```typescript
// In WalletBalanceCard
useWalletBalance({ refetchInterval: 60000 }) // 1 minute

// In WalletTransactionsScreen
useWalletTransactions(params, { refetchInterval: 45000 }) // 45 seconds
```

## Future Enhancements

### 1. Infinite Scroll
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: walletKeys.transactions(),
  queryFn: ({ pageParam = 0 }) =>
    api.wallet.getTransactions({ limit: 20, offset: pageParam }),
  getNextPageParam: (lastPage, allPages) =>
    lastPage.length === 20 ? allPages.length * 20 : undefined,
});
```

### 2. Transaction Details Modal
```typescript
const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);

<Modal visible={!!selectedTransaction}>
  <TransactionDetails transaction={selectedTransaction} />
</Modal>
```

### 3. Export Functionality
```typescript
const exportTransactions = async () => {
  const csv = generateCSV(transactions);
  await Share.share({ url: csv });
};
```

### 4. Real-time Updates (WebSocket)
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/wallet');
  ws.onmessage = (event) => {
    queryClient.invalidateQueries(walletKeys.all);
  };
  return () => ws.close();
}, []);
```

### 5. Advanced Filtering
```typescript
type TransactionFilters = {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
};
```
