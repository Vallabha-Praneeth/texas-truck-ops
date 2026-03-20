# SMS OTP Delivery Setup Guide

This guide walks you through setting up Twilio SMS OTP delivery for the LED Billboard Marketplace.

## Prerequisites

- Node.js 18+ and pnpm installed
- A Twilio account (free trial available)
- Access to the project repository

## Step 1: Install Twilio SDK

```bash
cd /path/to/B2B/packages/api
pnpm add twilio
```

This installs the Twilio SDK as a dependency.

## Step 2: Get Twilio Credentials

### Option A: Free Trial Account (Development)

1. Sign up at https://www.twilio.com/try-twilio
2. After signing up, you'll receive:
   - Account SID (starts with `AC`)
   - Auth Token (click "Show" to reveal)
   - A trial phone number with SMS capabilities

**Trial Account Limitations:**
- You can only send SMS to verified phone numbers
- Messages will have a "Sent from your Twilio trial account" prefix
- Free $15 credit (check current offer)

To verify a test phone number:
1. Go to Phone Numbers → Verified Caller IDs
2. Click "Add a new number"
3. Enter the phone number and verify via SMS

### Option B: Paid Account (Production)

1. Upgrade your account at https://console.twilio.com/
2. Purchase a dedicated phone number:
   - Go to Phone Numbers → Buy a Number
   - Filter by "SMS" capability
   - Select a number and complete purchase
3. Get your credentials from the Console Dashboard

## Step 3: Configure Environment Variables

Add the following to `/packages/api/.env`:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Optional: Twilio Verify API (recommended for production)
# TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace the placeholders:
- `TWILIO_ACCOUNT_SID`: Your Account SID from Twilio Console
- `TWILIO_AUTH_TOKEN`: Your Auth Token from Twilio Console
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number in E.164 format (+1XXXXXXXXXX)

## Step 4: Verify Installation

1. Start the API server:
   ```bash
   pnpm dev:api
   ```

2. Check the logs for any Twilio initialization errors

3. Test OTP delivery:
   ```bash
   curl -X POST http://localhost:3001/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+15551234567"}'
   ```

   For trial accounts, use a verified phone number.

## Step 5: Test in Development

### Test Mode (No SMS Sent)
Set environment variable:
```bash
TEST_MODE=true
```

In test mode, SMS is logged to console instead of sent.

### Development Mode (SMS Fallback)
If SMS fails in development (`NODE_ENV=development`), the OTP will be logged to console as a fallback.

Example console output:
```
📱 [FALLBACK] OTP for +15551234567: 123456 (expires in 600s)
⚠️ SMS delivery failed, but OTP is logged above for development
```

## Step 6: Production Deployment

### Security Checklist

- [ ] Use environment variables for all credentials (never commit to git)
- [ ] Use a dedicated Twilio phone number (not trial)
- [ ] Set up monitoring for SMS delivery failures
- [ ] Implement rate limiting to prevent SMS abuse
- [ ] Consider using Twilio Verify API for enhanced security

### Environment Variables (Production)

```bash
NODE_ENV=production
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### Optional: Twilio Verify API

For production, consider using Twilio Verify API for better security:

1. Create a Verify Service in Twilio Console:
   - Go to Verify → Services
   - Click "Create new Service"
   - Copy the Service SID (starts with `VA`)

2. Add to `.env`:
   ```bash
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

Verify API provides:
- Rate limiting
- Fraud detection
- Delivery optimization
- Multiple delivery channels (SMS, voice, email)

## Troubleshooting

### Error: "Twilio credentials not configured"

**Cause**: Missing `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` in `.env`

**Solution**: Add the required environment variables to `.env` file

### Error: "Invalid phone number"

**Cause**: Phone number not in E.164 format or invalid

**Solution**: Ensure phone numbers are in format `+1XXXXXXXXXX` (US numbers)

### Error: "Phone number is not verified (test mode)"

**Cause**: Trying to send SMS to unverified number on trial account

**Solution**:
- Verify the phone number in Twilio Console
- Or upgrade to a paid account

### SMS not received

**Possible causes**:
1. Carrier blocking (check Twilio logs)
2. Phone number in DND registry
3. Network delays

**Solution**: Check Twilio Console → Monitor → Logs → Messaging for delivery status

### Error: "Failed to send verification code"

**Cause**: SMS delivery failed in production

**Solution**:
1. Check Twilio Console logs
2. Verify account balance
3. Check phone number validity
4. Review error logs for specific Twilio error codes

## Testing

Run unit tests:
```bash
cd /path/to/B2B/packages/api
pnpm test sms.service.spec.ts
```

All tests should pass without requiring actual Twilio credentials (they use mocks).

## Cost Estimation

**Twilio Pricing** (as of 2024, check current pricing):
- Outbound SMS (US): ~$0.0079 per message
- Phone number rental: ~$1.15/month

**Example monthly costs**:
- 1,000 OTPs/month: ~$8 + $1.15 = ~$9.15/month
- 10,000 OTPs/month: ~$79 + $1.15 = ~$80.15/month

**Cost optimization tips**:
- Use Verify API for built-in rate limiting
- Implement OTP rate limiting per phone number
- Consider fallback to voice for failed SMS

## Monitoring

Monitor SMS delivery in production:

1. **Twilio Console**:
   - Monitor → Logs → Messaging
   - View delivery status and errors

2. **Application Logs**:
   - Success: `✅ OTP sent successfully to +1XXX via SMS`
   - Failure: `❌ Failed to send SMS to +1XXX: [error]`

3. **Metrics to Track**:
   - SMS delivery success rate
   - Average delivery time
   - Failed delivery reasons
   - Cost per OTP

## Next Steps

- [ ] Set up Twilio webhook for delivery status updates
- [ ] Implement SMS rate limiting per phone number
- [ ] Add monitoring/alerting for failed SMS deliveries
- [ ] Configure Email Service as fallback for SMS failures
- [ ] Implement Push Notification Service for mobile apps

## Support

- Twilio Documentation: https://www.twilio.com/docs/sms
- Twilio Support: https://support.twilio.com/
- Internal Documentation: `./README.md`
