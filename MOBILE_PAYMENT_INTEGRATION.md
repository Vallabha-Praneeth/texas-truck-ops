# Mobile Payment Integration Complete

**Date**: March 16, 2026
**Status**: ✅ Complete - Ready for Testing

---

## Overview

Integrated Stripe payment flow into the mobile app's broker booking screen. Brokers can now initiate payments for deposits, which opens Stripe Checkout in the browser, and automatically confirms bookings after successful payment.

---

## Changes Made

### 1. API Client Updates (`apps/mobile/src/lib/api.ts`)

Added new API methods for payments and wallet:

```typescript
payments: {
  createDepositSession: (
    bookingId: string,
    amountCents: number,
    successUrl: string,
    cancelUrl: string
  ) =>
    apiClient.post<{ sessionId: string; url: string }>('/payments/deposit', {
      bookingId,
      amountCents,
      successUrl,
      cancelUrl,
    }),
},

wallet: {
  getBalance: () =>
    apiClient.get<{ balance: number; pendingBalance: number }>(
      '/wallet/balance'
    ),
  getTransactions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<
      {
        id: string;
        amount: number;
        type: string;
        status: string;
        createdAt: string;
        bookingId?: string;
      }[]
    >('/wallet/transactions', { params }),
},
```

**Files Changed:**
- `/apps/mobile/src/lib/api.ts` (lines 333-363)

---

### 2. Payment Hook (`apps/mobile/src/hooks/usePayment.ts`)

Created new React Query mutation hook for payment operations:

```typescript
export function useCreateDepositSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      amountCents,
      successUrl,
      cancelUrl,
    }) =>
      api.payments.createDepositSession(
        bookingId,
        amountCents,
        successUrl,
        cancelUrl
      ),
    onSuccess: (_, variables) => {
      // Invalidate bookings to refresh after payment
      queryClient.invalidateQueries({ queryKey: bookingsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.bookingId),
      });
    },
  });
}
```

**Files Created:**
- `/apps/mobile/src/hooks/usePayment.ts`

**Files Modified:**
- `/apps/mobile/src/hooks/index.ts` (added export)

---

### 3. Broker Bookings Screen (`apps/mobile/src/screens/broker/BrokerBookingsScreen.tsx`)

#### Added Payment Flow

**New Imports:**
```typescript
import { Alert, Linking } from 'react-native';
import { useCreateDepositSession } from '@/hooks';
```

**New Payment Handler:**
```typescript
const handlePayment = async (bookingId: string, amountCents: number) => {
  setActionError(null);
  setActiveBookingId(bookingId);

  try {
    // Create Stripe checkout session
    const { url } = await createDepositSession.mutateAsync({
      bookingId,
      amountCents,
      successUrl: 'ledbillboard://payment-success',
      cancelUrl: 'ledbillboard://payment-cancel',
    });

    // Open Stripe checkout in browser
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);

      // Show message about payment
      Alert.alert(
        'Payment Started',
        'Complete the payment in your browser. The booking will be confirmed automatically after successful payment.',
        [
          {
            text: 'Check Payment Status',
            onPress: () => void refetch(),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } else {
      throw new Error('Cannot open payment URL');
    }
  } catch (error) {
    setActionError(
      error instanceof Error
        ? error.message
        : 'Failed to initiate payment.'
    );
  } finally {
    setActiveBookingId(null);
  }
};
```

**Button Update:**
Changed "Confirm Deposit" button from:
```typescript
onPress={() => void handleTransition(booking.id, 'confirmed')}
```

To:
```typescript
onPress={() => void handlePayment(booking.id, booking.amountCents)}
```

Button text changed from "Confirm Deposit" to "Pay Deposit".

**Files Modified:**
- `/apps/mobile/src/screens/broker/BrokerBookingsScreen.tsx` (lines 1-11, 29-33, 47-86, 162-170, 182-184)

---

### 4. Environment Configuration (`apps/mobile/.env`)

Created environment configuration to point to the correct API server:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3001/api

# Environment
EXPO_PUBLIC_ENV=development
```

**Files Created:**
- `/apps/mobile/.env`

**Rationale:** The API server is running on port 3001 (per INTEGRATION_COMPLETE.md), but the default in api.ts was port 8081. This ensures the mobile app connects to the correct backend.

---

## Payment Flow

### User Journey:

1. **Broker views bookings** in `BrokerBookingsScreen`
2. **Sees booking with status `pending_deposit`**
3. **Clicks "Pay Deposit" button**
4. **App calls** `POST /api/payments/deposit` with:
   - `bookingId`
   - `amountCents`
   - `successUrl`: `ledbillboard://payment-success`
   - `cancelUrl`: `ledbillboard://payment-cancel`
5. **Backend returns** Stripe Checkout session URL
6. **App opens Stripe Checkout** in browser via `Linking.openURL()`
7. **User completes payment** in Stripe
8. **Stripe webhook** calls backend at `POST /api/payments/stripe/webhook`
9. **Backend updates booking** status to `confirmed`
10. **User returns to app** and taps "Check Payment Status" or waits for auto-refresh (10s interval)
11. **Booking now shows** status `confirmed`

### Technical Flow:

```
BrokerBookingsScreen
  ↓ User clicks "Pay Deposit"
useCreateDepositSession.mutateAsync()
  ↓ POST /api/payments/deposit
Backend creates Stripe Checkout session
  ↓ Returns { sessionId, url }
Linking.openURL(url)
  ↓ Opens browser
User completes payment in Stripe
  ↓ Stripe sends webhook
POST /api/payments/stripe/webhook
  ↓ Backend verifies signature
Backend creates wallet_transaction (deposit)
Backend updates booking status → confirmed
  ↓ User returns to app
useBookings refetch (auto or manual)
  ↓ Booking status updated in UI
```

---

## Backend API Integration

### Endpoints Used:

**POST /api/payments/deposit**
- **Auth**: Required (JWT)
- **Body**:
  ```json
  {
    "bookingId": "uuid",
    "amountCents": 100000,
    "successUrl": "ledbillboard://payment-success",
    "cancelUrl": "ledbillboard://payment-cancel"
  }
  ```
- **Response**:
  ```json
  {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
  ```

**POST /api/payments/stripe/webhook**
- **Auth**: None (webhook signature verification)
- **Headers**: `stripe-signature`
- **Body**: Raw Stripe event
- **Handled Events**:
  - `payment_intent.succeeded` → Mark transaction as completed
  - `payment_intent.payment_failed` → Mark transaction as failed
  - `checkout.session.completed` → Confirm booking
  - `checkout.session.expired` → Log expiration

---

## Testing Checklist

### Prerequisites:
- ✅ Backend API running on `http://localhost:3001/api`
- ✅ Stripe test keys configured in `packages/api/.env`
- ✅ Database migrations applied (0004: wallet_transactions)
- ✅ Mobile app environment configured (`apps/mobile/.env`)

### Manual Test Steps:

1. **Start Backend**
   ```bash
   cd packages/api
   pnpm dev
   ```

2. **Start Mobile App**
   ```bash
   cd apps/mobile
   pnpm start
   # Press 'i' for iOS or 'a' for Android
   ```

3. **Create Test Booking**
   - Log in as broker user
   - Create a booking (or use existing test data)
   - Ensure booking status is `pending_deposit`

4. **Test Payment Flow**
   - Navigate to Broker Bookings screen
   - Find booking with "Pay Deposit" button
   - Click "Pay Deposit"
   - Verify Stripe Checkout opens in browser
   - Complete payment with test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Click "Pay"
   - Return to app
   - Click "Check Payment Status"
   - Verify booking status changes to `confirmed`

5. **Test Error Handling**
   - Test with invalid booking ID (should show error)
   - Test with cancelled payment (click "Back" in Stripe)
   - Test with expired session (wait 24 hours without paying)

### Expected Results:

✅ "Pay Deposit" button appears for `pending_deposit` bookings
✅ Clicking button opens Stripe Checkout in browser
✅ Alert dialog appears with instructions
✅ After successful payment, booking status updates to `confirmed`
✅ Error messages display for failed payments
✅ Bookings list auto-refreshes every 10 seconds

---

## Known Limitations

1. **Deep Linking Not Implemented**
   - Success/cancel URLs (`ledbillboard://payment-success`) are placeholders
   - User must manually return to app after payment
   - Future improvement: Implement deep linking to auto-return

2. **No Payment Status Polling**
   - App relies on manual refresh or 10s auto-refresh interval
   - Future improvement: Add webhook listener or SSE for real-time updates

3. **No Payment Confirmation Screen**
   - User sees alert dialog only
   - Future improvement: Add dedicated payment success/failure screen

4. **Browser-Based Payment Only**
   - Opens external browser, not WebView
   - Future improvement: Use WebView for in-app payment experience

---

## Next Steps

### Immediate (To Complete Mobile Payment UX):

1. **Implement Deep Linking** (1-2 hours)
   - Configure URL scheme in `app.json`
   - Handle `ledbillboard://payment-success` and `ledbillboard://payment-cancel`
   - Auto-refresh bookings on return from payment

2. **Add Payment Confirmation Screen** (1 hour)
   - Create new screen for payment success/failure
   - Show transaction details
   - Add "View Booking" button

3. **Test on Real Device** (30 mins)
   - Verify Stripe Checkout works on iOS/Android
   - Test deep linking (after implementation)
   - Test network errors and edge cases

### Later (Additional Features):

4. **Wallet Dashboard** (2-3 hours)
   - Display wallet balance on dashboard
   - Show transaction history
   - Add "Add Funds" button

5. **Payment History** (1-2 hours)
   - Create transaction list screen
   - Filter by booking, type, status
   - Export transactions to CSV

6. **WebView Integration** (2-3 hours)
   - Replace `Linking.openURL` with WebView
   - Keep user in-app during payment
   - Auto-detect payment completion

---

## Files Summary

### Created:
- `/apps/mobile/src/hooks/usePayment.ts`
- `/apps/mobile/.env`
- `/MOBILE_PAYMENT_INTEGRATION.md` (this file)

### Modified:
- `/apps/mobile/src/lib/api.ts`
- `/apps/mobile/src/hooks/index.ts`
- `/apps/mobile/src/screens/broker/BrokerBookingsScreen.tsx`

**Total Lines Changed:** ~100 lines

---

## Architecture Notes

### Why Browser-Based Checkout?

- **Stripe Compliance**: Stripe Checkout is PCI-compliant out-of-the-box
- **Security**: No card data touches our servers or app
- **Simplicity**: No need to implement custom payment UI
- **Trust**: Users see Stripe's trusted checkout interface

### Why Not WebView?

- **Testing First**: Browser-based is easier to test and debug
- **Future Iteration**: WebView can be added in Phase 2
- **User Experience**: Browser checkout is still acceptable for MVP

### Payment Status Updates

- **Current**: 10-second polling + manual refresh
- **Future**: Server-Sent Events (SSE) for real-time updates
- **Alternative**: WebSocket connection for instant status changes

---

## Security Considerations

✅ **JWT Authentication**: All payment endpoints require valid JWT token
✅ **Webhook Verification**: Stripe webhook signature verified on backend
✅ **Amount Validation**: Backend validates booking amount vs payment amount
✅ **HTTPS Required**: Stripe requires HTTPS in production (dev uses HTTP)
✅ **No Card Data**: Card details never touch our app or servers

---

## Questions or Issues?

- **API Documentation**: http://localhost:3001/api/docs
- **Backend Integration**: `/INTEGRATION_COMPLETE.md`
- **Payment Setup**: `/SETUP_CREDENTIALS.md`
- **Stripe Test Cards**: https://stripe.com/docs/testing

**Well done! 🚀**
