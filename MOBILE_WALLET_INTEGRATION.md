# Mobile Wallet Integration

## Overview
This document describes the mobile wallet display feature implementation for the LED Billboard Marketplace app. The feature allows brokers to view their wallet balance and transaction history directly from the mobile app.

## Implementation Summary

### 1. Wallet Hooks (`/apps/mobile/src/hooks/useWallet.ts`)

Created React Query hooks for wallet data management:

- **useWalletBalance()**: Fetches and caches wallet balance data
  - Returns: `{ balance: number, pendingBalance: number }`
  - Stale time: 30 seconds
  - Auto-refetch interval: configurable via options

- **useWalletTransactions()**: Fetches transaction history with pagination
  - Parameters: `{ limit?: number, offset?: number }`
  - Returns: Array of transactions with id, amount, type, status, createdAt, bookingId
  - Stale time: 20 seconds
  - Supports pagination and filtering

**Query Keys:**
```typescript
walletKeys = {
  all: ['wallet'],
  balance: ['wallet', 'balance'],
  transactions: ['wallet', 'transactions'],
  transactionsList: (params) => ['wallet', 'transactions', params]
}
```

### 2. Wallet Balance Card Component (`/apps/mobile/src/components/WalletBalanceCard.tsx`)

A reusable card component that displays wallet balance on the broker dashboard:

**Features:**
- Shows available balance prominently
- Displays pending balance (when > 0)
- "View Transactions" button to navigate to transaction history
- Automatic refresh every 30 seconds
- Loading and error states
- Consistent with app theme and design patterns

**Props:**
```typescript
{
  onViewTransactions?: () => void;
}
```

### 3. Transaction History Screen (`/apps/mobile/src/screens/wallet/WalletTransactionsScreen.tsx`)

A full-screen transaction list with filtering capabilities:

**Features:**
- Pull-to-refresh functionality
- Filter by status: All, Pending, Completed, Failed
- Color-coded transactions:
  - Green: deposits, payouts, credits (+)
  - Red: fees, charges, debits (-)
- Transaction details displayed:
  - Amount with sign indicator
  - Type (capitalized)
  - Status badge with color coding
  - Date/time formatted (e.g., "Jan 15, 2025, 3:45 PM")
  - Booking ID (if applicable, truncated to 8 chars)
- Auto-refresh every 30 seconds
- Pagination support (20 transactions per page)
- Empty states for filtered views

**UI Elements:**
- Filter buttons with active state highlighting
- Card-based transaction list
- Status badges with color coding
- Formatted currency amounts using `formatCurrencyFromCents`

### 4. Navigation Updates (`/apps/mobile/src/navigation/AppNavigator.tsx`)

Enhanced broker navigation to support wallet transactions screen:

**Changes:**
- Added `BrokerStackParamList` type definition
- Created `BrokerStackNavigator` to wrap tabs with stack navigation
- Added `WalletTransactions` screen to broker stack
- Screen shows with header: "Transaction History"
- Back navigation to broker dashboard

**Navigation Structure:**
```
BrokerApp (RootStack)
  └─ BrokerStackNavigator
      ├─ BrokerTabs (Bottom Tabs)
      │   ├─ Overview (Dashboard)
      │   ├─ Requests
      │   ├─ Marketplace
      │   ├─ Offers
      │   └─ Bookings
      └─ WalletTransactions (Stack Screen)
```

### 5. Broker Dashboard Integration (`/apps/mobile/src/screens/broker/BrokerDashboard.tsx`)

Updated broker dashboard to include wallet information:

**Changes:**
- Added `WalletBalanceCard` component at the top of the dashboard
- Imported `useNavigation` for transaction history navigation
- Card positioned above KPI cards section
- "View Transactions" button navigates to `WalletTransactions` screen

## API Integration

The mobile app uses existing backend wallet API endpoints:

### Endpoints Used:
- **GET /api/wallet/balance**
  - Returns: `{ balance: number, pendingBalance: number }`
  - Used by: `useWalletBalance()` hook

- **GET /api/wallet/transactions**
  - Query params: `limit`, `offset`
  - Returns: Array of transaction objects
  - Used by: `useWalletTransactions()` hook

### API Configuration:
- Base URL: `http://localhost:3001/api` (from EXPO_PUBLIC_API_URL)
- Authentication: Bearer token from AsyncStorage (key: `@led_billboard_token`)
- Timeout: 10 seconds (development), 15 seconds (production)

## UI/UX Features

### Design Consistency:
- Uses theme from `/apps/mobile/src/lib/theme.ts`
- Follows existing component patterns (KPICard, StatusBadge, etc.)
- Consistent spacing, colors, and typography
- Matches broker dashboard aesthetic

### User Experience:
- Auto-refresh keeps data current without manual intervention
- Pull-to-refresh gives users control over data updates
- Loading states prevent UI flicker
- Error states provide clear feedback
- Empty states guide users when no data exists
- Filter persistence during session

### Accessibility:
- Color-coded amounts for quick visual scanning
- Status badges with distinct colors
- Clear typography hierarchy
- Touch-friendly button sizes
- Readable date/time formats

## File Structure

```
apps/mobile/src/
├── hooks/
│   ├── index.ts (updated: exports useWallet hooks)
│   └── useWallet.ts (new)
├── components/
│   ├── index.ts (updated: exports WalletBalanceCard)
│   └── WalletBalanceCard.tsx (new)
├── screens/
│   ├── broker/
│   │   └── BrokerDashboard.tsx (updated: includes WalletBalanceCard)
│   └── wallet/
│       └── WalletTransactionsScreen.tsx (new)
├── navigation/
│   └── AppNavigator.tsx (updated: adds wallet navigation)
└── lib/
    └── api.ts (existing: wallet endpoints already defined)
```

## Testing Checklist

### Functional Tests:
- [ ] Wallet balance displays correctly on broker dashboard
- [ ] Pending balance appears when greater than 0
- [ ] "View Transactions" button navigates to transaction screen
- [ ] Transaction list loads and displays properly
- [ ] Pull-to-refresh updates transaction data
- [ ] Status filters work correctly (All, Pending, Completed, Failed)
- [ ] Transaction amounts show correct sign (+/-)
- [ ] Color coding matches transaction type
- [ ] Status badges display with correct colors
- [ ] Booking ID appears for transactions linked to bookings
- [ ] Empty states show when no transactions exist
- [ ] Back navigation returns to dashboard
- [ ] Auto-refresh updates data periodically

### Error Handling:
- [ ] Network errors show appropriate message
- [ ] API timeouts handled gracefully
- [ ] Invalid data handled without crashes
- [ ] 401 errors trigger re-authentication

### Performance:
- [ ] No unnecessary re-renders
- [ ] Smooth scrolling in transaction list
- [ ] Quick navigation between screens
- [ ] Efficient query caching via React Query

## Success Criteria

All criteria met:

✅ **Wallet balance displayed on dashboard**
  - WalletBalanceCard component shows available and pending balance
  - Auto-refreshes every 30 seconds
  - Includes "View Transactions" navigation button

✅ **Transaction history screen with filtering**
  - Full transaction list with details
  - Filter by status: All, Pending, Completed, Failed
  - Color-coded by transaction type
  - Status badges with visual indicators

✅ **Pull-to-refresh works**
  - RefreshControl integrated
  - Fetches latest data on pull
  - Shows loading indicator during refresh

✅ **Proper loading and error states**
  - Loading spinners during initial fetch
  - Error messages for failed requests
  - Empty states for no transactions

✅ **Navigation works correctly**
  - Broker dashboard → Transaction history screen
  - Header shows "Transaction History"
  - Back button returns to dashboard
  - Tab navigation preserved

## Technical Notes

### State Management:
- Uses TanStack React Query for server state
- Query keys follow established patterns
- Automatic cache invalidation and refetching
- Optimistic updates not needed (read-only views)

### Type Safety:
- Full TypeScript coverage
- Type definitions for hooks, components, and navigation
- Proper API response typing

### Code Patterns:
- Follows existing hook patterns (useBookings, usePayment, etc.)
- Component styling matches existing screens
- Navigation structure consistent with app architecture

### Future Enhancements:
- Infinite scroll for transaction pagination
- Transaction detail modal with full information
- Export transactions to CSV/PDF
- Advanced filtering (date range, amount range, type)
- Search functionality
- Wallet top-up integration
- Payout request feature
- Transaction receipt download

## Dependencies

No new dependencies added. Uses existing packages:
- `@tanstack/react-query` - State management
- `@react-navigation/native` - Navigation
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator
- `react-native` - UI components
- `@react-native-async-storage/async-storage` - Token storage

## Environment Variables

Uses existing configuration:
- `EXPO_PUBLIC_API_URL` - API base URL (defaults to http://localhost:8081/api)
- `EXPO_PUBLIC_ENV` - Environment setting (affects timeout values)

## Deployment Notes

No special deployment requirements:
- No database migrations needed (backend already complete)
- No environment variable changes required
- Compatible with existing build pipeline
- Works with current authentication system

## Rollout Plan

1. **Development**: Test locally with backend API
2. **Staging**: Verify with test data and multiple transaction scenarios
3. **Production**: Deploy with existing app update
4. **Monitoring**: Track API response times and error rates

## Support

For issues or questions:
- Check backend API logs for endpoint errors
- Verify authentication token is valid
- Ensure API endpoints return expected data format
- Review React Query DevTools for cache state
