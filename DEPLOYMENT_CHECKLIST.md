# Deployment Checklist - Booking & Search Features

**Date**: March 18, 2026
**Features**: Booking & Payment Flow + Search & Discovery
**Version**: v1.0.0

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

#### Stripe Account (Required for Payments)
- [ ] Create Stripe account at https://stripe.com
- [ ] Get **Test API Keys** from Dashboard → Developers → API keys
  - [ ] Copy `Publishable key` (starts with `pk_test_`)
  - [ ] Copy `Secret key` (starts with `sk_test_`)
- [ ] Set up **Webhook Endpoint**
  - [ ] Dashboard → Developers → Webhooks → Add endpoint
  - [ ] URL: `https://your-api-domain.com/api/payments/webhook`
  - [ ] Events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - [ ] Copy `Signing secret` (starts with `whsec_`)

#### Environment Variables

**Backend (`packages/api/.env`)**
```bash
# Existing variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...

# NEW - Add these for payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...  # For admin dashboard
```

**Mobile (`apps/mobile/.env`)**
```bash
# Existing variables
EXPO_PUBLIC_API_URL=http://localhost:3001/api

# NEW - Add these for payments
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Admin (`apps/admin/.env.local`)**
```bash
# Existing variables
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# NEW - Add these
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🗄️ Database Migration

### Step 1: Backup Current Database
```bash
# Create backup before migration
cd packages/db
npm run db:backup  # Or use your backup method

# Alternative: pg_dump if using Postgres directly
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Review Migrations
```bash
# Check what migrations will be applied
cd packages/db

# Review migration files
cat drizzle/0004_payments_table.sql
cat drizzle/0004_search_optimization.sql
```

**What will be created:**
- ✅ `payments` table with status enum
- ✅ 9 search optimization indexes
- ✅ `price_cents` column on `availability_slots`
- ✅ Foreign keys and constraints

### Step 3: Apply Migrations
```bash
# Apply both migrations
cd packages/db
npm run db:push

# Verify migrations applied
psql $DATABASE_URL -c "\dt"  # List tables (should see 'payments')
psql $DATABASE_URL -c "\d payments"  # Describe payments table
psql $DATABASE_URL -c "\di"  # List indexes (should see new search indexes)
```

### Step 4: Verify Schema
```bash
# Check payments table exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments;"

# Check price_cents column exists
psql $DATABASE_URL -c "SELECT id, price_cents FROM availability_slots LIMIT 1;"

# Check indexes created
psql $DATABASE_URL -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename IN ('availability_slots', 'payments', 'trucks')
  ORDER BY tablename, indexname;
"
```

---

## 📦 Dependencies Installation

### Backend (API)
```bash
cd packages/api

# Install Stripe SDK
npm install stripe

# Verify installation
npm list stripe
```

### Mobile (React Native)
```bash
cd apps/mobile

# Install Stripe React Native SDK
npm install @stripe/stripe-react-native

# iOS: Install pods
cd ios && pod install && cd ..

# Verify installation
npm list @stripe/stripe-react-native
```

### Admin (Next.js)
```bash
cd apps/admin

# No new dependencies needed
# Admin uses API endpoints only
```

### Shared Packages
```bash
# Build shared packages in order
cd packages/shared
npm run build

cd ../db
npm run build

cd ../api
npm run build
```

---

## 🔧 Configuration Updates

### 1. Update Slot Creation to Include Price

**File**: Wherever slots are created (operator screens)

```typescript
// When creating a slot, now include priceCents
const slotData = {
  truckId: '...',
  startAt: '...',
  endAt: '...',
  region: 'DFW',
  radiusMiles: 50,
  priceCents: 25000, // NEW: $250.00 in cents
  // ... other fields
};
```

### 2. Stripe Configuration in Mobile App

**File**: `apps/mobile/App.tsx` or root component

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      {/* Your app content */}
    </StripeProvider>
  );
}
```

### 3. API Module Configuration

**File**: `packages/api/src/app.module.ts`

Verify PaymentsModule is imported:
```typescript
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // ... other modules
    PaymentsModule,  // Should be present
  ],
})
export class AppModule {}
```

---

## ✅ Testing Checklist

### Backend API Testing

```bash
# Start API in development mode
cd packages/api
npm run start:dev
```

#### Test 1: Search Slots
```bash
# Test basic search
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/slots/search?region=DFW"

# Expected: JSON with slots array, pagination, filters

# Test with filters
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/slots/search?region=DFW&minPrice=10000&maxPrice=50000&sortBy=price&sortOrder=asc"

# Expected: Filtered and sorted results
```

#### Test 2: Create Payment
```bash
# Get a booking ID first
BOOKING_ID="..."

# Create payment intent
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "'$BOOKING_ID'"}'

# Expected: JSON with payment ID, clientSecret, amountCents
```

#### Test 3: Webhook (Local Testing)
```bash
# Use Stripe CLI for local webhook testing
stripe listen --forward-to localhost:3001/api/payments/webhook

# Trigger test payment
stripe trigger payment_intent.succeeded

# Check API logs for webhook received
```

### Mobile App Testing

```bash
# Start mobile app
cd apps/mobile
npm start
```

#### Test Checklist:
- [ ] **Search Screen**
  - [ ] Open broker search screen
  - [ ] Apply filters (region, price, date)
  - [ ] Verify results update
  - [ ] Test sorting (price, date)
  - [ ] Clear filters works
  - [ ] Pull-to-refresh works

- [ ] **Payment Flow**
  - [ ] Navigate to bookings
  - [ ] Find booking with "pending_deposit" status
  - [ ] Click "Pay Deposit" button
  - [ ] Payment screen opens
  - [ ] Card field renders
  - [ ] Enter test card: `4242 4242 4242 4242`
  - [ ] Expiry: Any future date (e.g., 12/25)
  - [ ] CVC: Any 3 digits (e.g., 123)
  - [ ] Click "Pay" button
  - [ ] Payment processes successfully
  - [ ] Booking status updates to "confirmed"
  - [ ] Success message shown

### Admin Dashboard Testing

```bash
# Start admin app
cd apps/admin
npm run dev
```

#### Test Checklist:
- [ ] **Bookings Dashboard** (`/bookings`)
  - [ ] Statistics display correctly
  - [ ] Bookings list loads
  - [ ] Filter by status works
  - [ ] Search functionality works
  - [ ] Payment status shown

- [ ] **Analytics Dashboard** (`/analytics`)
  - [ ] Search metrics display
  - [ ] Top regions chart
  - [ ] Filter usage statistics
  - [ ] Time range selector works

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# Run all tests
npm run test

# Lint all code
npm run lint

# Type check
npm run typecheck

# Build all packages
npm run build
```

### Step 2: Environment Variables (Production)

**Update Production Environment Variables:**

```bash
# API (Production)
STRIPE_SECRET_KEY=sk_live_...  # CHANGE to live key
STRIPE_WEBHOOK_SECRET=whsec_... # CHANGE to live webhook secret
STRIPE_PUBLISHABLE_KEY=pk_live_... # CHANGE to live publishable key

# Mobile (Production)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_API_URL=https://api.your-domain.com/api

# Admin (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

### Step 3: Database Migration (Production)

```bash
# 1. Backup production database first!
pg_dump $PRODUCTION_DATABASE_URL > prod_backup_$(date +%Y%m%d).sql

# 2. Apply migrations in production
DATABASE_URL=$PRODUCTION_DATABASE_URL npm run db:push

# 3. Verify
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM payments;"
```

### Step 4: Deploy Services

**API:**
```bash
# Build
cd packages/api
npm run build

# Deploy (example for Railway/Render/Heroku)
git push production main

# Or Docker
docker build -t api:latest .
docker push your-registry/api:latest
```

**Mobile:**
```bash
cd apps/mobile

# Update app version in app.json
# Increment version: 1.0.0 → 1.1.0

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Admin:**
```bash
cd apps/admin

# Build
npm run build

# Deploy (example for Vercel)
vercel --prod
```

### Step 5: Stripe Production Setup

- [ ] **Switch to Live Mode** in Stripe Dashboard
- [ ] Create production webhook endpoint
  - URL: `https://api.your-domain.com/api/payments/webhook`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Update environment variables with live keys
- [ ] Enable required payment methods (cards, etc.)
- [ ] Set up business information
- [ ] Configure email receipts
- [ ] Test with live card (small amount)

---

## 🔍 Post-Deployment Verification

### 1. Smoke Tests (Production)

```bash
# Test search API
curl "https://api.your-domain.com/api/slots/search?region=DFW"

# Test health endpoint
curl "https://api.your-domain.com/api/health"

# Check database connection
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM payments;"
```

### 2. User Flow Test

**Complete end-to-end test:**
1. [ ] Open mobile app (production build)
2. [ ] Login as broker
3. [ ] Use search to find trucks
4. [ ] Create booking request
5. [ ] Login as operator (different account)
6. [ ] Accept booking
7. [ ] Login back as broker
8. [ ] Complete payment with real card (small amount)
9. [ ] Verify booking confirmed
10. [ ] Check admin dashboard shows booking
11. [ ] Verify Stripe dashboard shows payment

### 3. Monitor Logs

```bash
# API logs - check for errors
tail -f /var/log/api/error.log

# Database queries - check performance
# Enable slow query log in PostgreSQL
psql $PRODUCTION_DATABASE_URL -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%availability_slots%'
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

---

## 📊 Monitoring Setup

### 1. Database Performance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. Stripe Dashboard

Monitor in Stripe Dashboard:
- [ ] Payment success rate
- [ ] Failed payment reasons
- [ ] Webhook delivery status
- [ ] Dispute rate (should be 0%)
- [ ] Refund requests

### 3. Application Metrics

**Key Metrics to Track:**
- Search API response time (<500ms target)
- Payment success rate (>95% target)
- Booking completion rate
- Popular search filters
- Average booking value
- Peak usage times

---

## 🆘 Rollback Plan

### If Issues Occur

**Database Rollback:**
```bash
# Revert migrations
psql $DATABASE_URL -c "DROP TABLE payments CASCADE;"
psql $DATABASE_URL -c "ALTER TABLE availability_slots DROP COLUMN price_cents;"

# Drop indexes
psql $DATABASE_URL -c "
  DROP INDEX IF EXISTS slots_price_idx;
  DROP INDEX IF EXISTS slots_is_booked_idx;
  -- ... drop other indexes
"

# Or restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

**Code Rollback:**
```bash
# Revert to previous version
git revert HEAD~2  # Reverts last 2 commits
git push origin main

# Or redeploy previous version
git checkout v1.0.0  # Previous stable version
# Deploy this version
```

**Emergency Contact:**
- Stripe Support: https://support.stripe.com
- Database Admin: [your-dba@email.com]
- DevOps Lead: [devops@email.com]

---

## 📚 Documentation References

**Created Documentation:**
- Booking Flow: `/docs/BOOKING_PAYMENT_FLOW.md`
- Payment Setup: `/docs/PAYMENT_SETUP_GUIDE.md`
- API Testing: `/docs/API_TESTING.md`
- Search Features: `/docs/SEARCH_AND_DISCOVERY.md`
- Testing Guide: `/docs/testing/SEARCH_TESTING_GUIDE.md`
- Quick Reference: `/docs/QUICK_REFERENCE.md`

**External References:**
- Stripe API Docs: https://stripe.com/docs/api
- Stripe React Native: https://github.com/stripe/stripe-react-native
- PostGIS Docs: https://postgis.net/documentation/
- Drizzle ORM: https://orm.drizzle.team/docs/overview

---

## ✅ Final Checklist

Before marking deployment complete:

### Pre-Deploy
- [ ] All tests passing
- [ ] Database backup created
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Migrations reviewed

### Deploy
- [ ] Migrations applied successfully
- [ ] API deployed and healthy
- [ ] Mobile app built and submitted
- [ ] Admin dashboard deployed
- [ ] Stripe webhook configured

### Verify
- [ ] Search API working
- [ ] Payment flow working end-to-end
- [ ] Admin dashboards displaying data
- [ ] No errors in logs
- [ ] Performance metrics acceptable

### Post-Deploy
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan documented

---

## 🎯 Success Criteria

Deployment is considered successful when:

1. ✅ Users can search and filter billboard slots
2. ✅ Users can complete bookings with payment
3. ✅ Payments process through Stripe
4. ✅ Webhooks update booking status
5. ✅ Admin dashboards show real-time data
6. ✅ Search queries return in <500ms
7. ✅ No critical errors in production logs
8. ✅ Payment success rate >95%

---

**Deployment Lead**: _____________
**Date Deployed**: _____________
**Version**: v1.1.0
**Status**: ⬜ Pending | ⬜ In Progress | ⬜ Complete

