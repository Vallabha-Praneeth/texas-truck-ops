# Mobile Wallet Testing Guide

## Prerequisites

1. **Backend Running**: Ensure the API server is running at `http://localhost:3001`
2. **Test User**: Login as a broker user
3. **Test Data**: Ensure wallet endpoints return data:
   - `GET /api/wallet/balance` returns balance and pendingBalance
   - `GET /api/wallet/transactions` returns transaction array

## Manual Testing Steps

### 1. Wallet Balance Card on Dashboard

**Location**: Broker Dashboard (Overview tab)

**Test Steps**:
1. Launch the mobile app and login as a broker
2. Navigate to the Overview tab (should be default)
3. Observe the Wallet card at the top of the dashboard

**Expected Results**:
- [ ] Wallet card appears above KPI cards
- [ ] "Available Balance" is displayed with formatted currency (e.g., "$1,234")
- [ ] "Pending" balance appears if pendingBalance > 0
- [ ] "View Transactions" button is visible and styled correctly
- [ ] Card auto-refreshes every 30 seconds
- [ ] Loading spinner appears during initial load
- [ ] Error message shows if API fails

**Test Cases**:
- **Zero Balance**: Balance shows "$0"
- **Positive Balance**: Shows formatted amount (e.g., "$1,234")
- **Negative Balance**: Shows with negative sign (e.g., "-$500")
- **Pending Balance**: Shows in orange/warning color when > 0
- **No Pending**: Pending section hidden when = 0

### 2. Navigation to Transaction History

**Test Steps**:
1. From broker dashboard, tap "View Transactions" button
2. Observe screen transition

**Expected Results**:
- [ ] Navigates to "Transaction History" screen
- [ ] Header shows "Transaction History" title
- [ ] Back button appears in header
- [ ] Screen loads transaction list

### 3. Transaction List Display

**Location**: Transaction History screen

**Test Steps**:
1. Navigate to Transaction History screen
2. Observe the transaction list

**Expected Results**:
- [ ] Filter buttons appear at top: All, Pending, Completed, Failed
- [ ] "All" filter is active by default (highlighted in blue)
- [ ] Transactions display in cards with:
  - Transaction type (capitalized, e.g., "Deposit", "Fee")
  - Date/time in readable format (e.g., "Jan 15, 2025, 3:45 PM")
  - Amount with sign (+/- based on type)
  - Status badge with color coding
  - Booking ID (if applicable, truncated to 8 characters)
- [ ] Color coding is correct:
  - Green for deposits/payouts/credits
  - Red for fees/charges/debits
- [ ] Status badges show correct colors:
  - Green background for "completed"
  - Orange background for "pending"
  - Red background for "failed"

### 4. Transaction Filtering

**Test Steps**:
1. Tap "Pending" filter button
2. Observe filtered results
3. Tap "Completed" filter button
4. Tap "Failed" filter button
5. Tap "All" filter button

**Expected Results**:
- [ ] Active filter button highlights in blue
- [ ] Inactive filter buttons show gray background
- [ ] List updates to show only matching transactions
- [ ] Empty state shows when no transactions match filter
- [ ] Empty state message is filter-specific (e.g., "No pending transactions")

### 5. Pull-to-Refresh

**Test Steps**:
1. On Transaction History screen, pull down from top
2. Observe refresh indicator
3. Release to trigger refresh

**Expected Results**:
- [ ] Refresh indicator appears
- [ ] List updates with latest data
- [ ] Refresh indicator disappears when complete
- [ ] Maintains current filter selection
- [ ] Resets to offset 0 (first page)

### 6. Auto-Refresh

**Test Steps**:
1. Stay on Transaction History screen for 30+ seconds
2. Observe automatic data refresh

**Expected Results**:
- [ ] Data refreshes automatically every 30 seconds
- [ ] No visual disruption (smooth update)
- [ ] Maintains scroll position
- [ ] Maintains filter selection

### 7. Back Navigation

**Test Steps**:
1. From Transaction History screen, tap back button
2. Observe navigation

**Expected Results**:
- [ ] Returns to Broker Dashboard
- [ ] Wallet card still visible with updated data
- [ ] Tab navigation still works (can switch tabs)

### 8. Empty States

**Test Steps**:
1. Test with empty transaction list
2. Test with filters that have no matches

**Expected Results**:
- [ ] "No transactions yet" shows when all transactions empty
- [ ] "No [status] transactions" shows when filter has no matches
- [ ] Message is centered and uses muted text color

### 9. Error Handling

**Test Steps**:
1. **Network Error**: Disconnect from API and try to load wallet
2. **API Error**: Stop backend server
3. **Timeout**: Simulate slow API response

**Expected Results**:
- [ ] Wallet card shows "Unable to load wallet balance" error
- [ ] Transaction screen handles errors gracefully
- [ ] No app crashes
- [ ] Can retry with pull-to-refresh
- [ ] Error messages are user-friendly

### 10. Loading States

**Test Steps**:
1. Observe initial load of wallet card
2. Observe initial load of transaction screen
3. Observe pull-to-refresh loading

**Expected Results**:
- [ ] Wallet card shows loading spinner with "Loading wallet..." text
- [ ] Transaction screen shows centered loading spinner
- [ ] Pull-to-refresh shows native refresh indicator
- [ ] Loading states don't flash too quickly (min display time)

## API Response Testing

### Test with Mock Data

**Balance Response** (`GET /api/wallet/balance`):
```json
{
  "balance": 123456,
  "pendingBalance": 5000
}
```

**Expected Display**:
- Available Balance: $1,235
- Pending: $50

**Transactions Response** (`GET /api/wallet/transactions`):
```json
[
  {
    "id": "tx_1",
    "amount": 50000,
    "type": "deposit",
    "status": "completed",
    "createdAt": "2025-03-15T10:30:00Z",
    "bookingId": "booking_abc123def456"
  },
  {
    "id": "tx_2",
    "amount": -2500,
    "type": "fee",
    "status": "completed",
    "createdAt": "2025-03-14T14:20:00Z"
  },
  {
    "id": "tx_3",
    "amount": 100000,
    "type": "payout",
    "status": "pending",
    "createdAt": "2025-03-13T09:15:00Z",
    "bookingId": "booking_xyz789ghi012"
  }
]
```

**Expected Display**:
- Transaction 1: "+$500" in green, "Deposit", "completed" badge, "booking_abc" link
- Transaction 2: "-$25" in red, "Fee", "completed" badge
- Transaction 3: "+$1,000" in green, "Payout", "pending" badge, "booking_xyz" link

## Edge Cases

### 1. Very Large Amounts
**Test**: Balance of $1,000,000+
**Expected**: Formatted with commas: "$1,000,000"

### 2. Negative Balance
**Test**: Balance of -$500
**Expected**: Shows "-$500"

### 3. Zero Values
**Test**: Balance of $0, pending of $0
**Expected**: Available shows "$0", pending section hidden

### 4. Long Transaction List
**Test**: 50+ transactions
**Expected**: Smooth scrolling, no performance issues

### 5. Rapid Filter Switching
**Test**: Quickly tap different filter buttons
**Expected**: No crashes, smooth transitions

### 6. Simultaneous Refresh
**Test**: Pull-to-refresh while auto-refresh triggers
**Expected**: Handles gracefully, no duplicate requests

## Performance Checks

- [ ] Wallet card loads in < 1 second (local API)
- [ ] Transaction list loads in < 2 seconds (local API)
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks on navigation
- [ ] React Query cache working (instant load on second visit)

## Accessibility

- [ ] Touch targets are at least 44x44 points
- [ ] Text is readable (sufficient contrast)
- [ ] Buttons have clear labels
- [ ] Status colors have sufficient contrast

## Cross-Platform

If testing on both iOS and Android:

- [ ] iOS: Navigation gestures work (swipe back)
- [ ] iOS: Pull-to-refresh feels native
- [ ] Android: Back button works
- [ ] Android: Material design elements
- [ ] Both: Consistent layout and spacing

## Device Testing

Test on multiple screen sizes:
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 (standard)
- [ ] iPhone 14 Pro Max (large)
- [ ] Android phone (various sizes)

## Integration Testing

### With Other Features

1. **After Payment**:
   - Make a payment/deposit
   - Check wallet balance updates
   - Verify new transaction appears

2. **After Booking**:
   - Create/complete a booking
   - Check for related transaction
   - Verify booking ID link

3. **Multi-User**:
   - Login as different broker users
   - Verify each sees their own wallet data
   - No data leakage between users

## Debugging Tips

### If Wallet Card Doesn't Appear:
1. Check API endpoint: `curl http://localhost:3001/api/wallet/balance -H "Authorization: Bearer <token>"`
2. Check React Query DevTools for query state
3. Verify component is imported in BrokerDashboard
4. Check console for errors

### If Transactions Don't Load:
1. Check API endpoint: `curl http://localhost:3001/api/wallet/transactions -H "Authorization: Bearer <token>"`
2. Verify transaction array structure matches types
3. Check network tab for failed requests
4. Verify navigation is set up correctly

### If Navigation Fails:
1. Verify BrokerStackNavigator is used (not BrokerTabsNavigator)
2. Check navigation types match
3. Ensure WalletTransactionsScreen is imported
4. Check console for navigation errors

## Sign-Off Checklist

Before marking as complete:

- [ ] All manual tests pass
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Performance is acceptable
- [ ] Works on iOS and Android
- [ ] Error states handled gracefully
- [ ] Documentation is complete
- [ ] Code follows project patterns

## Known Limitations

1. **Pagination**: Currently loads only first page (20 transactions)
   - Future: Implement infinite scroll or "Load More" button

2. **Offline Support**: No offline caching beyond React Query
   - Future: Consider using React Query persistence

3. **Real-time Updates**: Uses polling (30s interval)
   - Future: Consider WebSocket for real-time updates

4. **Transaction Details**: No detail modal/screen
   - Future: Tap transaction to view full details

5. **Export**: No export functionality
   - Future: Add CSV/PDF export
