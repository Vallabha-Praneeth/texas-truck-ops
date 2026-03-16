# Quick Start Guide - SMS OTP Delivery

Get SMS OTP delivery working in 5 minutes.

## Step 1: Install Twilio SDK (Required)

```bash
cd /path/to/B2B/packages/api
pnpm add twilio
```

## Step 2: Get Twilio Test Credentials

### Option A: Use Twilio Test Credentials (No Account Required)

For initial development, you can use Twilio's public test credentials:

```bash
# Add to /packages/api/.env
TWILIO_ACCOUNT_SID=ACtest123
TWILIO_AUTH_TOKEN=test_token
TWILIO_PHONE_NUMBER=+15005550006
```

**Note**: These test credentials won't send actual SMS, but will simulate success/failure.

### Option B: Free Twilio Trial Account (Recommended)

1. Sign up: https://www.twilio.com/try-twilio
2. Get credentials from Console Dashboard:
   - Account SID (starts with `AC`)
   - Auth Token (click "Show")
   - Trial phone number

3. Add to `/packages/api/.env`:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

4. Verify test phone numbers:
   - Go to Phone Numbers → Verified Caller IDs
   - Add your test phone number
   - Verify via SMS

## Step 3: Test It

### Start the API server:
```bash
pnpm dev:api
```

### Send OTP:
```bash
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567"}'
```

**Expected response:**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

**Check your phone** for the SMS with verification code.

### Verify OTP:
```bash
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567", "code": "123456"}'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "+15551234567",
    "displayName": "+15551234567",
    "primaryRole": "operator"
  }
}
```

## Step 4: Development Without Twilio (Optional)

If you don't want to use Twilio during development:

### Set environment variable:
```bash
NODE_ENV=development
```

### Don't configure Twilio credentials

When OTP is requested, it will be **logged to console**:
```
📱 [FALLBACK] OTP for +15551234567: 123456 (expires in 600s)
⚠️ SMS delivery failed, but OTP is logged above for development
```

Copy the OTP from console and use it to verify.

## Step 5: Run Tests

```bash
pnpm test sms.service.spec.ts
```

All tests should pass.

## Troubleshooting

### "Cannot find module 'twilio'"
```bash
pnpm add twilio
```

### "Phone number is not verified"
- Verify the phone number in Twilio Console
- Or use development mode (see Step 4)

### SMS not received
- Check Twilio Console → Monitor → Logs
- Verify phone number format: `+1XXXXXXXXXX`
- Check account balance

## Next Steps

- Read full documentation: `./README.md`
- Setup guide: `./SETUP.md`
- Implementation details: `./IMPLEMENTATION_SUMMARY.md`

## Production Checklist

Before deploying to production:

- [ ] Upgrade Twilio account (remove trial limits)
- [ ] Purchase dedicated phone number
- [ ] Set `NODE_ENV=production`
- [ ] Use production Twilio credentials
- [ ] Test with multiple phone numbers
- [ ] Set up monitoring for SMS delivery

## Need Help?

- Twilio Docs: https://www.twilio.com/docs/sms/quickstart
- Module README: `./README.md`
- Setup Guide: `./SETUP.md`
