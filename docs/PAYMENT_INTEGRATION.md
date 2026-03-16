# Payment Integration & Wallet System

Complete payment processing system for the LED Billboard Marketplace with Stripe integration and wallet management.

## Overview

This payment system handles:
- **Deposit payments** from brokers when booking billboards (30% upfront)
- **Wallet management** for tracking all transactions
- **Payouts** to operators when bookings are completed (85% after 15% platform fee)
- **Refunds** for cancelled bookings
- **Stripe webhook** handling for payment confirmations

## Architecture

### Database Schema

**Table: `wallet_transactions`**
```sql
- id (UUID, primary key)
- user_id (UUID, references users)
- booking_id (UUID, references bookings, nullable)
- amount (numeric 12,2)
- type (enum: deposit, withdrawal, refund, payout, platform_fee)
- status (enum: pending, completed, failed)
- payment_method (varchar 50)
- external_transaction_id (varchar 255) -- Stripe payment intent ID
- metadata (jsonb)
- created_at (timestamp)
- completed_at (timestamp, nullable)
```

**Migration**: `/packages/db/drizzle/0004_wallet_transactions.sql`

### Backend Modules

#### 1. WalletModule (`/packages/api/src/wallet/`)

**Files:**
- `wallet.module.ts` - Module definition
- `wallet.service.ts` - Business logic for wallet operations
- `wallet.controller.ts` - REST API endpoints
- `wallet-transaction.repository.ts` - Database queries
- `wallet.service.spec.ts` - Unit tests

**Key Methods:**
```typescript
// Get user wallet balance
getBalance(userId: string)

// Get transaction history with filtering
getTransactions(userId: string, filters: GetTransactionsDto)

// Create deposit transaction (pending until Stripe confirms)
createDepositTransaction(userId, bookingId, amountCents, externalTxId)

// Complete deposit (called by webhook)
completeDeposit(externalTransactionId)

// Create payout to operator
createPayoutTransaction(userId, bookingId, amountCents)

// Create platform fee record
createPlatformFeeTransaction(userId, bookingId, amountCents)

// Create refund
createRefundTransaction(userId, bookingId, amountCents)

// Create withdrawal request
createWithdrawalRequest(userId, amountCents)
```

#### 2. PaymentsModule (`/packages/api/src/payments/`)

**Files:**
- `payments.module.ts` - Module definition
- `stripe.service.ts` - Stripe SDK integration
- `payments.controller.ts` - Payment endpoints and webhook

**Key Methods:**
```typescript
// Create Stripe Checkout session
createCheckoutSession(userId, bookingId, amountCents, metadata, options)

// Create Payment Intent (for direct card payments)
createPaymentIntent(userId, bookingId, amountCents, metadata)

// Process refund
createRefund(paymentIntentId, amountCents?, reason?)

// Verify webhook signature
verifyWebhookSignature(payload, signature)

// Handle successful payment
handlePaymentSuccess(paymentIntent)

// Handle failed payment
handlePaymentFailure(paymentIntent)
```

### API Endpoints

#### Wallet Endpoints

**GET `/api/wallet/balance`**
- Get current user's wallet balance and statistics
- Auth: Required (JWT)
- Response:
```json
{
  "balance": "150.00",
  "totalDeposits": "200.00",
  "totalPayouts": "50.00",
  "totalWithdrawals": "0.00",
  "totalFees": "0.00",
  "pendingTransactions": 2
}
```

**GET `/api/wallet/transactions`**
- Get user's transaction history with pagination
- Auth: Required (JWT)
- Query params: `type`, `status`, `limit`, `offset`
- Response: Array of transactions

**GET `/api/wallet/transactions/:id`**
- Get specific transaction details
- Auth: Required (JWT)

**GET `/api/wallet/bookings/:bookingId/transactions`**
- Get all transactions for a specific booking
- Auth: Required (JWT)

#### Payment Endpoints

**POST `/api/payments/deposit`**
- Create Stripe checkout session for deposit
- Auth: Required (JWT)
- Body:
```json
{
  "bookingId": "uuid",
  "amountCents": 5000,
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```
- Response:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**POST `/api/payments/stripe/webhook`**
- Handle Stripe webhook events
- Auth: None (verified via Stripe signature)
- Headers: `stripe-signature`
- Handles events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `checkout.session.completed`
  - `checkout.session.expired`

## Payment Flow

### 1. Deposit Payment Flow

```
1. Broker accepts offer → Booking created with status "pending_deposit"
2. Frontend calls POST /api/payments/deposit
3. StripeService creates checkout session
4. WalletService creates pending deposit transaction
5. User redirected to Stripe checkout
6. User completes payment
7. Stripe sends webhook → payment_intent.succeeded
8. WalletService marks deposit as "completed"
9. BookingService transitions booking to "confirmed"
```

### 2. Payout Flow (on Booking Completion)

```
1. Broker approves proof → Booking transitions to "completed"
2. BookingService.processBookingPayout() triggered
3. Calculate amounts:
   - Total: $100.00
   - Platform fee (15%): $15.00
   - Operator payout (85%): $85.00
4. WalletService creates two transactions:
   - Payout transaction: +$85.00 (operator)
   - Platform fee transaction: -$15.00 (operator)
5. Operator can now withdraw funds
```

### 3. Refund Flow

```
1. Booking cancelled before completion
2. StripeService.createRefund(paymentIntentId)
3. Stripe processes refund
4. WalletService creates refund transaction
5. Broker's original payment returned to card
```

## Shared Types & Schemas

### Types (`/packages/shared/src/types/index.ts`)

```typescript
enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  PAYOUT = 'payout',
  PLATFORM_FEE = 'platform_fee',
}

enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

enum PaymentMethod {
  STRIPE = 'stripe',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

interface WalletTransaction {
  id: string;
  userId: string;
  bookingId?: string | null;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod?: string | null;
  externalTransactionId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  completedAt?: Date | null;
}
```

### Schemas (`/packages/shared/src/schemas/index.ts`)

```typescript
// Deposit
export const depositSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Withdrawal
export const withdrawSchema = z.object({
  amountCents: z.number().int().positive(),
  bankAccountId: z.string().optional(),
});

// Get transactions
export const getTransactionsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
```

## Environment Variables

Add to `/packages/api/.env`:

```bash
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URL (for payment redirect URLs)
APP_URL=http://localhost:3000
```

## Stripe Setup

### 1. Get Stripe API Keys

1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy:
   - Secret key (sk_test_...)
   - Publishable key (pk_test_...)

### 2. Set Up Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-api.com/api/payments/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Copy webhook signing secret (whsec_...)

### 3. Test Mode

All API keys with `_test_` are for testing:
- No real money is charged
- Use test card numbers: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

## Integration with Bookings

The `BookingService` has been updated to integrate with payments:

1. **Payment Validation** - Before transitioning from `pending_deposit` to `confirmed`, it verifies that a completed deposit transaction exists.

2. **Automatic Payouts** - When a booking transitions to `completed`, it automatically:
   - Calculates the 15% platform fee
   - Creates a payout transaction for the operator (85%)
   - Creates a platform fee transaction record

## Testing

### Unit Tests

Run wallet service tests:
```bash
cd packages/api
pnpm test wallet.service.spec.ts
```

### Manual Testing

1. **Create a deposit:**
```bash
curl -X POST http://localhost:3001/api/payments/deposit \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-uuid",
    "amountCents": 5000
  }'
```

2. **Check balance:**
```bash
curl http://localhost:3001/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT"
```

3. **List transactions:**
```bash
curl "http://localhost:3001/api/wallet/transactions?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT"
```

### Webhook Testing

Use Stripe CLI to forward webhooks to local:
```bash
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

## Security Considerations

1. **Webhook Verification** - All webhook requests verify Stripe signature
2. **Amount Validation** - All amounts are validated and stored in cents
3. **Idempotency** - Transaction creation checks for duplicates via `externalTransactionId`
4. **JWT Authentication** - All wallet endpoints require valid JWT
5. **Rate Limiting** - Apply rate limits to payment endpoints
6. **Audit Trail** - All transactions logged with metadata

## Error Handling

### Payment Failures

- Stripe webhook sends `payment_intent.payment_failed`
- Transaction marked as `failed`
- User notified to retry payment
- Booking remains in `pending_deposit` status

### Refund Failures

- Log error and notify admin
- Manual refund may be required
- Keep transaction record for audit

### Balance Validation

- Withdrawal requests check available balance
- Throw `BadRequestException` if insufficient funds

## Future Enhancements

1. **Scheduled Payouts** - Batch payouts on weekly schedule
2. **Multi-currency** - Support currencies beyond USD
3. **Saved Payment Methods** - Save cards for repeat payments
4. **Automatic Refunds** - Auto-refund on cancellation
5. **Dispute Handling** - Track and manage payment disputes
6. **Invoice Generation** - PDF invoices for transactions
7. **Tax Calculation** - Integrate tax calculation service
8. **ACH/Bank Transfers** - Add bank account withdrawal support

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe Dashboard → Webhooks for delivery status
2. Verify webhook URL is correct and accessible
3. Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
4. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Transaction Not Completing

1. Check transaction status in database
2. Verify webhook was received (check logs)
3. Check Stripe Dashboard for payment status
4. Verify `externalTransactionId` matches

### Balance Calculation Issues

1. Run manual balance calculation query
2. Check for missing `completedAt` timestamps
3. Verify transaction types are correct
4. Check for duplicate transactions

## Support

For issues or questions:
- Check Stripe Dashboard for payment details
- Review application logs for errors
- Test with Stripe test mode first
- Contact Stripe support for API issues
