# SMS OTP Delivery System - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile/Web Client                         │
│                                                                  │
│  User enters phone number: +15551234567                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /auth/send-otp
                             │ { "phone": "+15551234567" }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AuthController                            │
│                                                                  │
│  - Validate request                                             │
│  - Call AuthService.sendOtp()                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AuthService                              │
│                                                                  │
│  1. Validate phone format (+1XXXXXXXXXX)                        │
│  2. Generate random 6-digit OTP                                 │
│  3. Store OTP in Redis (expires in 10 minutes)                  │
│  4. Call SmsService.sendOtp(phone, otp) ──────────┐            │
└───────────────────────────────────────────────────┼─────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SmsService                                │
│                      (NotificationsModule)                       │
│                                                                  │
│  - Initialize Twilio client with credentials                    │
│  - Send SMS via Twilio API                                      │
│  - Handle delivery status and errors                            │
│  - Return SmsDeliveryResult                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Twilio API                                │
│                                                                  │
│  - Validate phone number                                        │
│  - Queue SMS for delivery                                       │
│  - Send SMS to carrier                                          │
│  - Return message SID and status                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        User's Phone                              │
│                                                                  │
│  Receives SMS: "Your LED Billboard Marketplace                  │
│  verification code is: 123456. Valid for 10 minutes."           │
└─────────────────────────────────────────────────────────────────┘
```

## Component Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         AuthModule                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    AuthService                          │  │
│  │                                                         │  │
│  │  - sendOtp(phone)                                      │  │
│  │  - verifyOtp(phone, code)                              │  │
│  │  - validateUser(userId)                                │  │
│  └───────────────┬─────────────────────────────────────────┘  │
│                  │                                             │
│                  │ Imports                                     │
│                  ▼                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              NotificationsModule                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│                    NotificationsModule                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   SmsService                            │  │
│  │                                                         │  │
│  │  - sendOtp(phone, code): SmsDeliveryResult             │  │
│  │  - getMessageStatus(sid): MessageStatus                │  │
│  │  - twilioClient: Twilio                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  EmailService                           │  │
│  │                   (Placeholder)                         │  │
│  │  - sendOtp(email, code)                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  PushService                            │  │
│  │                   (Placeholder)                         │  │
│  │  - sendNotification(userId, title, body)               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 twilio.config.ts                        │  │
│  │                                                         │  │
│  │  - createTwilioClient(config)                          │  │
│  │  - getTwilioPhoneNumber(config)                        │  │
│  │  - getTwilioVerifyServiceSid(config)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram - OTP Flow

```
Client          AuthController    AuthService    RedisService    SmsService    Twilio
  │                   │                │               │              │           │
  ├──POST /send-otp──>│                │               │              │           │
  │                   │                │               │              │           │
  │                   ├──sendOtp()────>│               │              │           │
  │                   │                │               │              │           │
  │                   │                ├──validate─────┤              │           │
  │                   │                │   phone       │              │           │
  │                   │                │               │              │           │
  │                   │                ├──generate─────┤              │           │
  │                   │                │   OTP         │              │           │
  │                   │                │               │              │           │
  │                   │                ├──set(key,────>│              │           │
  │                   │                │   otp, ttl)   │              │           │
  │                   │                │               │              │           │
  │                   │                │<──OK──────────┤              │           │
  │                   │                │               │              │           │
  │                   │                ├──sendOtp(phone, otp)────────>│           │
  │                   │                │               │              │           │
  │                   │                │               │              ├─create──>│
  │                   │                │               │              │  message │
  │                   │                │               │              │           │
  │                   │                │               │              │<──sid────┤
  │                   │                │               │              │  status  │
  │                   │                │               │              │           │
  │                   │                │<──SmsDeliveryResult──────────┤           │
  │                   │                │   (success, messageId)        │           │
  │                   │                │               │              │           │
  │                   │<──{message,────┤               │              │           │
  │                   │   expiresIn}   │               │              │           │
  │                   │                │               │              │           │
  │<──200 OK──────────┤                │               │              │           │
  │   {message,       │                │               │              │           │
  │    expiresIn}     │                │               │              │           │
  │                   │                │               │              │           │
  │                   │                │               │              │           │
  │◄────────────────SMS arrives on phone─────────────────────────────────────────┤
  │  "Your verification code is: 123456"                             │           │
  │                   │                │               │              │           │
```

## Error Handling Flow

```
SmsService.sendOtp()
    │
    ├──Test Mode?
    │   └──Yes──> Log to console, return success
    │
    ├──Twilio client initialized?
    │   └──No──> Throw InternalServerErrorException
    │
    ├──Call twilioClient.messages.create()
    │
    ├──Success?
    │   ├──Yes──> Log success, return {success: true, messageId}
    │   │
    │   └──No──> Check error code
    │       ├──21211: Invalid phone number
    │       ├──21608: Phone not verified (trial account)
    │       ├──21614: Invalid "To" phone number
    │       ├──Network error
    │       └──Other error
    │           │
    │           └──Return {success: false, error}
    │
    └──In AuthService:
        ├──SMS failed?
        │   ├──Development mode?
        │   │   └──Log OTP to console (fallback)
        │   │
        │   └──Production mode?
        │       └──Throw InternalServerErrorException
        │
        └──SMS succeeded?
            └──Return success response
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                           │
│                                                                  │
│  {                                                               │
│    "phone": "+15551234567"                                      │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AuthService - OTP Generation                │
│                                                                  │
│  OTP = "123456" (random 6-digit)                                │
│  Key = "otp:+15551234567"                                       │
│  TTL = 600 seconds                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├──────────────┬─────────────────────┐
                             ▼              ▼                     ▼
┌────────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│    Redis Storage       │  │   SmsService     │  │  Response to Client  │
│                        │  │                  │  │                      │
│  Key: otp:+15551234567│  │  Twilio Payload: │  │  {                   │
│  Value: "123456"      │  │  {               │  │    "message": "OTP   │
│  TTL: 600s            │  │    to: "+1555...",  "sent",           │
└────────────────────────┘  │    from: "+1555..", │    "expiresIn": 600  │
                             │    body: "Your..."  └──────────────────────┘
                             │  }               │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   Twilio API     │
                             │                  │
                             │  Message SID:    │
                             │  SM1234567890    │
                             │  Status: queued  │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   User's Phone   │
                             │                  │
                             │  SMS: "Your LED  │
                             │  Billboard..."   │
                             └──────────────────┘
```

## Environment Configuration Flow

```
Application Startup
    │
    ├──Load .env file
    │   ├──TWILIO_ACCOUNT_SID
    │   ├──TWILIO_AUTH_TOKEN
    │   ├──TWILIO_PHONE_NUMBER
    │   └──TWILIO_VERIFY_SERVICE_SID (optional)
    │
    ├──ConfigService initialized
    │
    └──NotificationsModule initialized
        │
        └──SmsService constructor
            ├──Check NODE_ENV
            │   ├──test/TEST_MODE?
            │   │   └──Skip Twilio initialization
            │   │
            │   └──development/production?
            │       └──Initialize Twilio client
            │           ├──createTwilioClient(config)
            │           │   ├──Get TWILIO_ACCOUNT_SID
            │           │   ├──Get TWILIO_AUTH_TOKEN
            │           │   └──new Twilio(sid, token)
            │           │
            │           ├──getTwilioPhoneNumber(config)
            │           │   └──Get TWILIO_PHONE_NUMBER
            │           │
            │           └──getTwilioVerifyServiceSid(config)
            │               └──Get TWILIO_VERIFY_SERVICE_SID (optional)
            │
            └──Ready to send SMS
```

## Module Dependencies

```
AuthModule
    ├── imports
    │   ├── PassportModule
    │   ├── JwtModule
    │   ├── UsersModule
    │   └── NotificationsModule ◄───┐
    │                                │
    └── providers                   │
        ├── AuthService             │
        └── JwtStrategy             │
                                     │
NotificationsModule ────────────────┘
    ├── imports
    │   └── ConfigModule
    │
    └── providers (exported)
        ├── SmsService ◄──── Used by AuthService
        ├── EmailService
        └── PushService
```

## File Structure

```
packages/api/src/
├── auth/
│   ├── auth.module.ts          (imports NotificationsModule)
│   ├── auth.service.ts         (injects SmsService)
│   ├── auth.controller.ts
│   └── jwt.strategy.ts
│
└── notifications/
    ├── notifications.module.ts  (exports SmsService)
    ├── sms.service.ts          (main implementation)
    ├── sms.service.spec.ts     (unit tests)
    ├── email.service.ts        (placeholder)
    ├── push.service.ts         (placeholder)
    ├── twilio.config.ts        (Twilio configuration)
    ├── index.ts                (exports)
    ├── README.md               (documentation)
    ├── SETUP.md                (setup guide)
    ├── QUICKSTART.md           (quick start)
    ├── IMPLEMENTATION_SUMMARY.md
    └── ARCHITECTURE.md         (this file)
```

## Testing Architecture

```
Test Suite: sms.service.spec.ts
    │
    ├── Setup
    │   ├── Mock ConfigService
    │   ├── Mock Twilio client
    │   └── Create SmsService instance
    │
    ├── Test Cases
    │   ├── sendOtp()
    │   │   ├── Success: SMS sent
    │   │   ├── Error: Invalid phone number (21211)
    │   │   ├── Error: Phone not verified (21608)
    │   │   ├── Error: Invalid "To" phone (21614)
    │   │   ├── Error: Network failure
    │   │   └── Error: Undelivered message
    │   │
    │   ├── getMessageStatus()
    │   │   ├── Success: Fetch status
    │   │   └── Error: Message not found
    │   │
    │   └── Test Mode
    │       └── Log to console instead of sending
    │
    └── Mocks
        ├── twilioClient.messages.create()
        └── twilioClient.messages(sid).fetch()
```

## Deployment Architecture

```
Production Environment
    │
    ├── Environment Variables (via .env or secrets manager)
    │   ├── NODE_ENV=production
    │   ├── TWILIO_ACCOUNT_SID=AC...
    │   ├── TWILIO_AUTH_TOKEN=...
    │   ├── TWILIO_PHONE_NUMBER=+1...
    │   └── TWILIO_VERIFY_SERVICE_SID=VA... (optional)
    │
    ├── Application Server
    │   ├── NestJS API
    │   │   ├── AuthModule
    │   │   └── NotificationsModule
    │   │       └── SmsService
    │   │           └── Twilio Client
    │   │
    │   └── Monitoring
    │       ├── Application logs
    │       ├── SMS delivery metrics
    │       └── Error tracking
    │
    └── External Services
        ├── Redis (OTP storage)
        ├── Postgres (user data)
        └── Twilio API
            ├── SMS sending
            ├── Delivery webhooks
            └── Status monitoring
```

## Security Architecture

```
Security Layers
    │
    ├── Environment Variables
    │   ├── Never committed to git
    │   ├── Stored in .env file (gitignored)
    │   └── Accessed via ConfigService
    │
    ├── Rate Limiting
    │   ├── Global rate limit (100 req/min)
    │   └── Per-phone rate limit (future)
    │
    ├── Phone Validation
    │   ├── E.164 format validation
    │   └── US numbers only (+1XXXXXXXXXX)
    │
    ├── OTP Security
    │   ├── 6-digit random code
    │   ├── 10-minute expiration
    │   ├── One-time use (deleted after verification)
    │   └── Stored in Redis with TTL
    │
    ├── Error Messages
    │   ├── Generic to users
    │   └── Detailed in server logs
    │
    └── Production Safeguards
        ├── No console.log OTP in production
        ├── Throw error if SMS fails
        └── No test mode in production
```
