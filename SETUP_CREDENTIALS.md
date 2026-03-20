# API Credentials Setup Guide

This guide will help you get the required API credentials for the three new features: Stripe payments, Twilio SMS, and Supabase storage.

---

## 🔑 Required Credentials

You need to obtain credentials for:
1. **Stripe** (Payment processing)
2. **Twilio** (SMS OTP delivery)
3. **Supabase** (File storage for proof uploads)

---

## 1️⃣ Stripe Setup (15 minutes)

### Step 1: Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Sign up with your email
3. Complete account verification (you can skip business details for testing)

### Step 2: Get Test API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" to see your Secret key
3. Copy the following keys:
   - **Publishable key**: `pk_test_...` (starts with `pk_test_`)
   - **Secret key**: `sk_test_...` (starts with `sk_test_`)

### Step 3: Update .env File
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Step 4: Set Up Webhook (for local testing)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local API
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook

# Copy the webhook signing secret (starts with whsec_)
# Add to .env:
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

**Note**: Keep the `stripe listen` command running in a terminal while testing payments.

---

## 2️⃣ Twilio Setup (10 minutes)

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up (you get **$15 free credit** on trial)
3. Verify your email and phone number

### Step 2: Get Credentials
1. Go to https://console.twilio.com/
2. On the dashboard, you'll see:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "Show" to reveal

### Step 3: Get a Phone Number
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click "Buy a number"
3. Search for a number with **SMS** capability
4. Buy the number (uses $1 of your trial credit)
5. Copy the phone number (format: `+1XXXXXXXXXX`)

### Step 4: Update .env File
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### Step 5: Enable Test Mode (Optional for Development)
To avoid using SMS credits during development:
```bash
TWILIO_TEST_MODE=true
```
This will log OTPs to the console instead of sending real SMS.

---

## 3️⃣ Supabase Setup (10 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `led-billboard-marketplace`
   - Database Password: (generate strong password)
   - Region: Choose closest to your location
4. Wait 2-3 minutes for project creation

### Step 2: Get API Credentials
1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Create Storage Bucket
1. Go to Storage → Buckets
2. Click "New bucket"
3. Name: `proofs`
4. Make it **Private** (uncheck "Public bucket")
5. Click "Create bucket"

### Step 4: Set Up Row Level Security (RLS)
1. Go to Storage → Policies
2. Click on the `proofs` bucket
3. Add the following policies:

**Policy 1: Allow drivers to upload proofs**
```sql
CREATE POLICY "Drivers can upload proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proofs' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 2: Allow users to view proofs for their bookings**
```sql
CREATE POLICY "Users can view their booking proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proofs'
);
```

### Step 5: Update .env File
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

---

## ✅ Verify Your Setup

### Check .env File
Your `/packages/api/.env` file should have all these configured:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_TEST_MODE=true

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_KEY=eyJ...
```

### Test the Setup

**1. Start the API server:**
```bash
cd /Users/anitavallabha/B2B
pnpm dev:api
```

**2. Test SMS OTP (in another terminal):**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1YOUR_PHONE_NUMBER"}'
```

If `TWILIO_TEST_MODE=true`, check the API console logs for the OTP.
If `TWILIO_TEST_MODE=false`, you should receive an SMS!

**3. Test Stripe Payment:**
```bash
# Get a JWT token first (login)
TOKEN="your_jwt_token_here"

# Create a deposit
curl -X POST http://localhost:3001/api/payments/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd"}'
```

This should return a Stripe Checkout URL. Open it and use test card: **4242 4242 4242 4242**.

**4. Test Proof Upload:**
Use the mobile app to capture and upload a proof photo.

---

## 💡 Tips

### Development vs Production

**Development (Current):**
- Stripe: Use test keys (`sk_test_`, `pk_test_`)
- Twilio: Use trial account + `TWILIO_TEST_MODE=true`
- Supabase: Free tier is fine

**Production (Later):**
- Stripe: Switch to live keys from https://dashboard.stripe.com/apikeys
- Twilio: Upgrade to paid account
- Supabase: Upgrade to Pro if needed
- Set `TWILIO_TEST_MODE=false`

### Free Tier Limits

**Twilio Trial:**
- $15 free credit
- Can only send SMS to verified phone numbers
- SMS cost: ~$0.0075 per message (2000 SMS with trial credit)

**Stripe Test Mode:**
- Unlimited test transactions
- No real money charged

**Supabase Free Tier:**
- 500 MB database
- 1 GB file storage
- Unlimited API requests

---

## 🆘 Troubleshooting

### Stripe Webhook Not Working
- Make sure `stripe listen` is running
- Check the webhook secret matches `.env`
- Verify API is running on port 3001

### Twilio SMS Not Sending
- Check trial account has credit
- Verify phone number is in E.164 format (+1XXXXXXXXXX)
- Check that recipient is verified (trial limitation)
- Set `TWILIO_TEST_MODE=true` to test without SMS

### Supabase Upload Failing
- Verify bucket name is exactly `proofs`
- Check RLS policies are set up correctly
- Verify API keys are correct

---

## 📚 Additional Resources

- **Stripe Docs**: https://stripe.com/docs/api
- **Twilio Docs**: https://www.twilio.com/docs/usage/api
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Testing Cards**: https://stripe.com/docs/testing#cards
- **Twilio Phone Numbers**: https://www.twilio.com/docs/phone-numbers

---

## 🎯 Next Steps

Once you have all credentials configured:
1. Test each system individually
2. Run the full integration test (booking → payment → proof → completion)
3. Update the frontend to integrate with these APIs
4. Deploy to staging environment

For any issues, check the documentation files created by the agents:
- `/docs/PAYMENT_INTEGRATION.md`
- `/packages/api/src/notifications/QUICKSTART.md`
- `/docs/proof-of-performance-setup.md`
