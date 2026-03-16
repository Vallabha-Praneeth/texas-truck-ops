# Wallet Feature - Quick Start Guide

## For Developers

### Running Locally

1. **Start the backend API**:
```bash
cd packages/api
npm run dev
# API should be running at http://localhost:3001
```

2. **Start the mobile app**:
```bash
cd apps/mobile
npm start
# Choose iOS simulator or Android emulator
```

3. **Login as a broker user**:
- Use test credentials or phone number
- Navigate to Overview tab (should be default)

4. **You should see**:
- Wallet card at top of dashboard
- Balance and pending balance displayed
- "View Transactions" button

### Testing the Feature

**Quick Test Flow**:
1. View wallet balance on dashboard
2. Tap "View Transactions"
3. See transaction list
4. Tap filter buttons (All, Pending, Completed, Failed)
5. Pull down to refresh
6. Tap back button
7. Verify you're back on dashboard

### Code Structure

```
Wallet Feature Components:

1. Hook: useWalletBalance()
   Location: /apps/mobile/src/hooks/useWallet.ts
   Usage: const { data, isLoading, error } = useWalletBalance()

2. Hook: useWalletTransactions()
   Location: /apps/mobile/src/hooks/useWallet.ts
   Usage: const { data } = useWalletTransactions({ limit: 20, offset: 0 })

3. Component: WalletBalanceCard
   Location: /apps/mobile/src/components/WalletBalanceCard.tsx
   Usage: <WalletBalanceCard onViewTransactions={() => navigate(...)} />

4. Screen: WalletTransactionsScreen
   Location: /apps/mobile/src/screens/wallet/WalletTransactionsScreen.tsx
   Navigation: Accessible from broker dashboard
```

### API Endpoints

**Balance**:
```bash
curl http://localhost:3001/api/wallet/balance \
  -H "Authorization: Bearer <your-token>"
```

**Transactions**:
```bash
curl "http://localhost:3001/api/wallet/transactions?limit=20&offset=0" \
  -H "Authorization: Bearer <your-token>"
```

### Common Tasks

**Change refresh interval**:
```typescript
// In WalletBalanceCard.tsx
useWalletBalance({ refetchInterval: 60000 }) // 1 minute

// In WalletTransactionsScreen.tsx
useWalletTransactions(params, { refetchInterval: 45000 }) // 45 seconds
```

**Add new transaction type color**:
```typescript
// In WalletTransactionsScreen.tsx, getTransactionColor()
case 'refund':
  return theme.colors.success;
```

**Add new filter**:
```typescript
// 1. Update type
type TransactionStatus = 'all' | 'pending' | 'completed' | 'failed' | 'refunded';

// 2. Add button
{renderFilterButton('refunded', 'Refunded')}
```

### Debugging

**Wallet card doesn't appear**:
```typescript
// Check in BrokerDashboard.tsx
import { WalletBalanceCard } from '@/components';

// Should have:
<WalletBalanceCard
  onViewTransactions={() => navigation.navigate('WalletTransactions')}
/>
```

**Navigation error**:
```typescript
// Verify in AppNavigator.tsx
const BrokerStackNavigator = () => {
  return (
    <BrokerStack.Navigator>
      <BrokerStack.Screen name="BrokerTabs" component={BrokerTabsNavigator} />
      <BrokerStack.Screen name="WalletTransactions" component={WalletTransactionsScreen} />
    </BrokerStack.Navigator>
  );
};
```

**TypeScript errors**:
```bash
cd apps/mobile
npx tsc --noEmit
```

### File Locations

```
apps/mobile/src/
├── hooks/
│   ├── index.ts ............... exports useWallet*
│   └── useWallet.ts ........... wallet React Query hooks
│
├── components/
│   ├── index.ts ............... exports WalletBalanceCard
│   └── WalletBalanceCard.tsx .. balance display component
│
├── screens/
│   ├── broker/
│   │   └── BrokerDashboard.tsx  (includes WalletBalanceCard)
│   └── wallet/
│       └── WalletTransactionsScreen.tsx
│
└── navigation/
    └── AppNavigator.tsx ........ includes wallet navigation
```

### Testing Checklist (Quick)

- [ ] Balance displays on dashboard
- [ ] "View Transactions" navigates correctly
- [ ] Transaction list loads
- [ ] Filters work
- [ ] Pull-to-refresh works
- [ ] Back button returns to dashboard
- [ ] No console errors

### Documentation

- **Full Guide**: `/MOBILE_WALLET_INTEGRATION.md`
- **Testing**: `/apps/mobile/WALLET_TESTING_GUIDE.md`
- **Architecture**: `/apps/mobile/WALLET_ARCHITECTURE.md`
- **Status**: `/apps/mobile/WALLET_IMPLEMENTATION_SUMMARY.md`

### Getting Help

**Check these first**:
1. Is the backend API running?
2. Are you logged in as a broker?
3. Does the API return data?
4. Are there console errors?

**Debug commands**:
```bash
# Test API
curl http://localhost:3001/api/wallet/balance -H "Authorization: Bearer <token>"

# Check TypeScript
cd apps/mobile && npx tsc --noEmit

# Find wallet files
find apps/mobile/src -name "*wallet*" -o -name "*Wallet*"
```

### Next Steps

After testing locally:
1. Review full documentation
2. Run through comprehensive test guide
3. Test on iOS and Android
4. Check different screen sizes
5. Test error scenarios
6. Performance check

---

**Quick Start Complete** ✅

For comprehensive information, see `/MOBILE_WALLET_INTEGRATION.md`
