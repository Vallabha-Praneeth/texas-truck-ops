# Web Payment Dashboard Integration

## Overview

The Payment Management Dashboard has been successfully implemented for the LED Billboard Marketplace web admin application. This dashboard provides comprehensive visibility into all financial transactions on the platform, including deposits, payouts, platform fees, and more.

## Implementation Summary

### Files Created

#### 1. **API Utilities** (`/apps/admin/lib/`)
- **`api-client.ts`**: Core API client with authentication and error handling
  - `apiRequest()`: Makes authenticated requests with JWT token
  - `buildQueryString()`: Builds URL query strings from params
  - `ApiError`: Custom error class for API errors

- **`wallet-api.ts`**: Wallet-specific API functions
  - `getWalletBalance()`: Get user's wallet balance
  - `getTransactions()`: Get paginated transaction list with filtering
  - `getTransactionById()`: Get single transaction details
  - `getBookingTransactions()`: Get all transactions for a booking
  - `formatCurrency()`: Format cents to USD display
  - Helper functions for transaction labels and colors

#### 2. **UI Components** (`/apps/admin/components/`)
- **`ui/select.tsx`**: Radix UI select dropdown component for filters

- **`TransactionList.tsx`**: Reusable transaction list component
  - Features:
    - Filterable table (by type, status, search)
    - Click-to-view transaction details
    - Formatted currency display
    - Status badges
    - Truncated IDs for readability

- **`TransactionDetailsModal.tsx`**: Transaction details modal dialog
  - Features:
    - Full transaction information display
    - Stripe dashboard deep links (for Stripe payments)
    - Formatted timestamps
    - Metadata JSON viewer
    - Payment method details

- **`BookingPaymentHistory.tsx`**: Booking payment timeline component
  - Features:
    - Visual timeline of booking payments
    - Transaction status indicators
    - Total amount calculation
    - Click to view transaction details

#### 3. **Pages** (`/apps/admin/app/payments/`)
- **`page.tsx`**: Main payment dashboard page
  - Features:
    - Platform-wide payment metrics (KPI cards)
    - Transaction list with filtering
    - Pagination (50 items per page)
    - Search by ID, user ID, or booking ID
    - Real-time stats calculation

## Features

### 1. Dashboard Overview (KPI Cards)
- **Total Platform Revenue**: Sum of all completed platform fees
- **Total Payouts**: Sum of all completed payouts to operators
- **Pending Deposits**: Sum of pending deposit transactions
- **Success Rate**: Percentage of completed vs total transactions

### 2. Transaction List
- **Columns**: ID, Type, Amount, Status, User ID, Booking ID, Date, Action
- **Filters**:
  - By transaction type (deposit, withdrawal, payout, platform_fee, refund)
  - By status (pending, completed, failed)
  - Search by transaction ID, user ID, or booking ID
- **Pagination**: 50 transactions per page
- **Click to view**: Click any transaction row to see full details

### 3. Transaction Details View
- Full transaction information
- External transaction ID (e.g., Stripe payment intent)
- Direct link to Stripe dashboard (if applicable)
- User and booking associations
- Payment method
- Created and completed timestamps
- Metadata viewer

### 4. Booking Payment History
- Timeline view of all payments for a specific booking
- Shows deposit, platform fee, and payout flow
- Visual indicators for transaction status
- Total amount summary

## API Endpoints Used

The dashboard integrates with these backend endpoints:

```typescript
GET /api/wallet/balance
  - Get wallet balance for current user
  - Response: { userId, balance, balanceCents }

GET /api/wallet/transactions?type=X&status=Y&limit=50&offset=0
  - Get paginated transaction list with filtering
  - Query params: type, status, limit, offset
  - Response: { transactions[], total, limit, offset }

GET /api/wallet/transactions/:id
  - Get single transaction by ID
  - Response: WalletTransaction object

GET /api/wallet/bookings/:bookingId/transactions
  - Get all transactions for a specific booking
  - Response: WalletTransaction[]
```

## Usage Guide

### Accessing the Dashboard

1. **Login** to the admin app with proper credentials
2. **Navigate** to `/payments` in the browser (or add a navigation link)
3. The dashboard will load automatically with the latest transactions

### Viewing Transactions

1. **Filter** transactions using the dropdowns (Type, Status)
2. **Search** by entering IDs in the search box
3. **Click** any transaction row to view full details
4. **Navigate** between pages using pagination controls

### Viewing Booking Payment History

To integrate the payment history into a booking details page:

```tsx
import { BookingPaymentHistory } from '@/components/BookingPaymentHistory';

// In your booking details component:
<BookingPaymentHistory
  bookingId={booking.id}
  onTransactionClick={handleTransactionClick}
/>
```

### Viewing Transaction Details

The transaction details modal shows:
- Full transaction ID
- Amount and type
- Status badge
- User and booking IDs
- Payment method
- Stripe payment intent ID (with dashboard link)
- All timestamps
- Metadata JSON

## Authentication

The dashboard uses JWT token authentication:
- Token is stored in `localStorage` under key `token`
- All API requests include `Authorization: Bearer <token>` header
- If no token is found, user is redirected to login page

## Error Handling

- Network errors are caught and displayed
- API errors show user-friendly messages
- Loading states prevent multiple requests
- Failed transactions are clearly marked

## Styling

The dashboard uses:
- **Tailwind CSS** for styling
- **Radix UI** components (via shadcn/ui patterns)
- **Responsive design** for mobile/tablet/desktop
- **Consistent color scheme** matching existing admin UI

## Data Formatting

### Currency Display
- Amounts stored as cents in backend
- Displayed as USD with proper formatting: `$1,234.56`
- Uses `Intl.NumberFormat` for locale-aware formatting

### Date/Time Display
- ISO strings from backend converted to readable format
- Format: `Jan 15, 2024, 10:30 AM`
- Uses `Intl.DateTimeFormat` for consistency

### Transaction Types
- `deposit`: Deposit
- `withdrawal`: Withdrawal
- `payout`: Payout
- `platform_fee`: Platform Fee
- `refund`: Refund

### Transaction Statuses
- `pending`: Yellow/default badge
- `completed`: Green/success badge
- `failed`: Red/destructive badge

## Future Enhancements

Potential improvements for the dashboard:

1. **Charts & Graphs**
   - Transaction volume over time (line chart)
   - Revenue by region (bar chart)
   - Top brokers/operators by volume

2. **Export Functionality**
   - Export transactions to CSV
   - Download filtered results
   - Date range exports

3. **Advanced Filtering**
   - Date range picker
   - Amount range filter
   - Multi-select filters

4. **Real-time Updates**
   - WebSocket integration for live updates
   - Auto-refresh on new transactions
   - Notification badges

5. **Admin Actions**
   - Manual transaction creation
   - Refund initiation
   - Transaction notes/comments

6. **Analytics**
   - Monthly revenue reports
   - Payout schedules
   - Fee analysis

## Testing

To test the payment dashboard:

1. **Start the backend API**:
   ```bash
   cd packages/api
   npm run dev
   ```

2. **Start the admin app**:
   ```bash
   cd apps/admin
   npm run dev
   ```

3. **Access the dashboard**:
   - Navigate to `http://localhost:8001`
   - Login with test credentials
   - Go to `/payments` route

4. **Test features**:
   - Filter by different types and statuses
   - Search for transactions
   - Click transactions to view details
   - Navigate between pages

## Environment Variables

Required environment variable in `/apps/admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

For production, update to production API URL.

## Troubleshooting

### Common Issues

**Issue**: "No authentication token found"
- **Solution**: Ensure user is logged in and token exists in localStorage

**Issue**: Transactions not loading
- **Solution**: Check backend API is running on correct port (3001)

**Issue**: CORS errors
- **Solution**: Ensure backend CORS settings allow requests from admin app origin

**Issue**: Transaction details not showing
- **Solution**: Verify transaction ID exists and user has permission to view

## Integration with Existing Pages

### Adding Payment History to Booking Details

In your existing booking details page (e.g., `/apps/admin/app/broker/page.tsx`):

```tsx
import { BookingPaymentHistory } from '@/components/BookingPaymentHistory';
import { useState } from 'react';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';

// Add to your booking details component:
const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
const [showTransactionModal, setShowTransactionModal] = useState(false);

// In your JSX:
<BookingPaymentHistory
  bookingId={booking.id}
  onTransactionClick={(transaction) => {
    setSelectedTransaction(transaction.id);
    setShowTransactionModal(true);
  }}
/>

<TransactionDetailsModal
  transactionId={selectedTransaction}
  open={showTransactionModal}
  onClose={() => {
    setShowTransactionModal(false);
    setSelectedTransaction(null);
  }}
/>
```

### Adding Navigation Link

Add a link to the payment dashboard in your navigation:

```tsx
<Button
  variant="ghost"
  onClick={() => router.push('/payments')}
>
  Payments
</Button>
```

## Success Criteria

All success criteria have been met:

- ✅ Payment dashboard shows key metrics (revenue, payouts, pending, success rate)
- ✅ Transaction list with filtering (type, status) and pagination (50 per page)
- ✅ Transaction details view works with full information display
- ✅ Booking payment history displays correctly with timeline view
- ✅ Proper error handling and loading states throughout
- ✅ Responsive design using Tailwind CSS
- ✅ Search functionality for IDs
- ✅ Stripe dashboard integration for external payments

## Architecture Notes

### Component Hierarchy
```
PaymentsPage (Main Dashboard)
├── KPI Cards (Stats Display)
├── TransactionList (Table Component)
│   └── TransactionDetailsModal (Details Dialog)
└── Pagination Controls

BookingPaymentHistory (Standalone Component)
└── Timeline View
    └── Transaction Items
```

### Data Flow
1. User navigates to `/payments`
2. Page component fetches transactions from API
3. Stats calculated from transaction data
4. User interacts with filters/search
5. Component refetches with new params
6. User clicks transaction
7. Modal fetches detailed transaction data
8. User views full details with Stripe link

## Conclusion

The Payment Management Dashboard is now fully integrated into the web admin application. It provides administrators and brokers with comprehensive visibility into all financial transactions, supports filtering and search, and includes detailed transaction views with external payment system integration.

The implementation follows existing patterns in the codebase, uses the established component library, and maintains consistency with the current design system.
