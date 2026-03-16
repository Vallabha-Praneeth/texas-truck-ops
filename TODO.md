# LED Billboard Marketplace - TODO List

## Status: Roadmap to Beta Launch

This document outlines remaining work to reach Beta launch readiness without disturbing existing implementations.

**Current MVP Completion**: ~85%
**Target for Beta**: 95%
**Estimated Timeline**: 3-6 months

---

## Phase 1: Critical MVP Features (0-2 months)

### 1.1 Payment Integration ⏳ HIGH PRIORITY

**Goal**: Enable real money transactions with escrow system

#### Backend (packages/api)
- [ ] Create **WalletModule**
  - [ ] `wallet.service.ts` - Wallet management service
  - [ ] `wallet.controller.ts` - Wallet endpoints
  - [ ] `wallet-transaction.repository.ts` - Transaction queries
  - [ ] DTOs: `DepositDto`, `WithdrawDto`, `TransactionDto`

- [ ] Add **wallet_transactions** table (Migration 0004)
  ```sql
  - id (UUID)
  - user_id (FK to users)
  - booking_id (FK to bookings, nullable)
  - amount (numeric)
  - type (deposit, withdrawal, refund, payout, platform_fee)
  - status (pending, completed, failed)
  - payment_method (stripe, bank_transfer, etc.)
  - external_transaction_id (Stripe charge ID)
  - created_at, completed_at
  ```

- [ ] Integrate **Stripe Payment Processing**
  - [ ] Install `@stripe/stripe-js` and `stripe` packages
  - [ ] Create StripeService (`/packages/api/src/payments/stripe.service.ts`)
  - [ ] Implement deposit flow (broker deposits escrow)
  - [ ] Implement payout flow (operator receives payment after completion)
  - [ ] Implement refund flow (cancelled bookings)
  - [ ] Webhook handler for Stripe events (`/api/payments/stripe/webhook`)

- [ ] Update **BookingsModule**
  - [ ] Add payment validation before status transition to `confirmed`
  - [ ] Trigger payout release when booking status → `completed`
  - [ ] Calculate platform commission (e.g., 15% of booking price)
  - [ ] Store commission in wallet_transactions

- [ ] Create Wallet Endpoints
  - [ ] `GET /api/wallet/balance` - Get user wallet balance
  - [ ] `GET /api/wallet/transactions` - List user transactions
  - [ ] `POST /api/wallet/deposit` - Initiate deposit (Stripe checkout)
  - [ ] `POST /api/wallet/withdraw` - Request payout (to bank account)
  - [ ] `POST /api/payments/stripe/webhook` - Stripe webhook handler

#### Shared (packages/shared)
- [ ] Add `WalletTransaction` interface
- [ ] Add `PaymentMethod` enum
- [ ] Add `TransactionType` enum
- [ ] Add `TransactionStatus` enum
- [ ] Add Zod schemas: `CreateTransactionSchema`, `DepositSchema`

#### Mobile (apps/mobile)
- [ ] Create **WalletScreen**
  - [ ] Display wallet balance
  - [ ] Transaction history list
  - [ ] Deposit button → Stripe checkout (webview or native)
  - [ ] Withdraw button → request payout form

- [ ] Update **BookingsModule**
  - [ ] Show "Pay Deposit" button for `pending_deposit` bookings
  - [ ] Integrate Stripe payment flow

#### Web (apps/admin)
- [ ] Create **Wallet Dashboard Page** (`/app/dashboard/wallet/page.tsx`)
  - [ ] Balance display
  - [ ] Transaction table
  - [ ] Deposit/withdraw actions

- [ ] Update **Bookings Page**
  - [ ] Payment status indicator
  - [ ] "Pay Now" button for pending deposits

#### Testing
- [ ] Unit tests for StripeService
- [ ] Integration tests for wallet endpoints
- [ ] E2E test: Complete booking with payment
- [ ] E2E test: Refund on cancellation

**Dependencies**: Stripe account, Stripe API keys

**Status**: ⏳ Not started

---

### 1.2 SMS OTP Delivery ⏳ HIGH PRIORITY

**Goal**: Replace console logging with real SMS delivery in production

#### Backend (packages/api)
- [ ] Integrate **Twilio** or **AWS SNS** for SMS
  - [ ] Install `twilio` package (or `aws-sdk`)
  - [ ] Create SmsService (`/packages/api/src/notifications/sms.service.ts`)
  - [ ] Implement `sendOtp(phoneNumber, code)` method
  - [ ] Add environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

- [ ] Update **AuthService** (`/packages/api/src/auth/auth.service.ts:120`)
  - [ ] Replace console.log with `smsService.sendOtp()`
  - [ ] Add error handling for SMS delivery failures
  - [ ] Log SMS delivery status to audit log

- [ ] Add **NotificationsModule**
  - [ ] `notifications.module.ts`
  - [ ] `sms.service.ts` - SMS delivery
  - [ ] `email.service.ts` - Email delivery (future)
  - [ ] `push.service.ts` - Push notifications (future)

#### Testing
- [ ] Mock SmsService in auth tests
- [ ] Integration test with Twilio test credentials
- [ ] E2E test: Receive real OTP on test phone number

**Dependencies**: Twilio account (or AWS SNS setup)

**Status**: ⏳ Not started

---

### 1.3 Proof-of-Performance Upload System ⏳ HIGH PRIORITY

**Goal**: Enable drivers to upload timestamped photos as proof of campaign execution

#### Backend (packages/api)
- [ ] Create **ProofsModule**
  - [ ] `proofs.service.ts` - Proof upload service
  - [ ] `proofs.controller.ts` - Proof endpoints
  - [ ] `proof-upload.repository.ts` - Proof queries
  - [ ] DTOs: `CreateProofDto`, `UpdateProofDto`

- [ ] Add **proof_uploads** table (Migration 0005)
  ```sql
  - id (UUID)
  - booking_id (FK to bookings)
  - driver_user_id (FK to users)
  - image_url (text) - S3/Supabase Storage URL
  - latitude (numeric)
  - longitude (numeric)
  - captured_at (timestamptz)
  - uploaded_at (timestamptz)
  - notes (text, nullable)
  - status (pending_review, approved, rejected)
  - reviewed_by (FK to users, nullable)
  - reviewed_at (timestamptz, nullable)
  ```

- [ ] Integrate **Supabase Storage** (or S3)
  - [ ] Use existing SupabaseModule (`/packages/api/src/supabase/`)
  - [ ] Implement `uploadProofImage(file, bookingId, driverId)` method
  - [ ] Generate signed URLs for image access
  - [ ] Set bucket permissions (private, accessible only to booking participants)

- [ ] Create Proof Endpoints
  - [ ] `POST /api/proofs` - Upload proof (multipart/form-data)
  - [ ] `GET /api/proofs/booking/:bookingId` - List proofs for booking
  - [ ] `GET /api/proofs/:id` - Get proof details
  - [ ] `PATCH /api/proofs/:id/approve` - Broker approves proof
  - [ ] `PATCH /api/proofs/:id/reject` - Broker rejects proof
  - [ ] `DELETE /api/proofs/:id` - Delete proof (driver only, before review)

- [ ] Update **BookingsModule**
  - [ ] Auto-transition booking to `awaiting_review` when proof uploaded
  - [ ] Validation: Require proof before marking `completed`

#### Shared (packages/shared)
- [ ] Add `ProofUpload` interface
- [ ] Add `ProofStatus` enum
- [ ] Add Zod schemas: `CreateProofSchema`

#### Mobile (apps/mobile)
- [ ] Complete **DriverProofCaptureScreen** (`/apps/mobile/src/screens/driver/DriverProofCaptureScreen.tsx`)
  - [ ] Camera integration (expo-camera or react-native-camera)
  - [ ] Capture photo with timestamp overlay
  - [ ] GPS location capture (expo-location)
  - [ ] Add notes field
  - [ ] Upload button → POST /api/proofs
  - [ ] Show upload progress
  - [ ] Success/error toast

- [ ] Update **DriverRunsScreen**
  - [ ] "Capture Proof" button for active runs
  - [ ] View uploaded proofs list

- [ ] Update **BrokerBookingsScreen** & **OperatorBookingsScreen**
  - [ ] View proof images
  - [ ] Approve/reject proof buttons (broker only)
  - [ ] Show proof status badge

#### Web (apps/admin)
- [ ] Add **Proof Gallery Component** (`/apps/admin/components/ProofGallery.tsx`)
  - [ ] Image lightbox
  - [ ] Timestamp + GPS metadata display
  - [ ] Approve/reject actions

- [ ] Update **Booking Details Page**
  - [ ] Embed proof gallery
  - [ ] Show proof approval workflow

#### Testing
- [ ] Unit tests for ProofsService
- [ ] E2E test: Driver captures and uploads proof
- [ ] E2E test: Broker approves proof → booking completed

**Dependencies**: Supabase Storage bucket setup (or AWS S3 bucket)

**Status**: ⏳ Not started

---

### 1.4 In-App Messaging System ⏳ MEDIUM PRIORITY

**Goal**: Enable direct communication between brokers and operators

#### Backend (packages/api)
- [ ] Create **MessagesModule**
  - [ ] `messages.service.ts` - Message CRUD + real-time delivery
  - [ ] `messages.controller.ts` - Message endpoints
  - [ ] `message.repository.ts` - Message queries
  - [ ] DTOs: `SendMessageDto`, `MessageDto`

- [ ] Add **messages** table (Migration 0006)
  ```sql
  - id (UUID)
  - conversation_id (UUID) - Group messages by booking or request
  - sender_user_id (FK to users)
  - recipient_user_id (FK to users)
  - booking_id (FK to bookings, nullable)
  - request_id (FK to requests, nullable)
  - content (text)
  - read_at (timestamptz, nullable)
  - created_at (timestamptz)
  ```

- [ ] Create Message Endpoints
  - [ ] `POST /api/messages` - Send message
  - [ ] `GET /api/messages/conversation/:conversationId` - List messages
  - [ ] `PATCH /api/messages/:id/read` - Mark message as read
  - [ ] `GET /api/messages/unread-count` - Get unread message count

- [ ] Integrate with **RealtimeModule**
  - [ ] Publish `message_received` event to SSE
  - [ ] Notify recipient in real-time

- [ ] Optional: Add **conversations** table
  ```sql
  - id (UUID)
  - participant_1_user_id (FK to users)
  - participant_2_user_id (FK to users)
  - booking_id (FK to bookings, nullable)
  - last_message_at (timestamptz)
  - created_at (timestamptz)
  ```

#### Shared (packages/shared)
- [ ] Add `Message` interface
- [ ] Add `Conversation` interface
- [ ] Add Zod schemas: `SendMessageSchema`

#### Mobile (apps/mobile)
- [ ] Create **MessagesScreen** (`/apps/mobile/src/screens/MessagesScreen.tsx`)
  - [ ] Conversation list (grouped by booking/request)
  - [ ] Unread badge
  - [ ] Navigate to conversation detail

- [ ] Create **ConversationScreen** (`/apps/mobile/src/screens/ConversationScreen.tsx`)
  - [ ] Message thread (chat interface)
  - [ ] Text input + send button
  - [ ] Real-time message updates (SSE or polling)
  - [ ] Read receipts

- [ ] Add **Messages Tab** to bottom navigation
  - [ ] Operator, Broker, Driver apps
  - [ ] Badge showing unread count

#### Web (apps/admin)
- [ ] Create **Messages Page** (`/app/dashboard/messages/page.tsx`)
  - [ ] Conversation list sidebar
  - [ ] Message thread main area
  - [ ] Send message input

#### Testing
- [ ] Unit tests for MessagesService
- [ ] E2E test: Send message between broker and operator
- [ ] E2E test: Real-time message delivery

**Status**: ⏳ Not started

---

## Phase 2: Enhancements & Polish (2-4 months)

### 2.1 Advanced Geo-Based Search (PostGIS) ⏳ MEDIUM PRIORITY

**Goal**: Enable brokers to search available slots by geographic radius

#### Backend (packages/api)
- [ ] Enable **PostGIS extension** in PostgreSQL
  - [ ] Add migration 0007 to enable PostGIS
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

- [ ] Update **availability_slots** table schema
  - [ ] Add `location` column (geography type - POINT)
  - [ ] Create spatial index on `location` column
  - [ ] Backfill location from region (if region is lat/lng)

- [ ] Update **SlotsService** (`/packages/api/src/slots/slots.service.ts:82`)
  - [ ] Implement `findNearby(latitude, longitude, radiusKm)` method
  - [ ] Use PostGIS ST_DWithin for radius search
  - [ ] Return results sorted by distance
  - [ ] Example query:
  ```sql
  SELECT *, ST_Distance(location, ST_MakePoint($lat, $lng)::geography) as distance
  FROM availability_slots
  WHERE ST_DWithin(location, ST_MakePoint($lat, $lng)::geography, $radiusMeters)
  ORDER BY distance;
  ```

- [ ] Add Geo Search Endpoint
  - [ ] `GET /api/slots/nearby?lat=&lng=&radius=` - Find nearby slots

#### Mobile (apps/mobile)
- [ ] Update **BrokerMarketplaceScreen**
  - [ ] Add "Search Nearby" button
  - [ ] Request user's current location (expo-location)
  - [ ] Call `/api/slots/nearby` endpoint
  - [ ] Display results sorted by distance
  - [ ] Show distance on each slot card

#### Web (apps/admin)
- [ ] Update **Marketplace Page**
  - [ ] Add map view (Google Maps or Mapbox)
  - [ ] Plot available slots as markers
  - [ ] Radius filter slider

#### Testing
- [ ] Unit tests for geo search queries
- [ ] E2E test: Search for nearby slots

**Dependencies**: PostGIS extension enabled on database

**Status**: ⏳ Not started

---

### 2.2 Push Notifications ⏳ MEDIUM PRIORITY

**Goal**: Notify users of important events (new offer, booking confirmed, run started)

#### Backend (packages/api)
- [ ] Integrate **Firebase Cloud Messaging (FCM)** or **Expo Push Notifications**
  - [ ] Install `firebase-admin` or `expo-server-sdk`
  - [ ] Create PushService (`/packages/api/src/notifications/push.service.ts`)
  - [ ] Implement `sendPushNotification(userId, title, body, data)` method

- [ ] Add **push_tokens** table (Migration 0008)
  ```sql
  - id (UUID)
  - user_id (FK to users)
  - token (text) - FCM/Expo push token
  - platform (ios, android)
  - created_at (timestamptz)
  - last_used_at (timestamptz)
  ```

- [ ] Create Push Token Endpoints
  - [ ] `POST /api/notifications/register-token` - Register device token
  - [ ] `DELETE /api/notifications/unregister-token` - Remove token on logout

- [ ] Trigger Push Notifications on Events
  - [ ] New offer received → notify broker
  - [ ] Offer accepted → notify operator
  - [ ] Booking confirmed → notify broker + driver
  - [ ] Run started → notify broker
  - [ ] Proof uploaded → notify broker
  - [ ] Message received → notify recipient

#### Mobile (apps/mobile)
- [ ] Install `expo-notifications` package
- [ ] Request notification permissions on app start
- [ ] Register push token with backend
- [ ] Handle incoming push notifications
- [ ] Deep link to relevant screen (booking details, messages, etc.)

#### Testing
- [ ] E2E test: Receive push notification on new offer
- [ ] E2E test: Deep link from notification to booking details

**Dependencies**: Firebase project setup (or Expo account)

**Status**: ⏳ Not started

---

### 2.3 Enhanced Filtering & Search ⏳ LOW PRIORITY

**Goal**: Improve search and filtering across all list views

#### Backend (packages/api)
- [ ] Update **SlotsService** (`/packages/api/src/slots/slots.service.ts:91`)
  - [ ] Add filtering by: date range, price range, truck type, region
  - [ ] Add sorting: by price (asc/desc), by date, by distance
  - [ ] Add pagination metadata (total count, page count)

- [ ] Update **TrucksService** (`/packages/api/src/trucks/trucks.service.ts:74`)
  - [ ] Add filtering by: organization, region, status, screen_size
  - [ ] Add sorting

- [ ] Update **RequestsService**
  - [ ] Add filtering by: status, date range, region, budget range
  - [ ] Add full-text search on campaign_details

- [ ] Update **OffersService**
  - [ ] Add filtering by: status, price range, request_id
  - [ ] Add sorting

- [ ] Update **BookingsService**
  - [ ] Add filtering by: status, date range, broker, operator, driver
  - [ ] Add sorting

#### Mobile (apps/mobile)
- [ ] Add **Filter Sheet Component** (`/apps/mobile/src/components/FilterSheet.tsx`)
  - [ ] Reusable bottom sheet with filter options
  - [ ] Date range picker
  - [ ] Price range slider
  - [ ] Status checkboxes
  - [ ] Apply/Reset buttons

- [ ] Update All List Screens
  - [ ] Add filter button (opens FilterSheet)
  - [ ] Display active filters as chips
  - [ ] Clear filters action

#### Web (apps/admin)
- [ ] Add **Filter Sidebar Component**
  - [ ] Similar to mobile but sidebar layout
  - [ ] Advanced search inputs

#### Testing
- [ ] E2E test: Filter slots by date range
- [ ] E2E test: Sort bookings by status

**Status**: ⏳ Not started

---

### 2.4 Advanced Analytics Dashboard ⏳ LOW PRIORITY

**Goal**: Provide detailed analytics for operators and brokers

#### Backend (packages/api)
- [ ] Create **AnalyticsModule**
  - [ ] `analytics.service.ts` - Data aggregation service
  - [ ] `analytics.controller.ts` - Analytics endpoints

- [ ] Create Analytics Endpoints
  - [ ] `GET /api/analytics/operator/revenue` - Revenue over time (daily, weekly, monthly)
  - [ ] `GET /api/analytics/operator/utilization` - Fleet utilization rate
  - [ ] `GET /api/analytics/operator/top-trucks` - Top-performing trucks
  - [ ] `GET /api/analytics/broker/spending` - Spending breakdown
  - [ ] `GET /api/analytics/broker/campaigns` - Campaign performance metrics
  - [ ] `GET /api/analytics/driver/earnings` - Driver earnings over time

- [ ] Implement data aggregation queries
  - [ ] Use Drizzle with GROUP BY, SUM, AVG
  - [ ] Cache analytics data in Redis (1 hour TTL)

#### Mobile (apps/mobile)
- [ ] Update **OperatorDashboard**
  - [ ] Add revenue chart (line chart - recharts or victory-native)
  - [ ] Add utilization gauge
  - [ ] Add top trucks list

- [ ] Update **BrokerDashboard**
  - [ ] Add spending chart (bar chart)
  - [ ] Add campaign metrics (impressions, CTR - future)

- [ ] Update **DriverDashboard**
  - [ ] Add earnings chart

#### Web (apps/admin)
- [ ] Create **Analytics Page** (`/app/dashboard/analytics/page.tsx`)
  - [ ] Recharts integration
  - [ ] Interactive charts (revenue, utilization, spending)
  - [ ] Date range selector
  - [ ] Export to CSV button

#### Testing
- [ ] Unit tests for analytics aggregation queries
- [ ] E2E test: View analytics dashboard

**Status**: ⏳ Not started

---

### 2.5 Reviews & Ratings System ⏳ LOW PRIORITY

**Goal**: Enable brokers and operators to review each other after completed bookings

#### Backend (packages/api)
- [ ] Create **ReviewsModule**
  - [ ] `reviews.service.ts` - Review CRUD
  - [ ] `reviews.controller.ts` - Review endpoints

- [ ] Add **reviews** table (Migration 0009)
  ```sql
  - id (UUID)
  - booking_id (FK to bookings)
  - reviewer_user_id (FK to users)
  - reviewee_user_id (FK to users)
  - rating (integer 1-5)
  - comment (text, nullable)
  - created_at (timestamptz)
  ```

- [ ] Create Review Endpoints
  - [ ] `POST /api/reviews` - Submit review
  - [ ] `GET /api/reviews/user/:userId` - Get user's reviews (received)
  - [ ] `GET /api/reviews/booking/:bookingId` - Get booking reviews

- [ ] Update **UsersService**
  - [ ] Calculate average rating for each user
  - [ ] Cache rating in `users` table (add `average_rating` column)

#### Mobile (apps/mobile)
- [ ] Create **ReviewModal** component
  - [ ] Star rating input (react-native-ratings)
  - [ ] Comment textarea
  - [ ] Submit button

- [ ] Update **BookingsScreen**
  - [ ] Show "Leave Review" button for completed bookings
  - [ ] Open ReviewModal on click

- [ ] Display average rating on user profiles
  - [ ] Show stars + rating number

#### Web (apps/admin)
- [ ] Similar review submission flow
- [ ] Display reviews on organization/user detail pages

#### Testing
- [ ] E2E test: Submit review after completed booking
- [ ] Unit test: Average rating calculation

**Status**: ⏳ Not started

---

## Phase 3: Production Readiness (4-6 months)

### 3.1 Infrastructure & Deployment ⏳ HIGH PRIORITY

**Goal**: Deploy to production environment with proper infrastructure

#### Infrastructure Setup
- [ ] **Database Hosting**
  - [ ] Set up Supabase project (or AWS RDS PostgreSQL)
  - [ ] Configure connection pooling (PgBouncer)
  - [ ] Enable automated backups (daily)
  - [ ] Set up read replicas (for analytics queries)

- [ ] **Redis Hosting**
  - [ ] Set up Redis Cloud (or AWS ElastiCache)
  - [ ] Configure Redis password authentication
  - [ ] Enable Redis persistence (AOF or RDB)

- [ ] **API Hosting**
  - [ ] Deploy NestJS API to AWS EC2 / ECS / App Runner
  - [ ] Or deploy to Vercel / Railway / Render
  - [ ] Configure environment variables (secrets management)
  - [ ] Set up load balancer (AWS ALB or Cloudflare)
  - [ ] Enable auto-scaling (CPU > 70% → scale up)

- [ ] **Web Hosting**
  - [ ] Deploy Next.js admin app to Vercel (or AWS Amplify)
  - [ ] Configure custom domain
  - [ ] Enable CDN (CloudFront or Cloudflare)

- [ ] **Mobile App Distribution**
  - [ ] Set up Apple Developer account
  - [ ] Set up Google Play Developer account
  - [ ] Configure Expo EAS Build for production builds
  - [ ] Submit iOS app to TestFlight (beta)
  - [ ] Submit Android app to Google Play (beta track)

- [ ] **File Storage**
  - [ ] Set up Supabase Storage bucket (or AWS S3)
  - [ ] Configure CORS for client uploads
  - [ ] Set up CDN for image delivery

- [ ] **Monitoring & Logging**
  - [ ] Set up Sentry for error tracking (frontend + backend)
  - [ ] Set up LogRocket or Datadog for session replay
  - [ ] Set up CloudWatch or Grafana for metrics
  - [ ] Set up Uptime monitoring (Pingdom or UptimeRobot)

- [ ] **SSL/TLS Certificates**
  - [ ] Set up Let's Encrypt or AWS Certificate Manager
  - [ ] Configure HTTPS redirect

#### DevOps
- [ ] Create production deployment workflow (`.github/workflows/deploy-prod.yml`)
  - [ ] Deploy API on merge to `main` branch
  - [ ] Deploy web app on merge to `main` branch
  - [ ] Run smoke tests post-deployment

- [ ] Set up staging environment
  - [ ] Separate database (staging)
  - [ ] Deploy to staging on merge to `develop` branch

**Status**: ⏳ Not started

---

### 3.2 Performance Optimization ⏳ MEDIUM PRIORITY

**Goal**: Ensure app performs well under load

#### Backend Optimization
- [ ] **Database Query Optimization**
  - [ ] Run EXPLAIN ANALYZE on slow queries
  - [ ] Add missing indexes (check query plans)
  - [ ] Implement query result caching (Redis)
  - [ ] Use database views for complex aggregations

- [ ] **API Response Caching**
  - [ ] Cache GET endpoints (5 min TTL)
  - [ ] Implement cache invalidation on write operations
  - [ ] Use Redis for distributed caching

- [ ] **API Rate Limiting**
  - [ ] Implement rate limiting (100 requests/min per IP)
  - [ ] Use `@nestjs/throttler` package
  - [ ] Return 429 Too Many Requests on limit exceeded

- [ ] **Pagination Everywhere**
  - [ ] Ensure all list endpoints support pagination
  - [ ] Default limit: 50 items per page
  - [ ] Return pagination metadata (total, page, hasNext)

#### Mobile Optimization
- [ ] **Image Optimization**
  - [ ] Compress uploaded images (reduce file size)
  - [ ] Use thumbnail URLs for list views
  - [ ] Lazy load images (react-native-fast-image)

- [ ] **Code Splitting**
  - [ ] Split bundle by screen (React.lazy for screens)
  - [ ] Reduce initial bundle size

- [ ] **Offline Support**
  - [ ] Cache API responses locally (AsyncStorage)
  - [ ] Show cached data when offline
  - [ ] Queue actions for sync when back online

#### Web Optimization
- [ ] **Next.js Optimization**
  - [ ] Enable image optimization (next/image)
  - [ ] Use dynamic imports for heavy components
  - [ ] Enable Incremental Static Regeneration (ISR) for dashboards

**Status**: ⏳ Not started

---

### 3.3 Security Hardening ⏳ HIGH PRIORITY

**Goal**: Ensure production security best practices

#### Backend Security
- [ ] **Environment Secrets Management**
  - [ ] Use AWS Secrets Manager (or Doppler, Vault)
  - [ ] Never commit secrets to Git
  - [ ] Rotate secrets regularly (JWT secret, database password, Stripe keys)

- [ ] **Advanced Rate Limiting**
  - [ ] Implement IP-based rate limiting
  - [ ] Implement user-based rate limiting
  - [ ] Add exponential backoff for repeated failures

- [ ] **Input Sanitization**
  - [ ] Sanitize HTML in user-generated content
  - [ ] Prevent XSS attacks (escape output)

- [ ] **OWASP Top 10 Compliance**
  - [ ] Re-run security scans (Semgrep, ZAP, Trivy)
  - [ ] Fix any HIGH/CRITICAL vulnerabilities
  - [ ] Document security controls

- [ ] **API Security**
  - [ ] Add API key authentication for internal services
  - [ ] Implement request signing for sensitive endpoints
  - [ ] Add CAPTCHA for OTP requests (prevent abuse)

#### Mobile Security
- [ ] **Secure Storage**
  - [ ] Use expo-secure-store for tokens (encrypted keychain)
  - [ ] Never store sensitive data in AsyncStorage

- [ ] **Certificate Pinning** (optional, advanced)
  - [ ] Pin SSL certificates to prevent MITM attacks

- [ ] **Code Obfuscation** (optional)
  - [ ] Obfuscate JavaScript bundle (Hermes bytecode)

#### Compliance
- [ ] **Privacy Policy & Terms of Service**
  - [ ] Write Privacy Policy (GDPR, CCPA compliance)
  - [ ] Write Terms of Service
  - [ ] Add links to auth screens

- [ ] **GDPR Compliance**
  - [ ] Implement data export (user requests their data)
  - [ ] Implement data deletion (right to be forgotten)
  - [ ] Add cookie consent banner (web)

**Status**: ⏳ Not started

---

### 3.4 User Onboarding & Help ⏳ MEDIUM PRIORITY

**Goal**: Help new users understand the platform

#### Mobile App
- [ ] **Onboarding Flow** (first-time users)
  - [ ] Welcome screens (3-5 slides explaining platform)
  - [ ] Role selection screen (operator, broker, driver)
  - [ ] Tutorial overlays for key screens
  - [ ] Skip button for returning users

- [ ] **Help & Support**
  - [ ] Add Help Center screen (FAQ)
  - [ ] Add Contact Support button (email or chat)
  - [ ] Add in-app tooltips for complex features

#### Web App
- [ ] Similar onboarding flow for web users
- [ ] Interactive tour using Shepherd.js or Intro.js

**Status**: ⏳ Not started

---

### 3.5 Admin Tools & Moderation ⏳ MEDIUM PRIORITY

**Goal**: Enable platform administrators to manage users and resolve disputes

#### Backend (packages/api)
- [ ] Create **AdminModule**
  - [ ] `admin.controller.ts` - Admin-only endpoints
  - [ ] `admin.service.ts` - Admin operations

- [ ] Add Admin Endpoints
  - [ ] `GET /api/admin/users` - List all users (with filters)
  - [ ] `PATCH /api/admin/users/:id/suspend` - Suspend user account
  - [ ] `PATCH /api/admin/users/:id/unsuspend` - Unsuspend user
  - [ ] `GET /api/admin/bookings` - List all bookings (with filters)
  - [ ] `PATCH /api/admin/bookings/:id/cancel` - Admin cancel booking
  - [ ] `POST /api/admin/disputes/:id/resolve` - Resolve dispute

- [ ] Add **disputes** table (Migration 0010)
  ```sql
  - id (UUID)
  - booking_id (FK to bookings)
  - raised_by (FK to users)
  - reason (text)
  - status (open, investigating, resolved)
  - resolution (text, nullable)
  - resolved_by (FK to users, nullable)
  - created_at, resolved_at
  ```

#### Web Admin
- [ ] Create **Admin Dashboard** (`/app/admin/page.tsx`)
  - [ ] Platform metrics (total users, bookings, revenue)
  - [ ] Recent activity feed
  - [ ] Dispute queue

- [ ] Create **User Management Page** (`/app/admin/users/page.tsx`)
  - [ ] User list with search/filter
  - [ ] Suspend/unsuspend actions
  - [ ] View user details

- [ ] Create **Dispute Resolution Page** (`/app/admin/disputes/page.tsx`)
  - [ ] Dispute list
  - [ ] Dispute details modal
  - [ ] Resolve dispute form

**Status**: ⏳ Not started

---

## Phase 4: Future Enhancements (Post-Beta)

### 4.1 Multi-Language Support ⏳ LOW PRIORITY

- [ ] Integrate i18n library (react-i18next)
- [ ] Add English and Spanish translations
- [ ] Language switcher in settings

**Status**: ⏳ Not started

---

### 4.2 Video Ad Support ⏳ LOW PRIORITY

- [ ] Allow brokers to upload video ads (not just static images)
- [ ] Video player integration (react-native-video)
- [ ] Video storage (S3 or Supabase Storage)

**Status**: ⏳ Not started

---

### 4.3 Automated Pricing Recommendations (ML) ⏳ LOW PRIORITY

- [ ] Collect historical pricing data
- [ ] Train ML model (pricing predictor)
- [ ] Suggest optimal pricing for operators

**Status**: ⏳ Not started

---

### 4.4 API Marketplace & Public API ⏳ LOW PRIORITY

- [ ] Create public API documentation (Swagger UI)
- [ ] Issue API keys for third-party integrations
- [ ] Rate limiting for external API consumers

**Status**: ⏳ Not started

---

### 4.5 Blockchain Proof-of-Performance ⏳ LOW PRIORITY

- [ ] Store proof uploads on blockchain (immutable audit trail)
- [ ] Smart contract for escrow payments
- [ ] Cryptocurrency payment support

**Status**: ⏳ Not started

---

## Immediate Next Steps (Priority Order)

### Week 1-2
1. **SMS OTP Delivery** (Twilio integration)
   - Replace console.log with real SMS
   - Test with real phone numbers

2. **Payment Integration** (Stripe)
   - Create WalletModule and wallet_transactions table
   - Implement deposit flow
   - Test end-to-end payment

### Week 3-4
3. **Proof Upload System**
   - Create ProofsModule and proof_uploads table
   - Integrate Supabase Storage
   - Complete DriverProofCaptureScreen (camera + upload)

4. **Messaging System**
   - Create MessagesModule and messages table
   - Build chat interface (mobile + web)
   - Real-time message delivery

### Week 5-8
5. **Enhanced Filtering & Search**
   - Improve list views with filters
   - Add sorting options

6. **Push Notifications**
   - FCM/Expo push setup
   - Trigger notifications on key events

7. **Geo-Based Search** (PostGIS)
   - Enable PostGIS extension
   - Implement radius search

### Week 9-12
8. **Analytics Dashboard**
   - Revenue charts
   - Utilization metrics

9. **Reviews & Ratings**
   - Post-booking review flow

10. **Admin Tools**
    - Admin dashboard
    - Dispute resolution

### Month 4-6
11. **Production Deployment**
    - Infrastructure setup (AWS, Supabase)
    - CI/CD for production
    - Monitoring & logging

12. **Performance Optimization**
    - Database indexing
    - API caching
    - Mobile bundle optimization

13. **Security Hardening**
    - Secrets management
    - Rate limiting
    - OWASP compliance

14. **User Onboarding**
    - Welcome flow
    - Help center

---

## Known TODOs from Code Comments

### API Layer
1. `/packages/api/src/slots/slots.service.ts:82` - Geo-based search (PostGIS)
2. `/packages/api/src/slots/slots.service.ts:91` - Advanced filtering
3. `/packages/api/src/trucks/trucks.service.ts:74` - Truck filtering
4. `/packages/api/src/auth/auth.service.ts:120` - SMS OTP delivery

### Mobile App
- Various navigation helpers (TODO comments in navigation files)

---

## Dependencies & Prerequisites

### External Services Needed
- [ ] **Twilio Account** (SMS OTP delivery)
  - Account SID, Auth Token, Phone Number

- [ ] **Stripe Account** (Payment processing)
  - API keys (test + live), webhook secret

- [ ] **Supabase Project** (Database + Storage)
  - Database URL, Storage bucket, API keys

- [ ] **Firebase Project** (Push notifications)
  - FCM server key, iOS APNs certificate

- [ ] **Apple Developer Account** ($99/year)
  - iOS app distribution

- [ ] **Google Play Developer Account** ($25 one-time)
  - Android app distribution

- [ ] **Production Hosting**
  - AWS/Vercel/Railway account
  - Domain name (e.g., ledbillboardmarket.com)

### Development Tools
- [ ] Stripe CLI (for webhook testing)
- [ ] Twilio CLI (for SMS testing)
- [ ] Expo EAS CLI (for mobile builds)

---

## Risks & Mitigation

### Technical Risks
1. **Risk**: Payment integration complexity
   - **Mitigation**: Start with Stripe test mode, thorough testing before live

2. **Risk**: Mobile camera/GPS not working on all devices
   - **Mitigation**: Test on multiple physical devices (iOS + Android)

3. **Risk**: Real-time location tracking battery drain
   - **Mitigation**: Implement adaptive polling (60s during run, 5min idle)

### Business Risks
1. **Risk**: Low user adoption
   - **Mitigation**: Beta testing with 10 operators + 20 brokers first

2. **Risk**: Payment disputes
   - **Mitigation**: Escrow system + proof-of-performance + dispute resolution

---

## Success Metrics

### Beta Launch Criteria
- [ ] All Phase 1 features complete (payment, SMS, proofs, messaging)
- [ ] At least 10 beta operators onboarded
- [ ] At least 20 beta brokers onboarded
- [ ] 50+ successful bookings completed
- [ ] <1% mobile app crash rate
- [ ] <2 second API response time (p95)
- [ ] 99% API uptime

### Production Launch Criteria
- [ ] All Phase 3 features complete (deployment, security, performance)
- [ ] 100+ operators onboarded
- [ ] 200+ brokers onboarded
- [ ] 500+ successful bookings
- [ ] <0.5% crash rate
- [ ] 99.9% API uptime
- [ ] Security audit passed

---

## Conclusion

**Current Status**: MVP core features 85% complete
**Next Milestone**: Beta Launch (95% complete)
**Timeline**: 3-6 months to Beta, 6-12 months to Production

**Critical Path**:
1. Payment integration (2 weeks)
2. SMS OTP delivery (1 week)
3. Proof upload system (2 weeks)
4. Messaging system (2 weeks)
5. Production deployment (4 weeks)
6. Beta testing (4-8 weeks)

**Total Estimated Effort**: 15-20 weeks of focused development

---

**NOTE**: This TODO list is designed to be additive only. No existing features will be removed or significantly refactored. All new features integrate with existing implementations without breaking changes.
