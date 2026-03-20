# Payment Dashboard Usage Guide

## Quick Start

The payment dashboard is now available at `/payments` route in the admin app.

## Adding Navigation Link to Broker Dashboard

To add a link to the payment dashboard from the broker dashboard, you can add this to `/apps/admin/app/broker/page.tsx`:

```tsx
import { useRouter } from 'next/navigation';

// In your component:
const router = useRouter();

// Add this button somewhere in your JSX:
<Button
  variant="outline"
  onClick={() => router.push('/payments')}
>
  View Payments
</Button>
```

## Example: Full Integration in Broker Dashboard

Here's a complete example of adding a "Payments" tab to the broker dashboard:

```tsx
<Tabs defaultValue="requests" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="requests">My Requests</TabsTrigger>
    <TabsTrigger value="bookings">My Bookings</TabsTrigger>
    <TabsTrigger value="offers">Offers</TabsTrigger>
    <TabsTrigger value="payments">Payments</TabsTrigger>
  </TabsList>

  <TabsContent value="requests">
    {/* Existing requests content */}
  </TabsContent>

  <TabsContent value="bookings">
    {/* Existing bookings content */}
  </TabsContent>

  <TabsContent value="offers">
    {/* Existing offers content */}
  </TabsContent>

  <TabsContent value="payments">
    <Card>
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>View and manage your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push('/payments')}>
          Open Full Payment Dashboard
        </Button>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

## Using Individual Components

### 1. Show Payment History for a Booking

```tsx
import { BookingPaymentHistory } from '@/components/BookingPaymentHistory';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import { useState } from 'react';

function BookingDetailsPage({ bookingId }) {
  const [selectedTxn, setSelectedTxn] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {/* Your booking details */}

      <BookingPaymentHistory
        bookingId={bookingId}
        onTransactionClick={(transaction) => {
          setSelectedTxn(transaction.id);
          setShowModal(true);
        }}
      />

      <TransactionDetailsModal
        transactionId={selectedTxn}
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTxn(null);
        }}
      />
    </div>
  );
}
```

### 2. Show Recent Transactions

```tsx
import { TransactionList } from '@/components/TransactionList';
import { getTransactions } from '@/lib/wallet-api';
import { useEffect, useState } from 'react';

function RecentTransactionsWidget() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTransactions({ limit: 5 });
      setTransactions(data.transactions);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionList
          transactions={transactions}
          loading={loading}
          showFilters={false}
        />
      </CardContent>
    </Card>
  );
}
```

## API Functions Available

All these functions are available from `@/lib/wallet-api`:

```tsx
import {
  getWalletBalance,
  getTransactions,
  getTransactionById,
  getBookingTransactions,
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionStatusColor,
} from '@/lib/wallet-api';

// Get wallet balance
const balance = await getWalletBalance();
// { userId, balance, balanceCents }

// Get transactions with filters
const result = await getTransactions({
  type: 'deposit',
  status: 'completed',
  limit: 20,
  offset: 0,
});
// { transactions[], total, limit, offset }

// Get single transaction
const transaction = await getTransactionById('txn-id');

// Get booking transactions
const bookingTxns = await getBookingTransactions('booking-id');

// Format currency
const formatted = formatCurrency(12345); // "$123.45"
const formatted2 = formatCurrency("12345"); // "$123.45"

// Get type label
const label = getTransactionTypeLabel('platform_fee'); // "Platform Fee"

// Get status color
const color = getTransactionStatusColor('completed'); // "success"
```

## Transaction Types

- `deposit`: Customer deposits money for a booking
- `withdrawal`: User withdraws from wallet
- `payout`: Platform pays operator for completed booking
- `platform_fee`: Platform fee deducted from booking
- `refund`: Money refunded to customer

## Transaction Statuses

- `pending`: Transaction initiated but not completed
- `completed`: Transaction successfully completed
- `failed`: Transaction failed

## Styling Customization

All components use Tailwind CSS and can be customized:

```tsx
<TransactionList
  transactions={transactions}
  loading={loading}
  className="custom-class"
/>
```

## Error Handling

All API functions throw `ApiError` on failure:

```tsx
import { ApiError } from '@/lib/api-client';

try {
  const transactions = await getTransactions();
} catch (err) {
  if (err instanceof ApiError) {
    console.log('Status:', err.status);
    console.log('Message:', err.message);
    console.log('Data:', err.data);
  }
}
```

## Testing Locally

1. Start the backend API:
   ```bash
   cd packages/api
   npm run dev
   ```

2. Start the admin app:
   ```bash
   cd apps/admin
   npm run dev
   ```

3. Navigate to `http://localhost:8001/payments`

## Production Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_API_URL` in `.env.production`
- [ ] Test all filters and pagination
- [ ] Verify Stripe dashboard links work with production keys
- [ ] Test with real transaction data
- [ ] Ensure proper authentication is required
- [ ] Test error scenarios (network failures, etc.)
- [ ] Verify responsive design on mobile devices
