# Notifications Module

Provides notification services for the LED Billboard Marketplace application.

## Services

### SMS Service (Twilio)
Handles SMS delivery for OTP authentication using Twilio.

#### Features
- OTP delivery via SMS
- Support for Twilio Programmable SMS
- Optional Twilio Verify API integration
- Comprehensive error handling
- Delivery status tracking
- Test mode support for development

#### Configuration

Add the following environment variables to your `.env` file:

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Optional: Use Twilio Verify API (recommended for production)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Getting Twilio Credentials

1. Sign up for a Twilio account at https://www.twilio.com/
2. Get your credentials from the Twilio Console:
   - Account SID: Found on the Console Dashboard
   - Auth Token: Found on the Console Dashboard (click "Show" to reveal)
3. Purchase a phone number or use a trial number:
   - Go to Phone Numbers → Buy a Number
   - Select a number with SMS capabilities
   - For trial accounts, you'll need to verify recipient phone numbers

#### Development Mode

In development, the SMS service provides helpful fallbacks:

1. **Test Mode**: When `NODE_ENV=test` or `TEST_MODE=true`, SMS is logged to console instead of sent
2. **Twilio Test Credentials**: Use Twilio's test credentials for development
3. **Console Fallback**: If SMS delivery fails in development, OTP is logged to console

#### Usage

```typescript
import { SmsService } from '../notifications/sms.service';

@Injectable()
export class YourService {
    constructor(private smsService: SmsService) {}

    async sendOtp(phone: string, code: string) {
        const result = await this.smsService.sendOtp(phone, code);

        if (!result.success) {
            console.error('Failed to send SMS:', result.error);
            // Handle error
        } else {
            console.log('SMS sent successfully:', result.messageId);
        }
    }
}
```

#### Error Handling

The SMS service handles various Twilio error codes:

- `21211`: Invalid phone number
- `21608`: Phone number not verified (test mode)
- `21614`: Invalid "To" phone number
- Network timeouts and failures

All errors are logged and returned with descriptive messages.

#### Testing

Run the unit tests:

```bash
pnpm test sms.service.spec.ts
```

The tests mock the Twilio client and verify:
- Successful SMS delivery
- Error handling
- Network failure scenarios
- Delivery status tracking

### Email Service (Placeholder)
Future implementation for email notifications.

### Push Service (Placeholder)
Future implementation for mobile push notifications.

## Installation

Install the Twilio SDK:

```bash
pnpm add twilio
```

## Integration

The NotificationsModule is already integrated with the AuthModule for OTP delivery.

### How it Works

1. User requests OTP via `/auth/send-otp` endpoint
2. AuthService generates a random 6-digit OTP
3. OTP is stored in Redis with expiration
4. AuthService calls `SmsService.sendOtp()` to send OTP via SMS
5. User receives SMS with verification code
6. User submits OTP via `/auth/verify-otp` endpoint
7. AuthService verifies OTP and returns JWT token

### Fallback Behavior

- **Development**: If SMS fails, OTP is logged to console
- **Production**: If SMS fails, user receives error message
- **Test Mode**: SMS is always logged to console, never sent

## Future Enhancements

- [ ] Implement Email Service with SendGrid/AWS SES
- [ ] Implement Push Service with Firebase Cloud Messaging
- [ ] Add retry logic for failed SMS deliveries
- [ ] Implement SMS rate limiting per phone number
- [ ] Add SMS templates for different notification types
- [ ] Track SMS delivery analytics
- [ ] Support international phone numbers
- [ ] Implement webhook endpoints for Twilio delivery status
