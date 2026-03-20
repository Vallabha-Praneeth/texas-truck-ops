# LED Billboard Marketplace - Project Plan

## Executive Summary

**Project Name**: LED Billboard Marketplace
**Target Market**: B2B marketplace for mobile LED billboard truck operators in Texas
**Architecture**: Full-stack TypeScript monorepo with mobile-first approach
**Core Value Proposition**: Connect billboard truck operators with brokers/advertisers for dynamic advertising space rental

---

## 1. Business Model & User Roles

### Primary User Roles

1. **Operators** (Billboard Truck Owners)
   - Manage fleet of LED billboard trucks
   - Create availability slots for advertising space
   - Receive and negotiate offers from brokers
   - Assign drivers to confirmed bookings
   - Track revenue and bookings

2. **Brokers** (Advertising Agencies/Media Buyers)
   - Browse available billboard inventory
   - Create requests for specific advertising needs
   - Receive offers from operators
   - Negotiate pricing and terms
   - Manage active campaigns and bookings

3. **Drivers** (Billboard Truck Operators)
   - View assigned runs/bookings
   - Navigate to campaign locations
   - Capture proof-of-performance photos
   - Report real-time location and status
   - Complete run checklists

4. **Admin** (Platform Administrators)
   - Oversee platform operations
   - Manage users and organizations
   - Resolve disputes
   - Monitor system health
   - Access analytics and reporting

---

## 2. Core Platform Features

### 2.1 Authentication & Authorization
- **OTP-based authentication** (SMS/email)
- **JWT token management** (access + refresh tokens)
- **Role-based access control** (operator, broker, driver, admin)
- **Organization-based permissions** (multi-tenant support)
- **Session management** with secure logout

### 2.2 Inventory Management (Operators)
- **Truck Fleet Management**
  - Add/edit/deactivate trucks
  - Configure truck specifications (screen size, resolution, brightness)
  - Track truck location and status
  - Assign trucks to regions/territories

- **Availability Slot Creation**
  - Define time windows for advertising availability
  - Set pricing per slot (hourly/daily rates)
  - Mark slots as booked/available/blocked
  - Bulk slot creation for recurring availability

### 2.3 Request & Offer System
- **Broker Request Creation**
  - Specify advertising requirements (dates, times, regions, audience)
  - Set budget and duration
  - Attach creative assets (optional)

- **Operator Offer Response**
  - Browse matching requests
  - Create offers with custom pricing
  - Counter-offers and negotiation flow
  - Accept/reject incoming offers

### 2.4 Booking Lifecycle
- **Booking States**: pending_deposit → confirmed → running → awaiting_review → completed/disputed
- **Deposit & Payment Management**
  - Escrow deposit requirement
  - Payment release upon completion
  - Dispute resolution mechanism

- **Driver Assignment**
  - Operators assign drivers to confirmed bookings
  - Driver receives notification and booking details
  - Driver checklist and run instructions

### 2.5 Real-Time Driver Operations
- **Location Tracking**
  - GPS location updates every 30-60 seconds
  - Geo-fenced campaign zones
  - Route optimization and navigation

- **Proof of Performance**
  - Timestamped photo uploads
  - GPS-stamped proof of location
  - Run completion verification
  - Broker review and approval

### 2.6 Communication & Messaging
- **In-App Messaging** (planned)
  - Direct messages between brokers and operators
  - Booking-specific message threads
  - Automated notifications (offer received, booking confirmed, run started, etc.)
  - Message read receipts

### 2.7 Financial Management
- **Wallet System** (planned)
  - Operator earnings tracking
  - Broker spending and deposits
  - Payout scheduling
  - Transaction history

- **Payment Processing**
  - Integration with Stripe/payment gateway
  - Automated escrow management
  - Platform commission calculation (e.g., 10-15%)

### 2.8 Analytics & Reporting
- **Operator Dashboard**
  - Revenue metrics (daily/weekly/monthly)
  - Fleet utilization rates
  - Top-performing trucks
  - Upcoming bookings calendar

- **Broker Dashboard**
  - Campaign performance metrics
  - Spending breakdown
  - Active vs completed campaigns
  - ROI tracking

- **Driver Dashboard**
  - Completed runs count
  - Earnings summary
  - Upcoming assignments
  - Performance ratings

---

## 3. Technical Architecture

### 3.1 Monorepo Structure
```
B2B/
├── apps/
│   ├── mobile/          # Expo React Native (iOS + Android)
│   └── admin/           # Next.js web app (admin dashboard)
├── packages/
│   ├── api/             # NestJS backend (REST + SSE)
│   ├── db/              # Drizzle ORM + PostgreSQL schema
│   └── shared/          # Shared types + Zod schemas
└── tests/
    ├── e2e-mobile/      # Appium + WebdriverIO tests
    └── e2e-web/         # Playwright tests
```

### 3.2 Technology Stack

**Frontend**:
- React 18.2.0 (web + mobile)
- React Native 0.73.6 (mobile)
- Next.js 15.5.12 (web admin)
- TanStack React Query 5.x (data fetching)
- Zustand 5.x (mobile state)
- Tailwind CSS + shadcn/ui (styling)

**Backend**:
- NestJS 10.3.0 (API framework)
- PostgreSQL (primary database)
- Drizzle ORM 0.29.3 (database layer)
- Redis/ioredis (caching + pub/sub)
- JWT + Passport.js (authentication)

**Infrastructure**:
- Supabase (database hosting + future features)
- Docker (containerization)
- GitHub Actions (CI/CD)

**Testing**:
- Playwright 1.58.2 (web E2E)
- Appium + WebdriverIO (mobile E2E)
- Jest 29.x (unit tests)
- Supertest (API integration tests)

### 3.3 Database Schema (15+ tables)

**Core Entities**:
1. `orgs` - Organizations (operators, brokers)
2. `users` - Platform users
3. `org_members` - Organization membership (many-to-many)
4. `trucks` - LED billboard truck inventory
5. `availability_slots` - Operator-defined time windows
6. `requests` - Broker advertising requests
7. `offers` - Operator offers (on requests or slots)
8. `bookings` - Confirmed bookings (lifecycle management)
9. `driver_presence` - Real-time driver location/status

**Planned Entities**:
10. `messages` - In-app messaging
11. `proof_uploads` - Proof-of-performance media
12. `wallet_transactions` - Financial ledger
13. `audit_logs` - System audit trail
14. `reviews` - Booking reviews/ratings
15. `disputes` - Dispute resolution tracking

### 3.4 API Architecture

**Module Structure** (14 modules):
- `auth` - OTP generation, verification, JWT issuance
- `users` - User profile management
- `organizations` - Organization CRUD
- `trucks` - Truck fleet management
- `slots` - Availability slot management
- `requests` - Broker request lifecycle
- `offers` - Offer creation + negotiation
- `bookings` - Booking state machine
- `drivers` - Driver location tracking
- `realtime` - SSE event streaming
- `redis` - Cache layer
- `supabase` - Supabase client integration
- `common` - Shared guards, decorators, utilities
- **Planned**: `messages`, `proofs`, `wallet`, `reviews`, `disputes`

**API Endpoints** (REST + SSE):
- `POST /api/auth/login` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP → JWT
- `GET /api/auth/profile` - Get current user
- CRUD for: `/api/users`, `/api/organizations`, `/api/trucks`, `/api/slots`, `/api/requests`, `/api/offers`, `/api/bookings`
- `POST /api/drivers/presence` - Update driver location
- `GET /api/realtime/subscribe` - SSE connection for real-time updates

### 3.5 Real-Time Infrastructure

**Server-Sent Events (SSE)**:
- Booking status updates
- New offer notifications
- Driver location updates
- Message notifications
- Dashboard data refresh

**Redis Pub/Sub**:
- Horizontal scaling support
- Event broadcasting across API instances
- Cache invalidation coordination

---

## 4. Mobile App Design

### 4.1 Navigation Structure

**Authentication Flow**:
```
SplashScreen → AuthScreen (OTP) → Role-based App
```

**Operator App** (Bottom Tabs):
1. Dashboard - Revenue metrics, upcoming bookings
2. Slots - Manage availability inventory
3. Offers - Browse requests, create offers
4. Bookings - Active and past bookings

**Broker App** (Bottom Tabs):
1. Dashboard - Campaign overview, spending
2. Requests - Create and manage requests
3. Marketplace - Browse available slots
4. Offers - View received offers, negotiate
5. Bookings - Active campaigns

**Driver App** (Bottom Tabs):
1. Dashboard - Today's runs, earnings
2. Runs - Assigned bookings
3. Proof Capture - Upload photos
4. Location - Track current position

### 4.2 Key Mobile Features

- **Offline Support** (planned) - Cache data for offline access
- **Push Notifications** - Booking updates, new offers, messages
- **Camera Integration** - Proof-of-performance photo capture
- **GPS Tracking** - Real-time location updates
- **Deep Linking** - Open specific bookings from notifications
- **Biometric Auth** (planned) - FaceID/TouchID support

---

## 5. Web Admin Design

### 5.1 Dashboard Views

**Admin Dashboard**:
- Platform metrics (total users, bookings, revenue)
- User management (approve/suspend accounts)
- Organization management
- Dispute resolution queue
- System health monitoring

**Broker/Operator Web Access**:
- Same features as mobile but desktop-optimized
- Advanced filtering and search
- Bulk operations
- Reporting and analytics
- Invoice generation

---

## 6. Quality Assurance Strategy

### 6.1 Testing Pyramid

**Unit Tests** (Jest):
- Service layer business logic
- Utility functions
- Validation schemas
- 70%+ code coverage target

**Integration Tests** (Supertest):
- API endpoint testing
- Database interactions
- Authentication flows
- Error handling

**E2E Tests** (Playwright + Appium):
- Mobile: Page Object Model with Appium + WebdriverIO
- Web: Playwright for admin dashboard
- Critical user journeys (auth, booking creation, offer acceptance)
- Cross-platform compatibility (iOS, Android, Chrome, Safari)

### 6.2 CI/CD Pipeline

**GitHub Actions Workflow**:
1. **Quality Checks** - Lint, typecheck, unit tests
2. **iOS Fast Regression** - Required branch check for iOS changes
3. **iOS Full XCTest Suite** - FastRegression, LocalAuthE2E, Accessibility lanes
4. **Android Build** - Export bundle + assemble debug APK
5. **Web E2E** - Playwright tests on admin app
6. **Security Scans** - SAST (Semgrep), SCA (Trivy), DAST (ZAP), header validation

**Branch Protection**:
- Required check: `ios-fast-regression`
- Enforce on administrators
- Strict mode enabled

### 6.3 Testing Lanes

**iOS XCTest Configurations**:
1. **FastRegression** - Core user flows (auth, dashboard, bookings)
2. **LocalAuthE2E** - Authentication edge cases
3. **Accessibility** - A11y compliance audit (weekly)

**UI Test Flags System**:
- Controlled testing environment
- Fake auth bypass for CI
- Error injection for resilience testing
- Auto-fill test credentials

---

## 7. Security & Compliance

### 7.1 Security Controls

**Authentication**:
- OTP-based passwordless login (SMS delivery)
- JWT with short expiration (15 min access, 7 day refresh)
- Secure token storage (encrypted keychain on mobile)
- Rate limiting on OTP requests (3 attempts per 5 min)

**Authorization**:
- Role-based access control (RBAC)
- Organization-scoped data access
- JWT claim validation on every request
- Guard-based route protection

**Data Protection**:
- HTTPS/TLS for all communications
- Encrypted database fields (PII, financial data)
- Input validation (Zod schemas on all DTOs)
- SQL injection prevention (parameterized queries via Drizzle)
- XSS protection (React DOM escaping)

**API Security**:
- CORS whitelisting (localhost in dev, domain in prod)
- Security headers (HSTS, X-Frame-Options, CSP, Referrer-Policy)
- Request rate limiting (100 req/min per IP)
- DDoS protection (Cloudflare/AWS Shield)

**Infrastructure**:
- Environment variable secrets management
- Database connection pooling
- Redis password authentication
- Regular dependency updates (Dependabot)

### 7.2 OWASP Compliance

**Automated Security Scans**:
- **SAST** (Semgrep) - Static code analysis
- **SCA** (Trivy) - Dependency vulnerability scanning
- **DAST** (OWASP ZAP) - Dynamic application security testing
- **Security Header Validation** - HTTP header compliance

**Control Matrix**: See `/docs/security/owasp-control-matrix.md`

---

## 8. Data Privacy & Compliance

### 8.1 PII Protection

**Personal Identifiable Information**:
- Phone numbers (hashed + salted)
- Email addresses (encrypted at rest)
- Driver license numbers (future, encrypted)
- Payment information (tokenized via Stripe)

**Data Retention**:
- User data retained for account lifetime + 90 days post-deletion
- Booking data retained for 7 years (tax compliance)
- Audit logs retained for 1 year

### 8.2 Regulatory Compliance

**GDPR** (if expanding to EU):
- Right to access (data export)
- Right to deletion (account deletion flow)
- Right to rectification (profile updates)
- Data portability (JSON export)

**CCPA** (California):
- Do Not Sell disclosure
- Data collection transparency

---

## 9. Scalability & Performance

### 9.1 Database Optimization

**Indexing Strategy**:
- Primary keys (UUID)
- Foreign key indexes
- Composite indexes on frequent queries:
  - `(truck_id, start_time)` for slot lookups
  - `(region, start_time)` for geo-temporal searches
  - `(status, created_at)` for status-based filtering

**Query Optimization**:
- Connection pooling (max 20 connections)
- Prepared statements via Drizzle
- Selective column fetching (avoid `SELECT *`)
- Pagination (limit 50 items per page)

### 9.2 Caching Strategy

**Redis Cache Layers**:
1. **API Response Cache** - GET endpoints (5 min TTL)
2. **Session Cache** - JWT refresh tokens (7 day TTL)
3. **User Profile Cache** - Frequently accessed user data (15 min TTL)
4. **Availability Cache** - Slot availability lookup (1 min TTL)

**Cache Invalidation**:
- Write-through on POST/PUT/DELETE
- Event-driven invalidation (booking created → invalidate slots)

### 9.3 Real-Time Performance

**SSE Optimization**:
- Heartbeat every 30 seconds
- Automatic reconnection logic
- Connection pooling per user
- Event filtering by subscription (only send relevant updates)

**Driver Location Updates**:
- Debounced updates (every 60 seconds during active run)
- Geo-hashing for spatial queries
- PostGIS for radius-based searches

### 9.4 Infrastructure Scaling

**Horizontal Scaling**:
- Stateless API design (session in Redis)
- Load balancer (AWS ALB / Cloudflare)
- Auto-scaling groups (CPU > 70% → add instance)

**Vertical Scaling**:
- Database read replicas for analytics
- Redis cluster mode for high availability

---

## 10. Future Enhancements

### 10.1 Advanced Features

**Phase 2** (Post-MVP):
- Multi-language support (English, Spanish)
- Advanced analytics dashboard (heatmaps, conversion funnels)
- Automated pricing recommendations (ML-based)
- Campaign A/B testing
- Video ad support (video on LED screens)

**Phase 3**:
- White-label platform for franchises
- API marketplace (third-party integrations)
- Mobile SDK for partners
- Blockchain-based proof-of-performance (immutable audit trail)

### 10.2 Geographic Expansion

**Current**: Texas only
**Expansion Roadmap**:
1. California (Los Angeles, San Francisco)
2. New York (NYC metro)
3. Florida (Miami, Orlando)
4. National coverage (top 50 metro areas)
5. International (Canada, Mexico)

### 10.3 Business Model Evolution

**Current**: Commission-based (10-15% per booking)
**Future Revenue Streams**:
- Premium operator subscriptions (priority placement)
- Broker agency plans (bulk discounts)
- Data analytics upsell (audience insights)
- Creative services marketplace (ad design)
- Insurance products (campaign performance guarantees)

---

## 11. Success Metrics & KPIs

### 11.1 Platform Metrics

**User Growth**:
- Monthly Active Operators (MAO)
- Monthly Active Brokers (MAB)
- Monthly Active Drivers (MAD)
- New organization signups per month

**Engagement**:
- Average bookings per operator per month
- Average requests per broker per month
- Average driver runs per month
- User retention rate (D7, D30, D90)

**Financial**:
- Gross Merchandise Value (GMV)
- Platform revenue (commission)
- Average booking value
- Repeat booking rate

### 11.2 Technical Metrics

**Performance**:
- API response time (p50, p95, p99)
- Mobile app crash rate (<1%)
- Web app load time (<2 seconds)
- Real-time event latency (<500ms)

**Reliability**:
- API uptime (99.9% SLA)
- Database uptime (99.95%)
- Deployment success rate (>95%)

**Quality**:
- Code coverage (>70%)
- E2E test pass rate (>95%)
- Critical bug resolution time (<24 hours)

---

## 12. Timeline & Milestones

### MVP (Current Phase)
- ✅ Core authentication (OTP + JWT)
- ✅ Role-based navigation (operator, broker, driver)
- ✅ Truck and slot management
- ✅ Request and offer system
- ✅ Booking lifecycle management
- ✅ Driver location tracking
- ✅ Real-time updates (SSE)
- ⏳ SMS OTP delivery (in progress)
- ⏳ Proof-of-performance uploads (in progress)
- ⏳ Wallet/payment integration (in progress)

### Beta Launch (Next 3-6 months)
- Complete messaging system
- Payment processing integration
- Advanced geo-based search (PostGIS)
- Enhanced analytics dashboards
- Push notification system
- Beta user onboarding (10 operators, 20 brokers)

### Public Launch (6-12 months)
- Production-ready infrastructure (AWS/Cloudflare)
- Full payment processing and escrow
- Customer support system
- Marketing website
- Onboarding documentation
- Public API documentation

### Growth Phase (12-24 months)
- Geographic expansion (California, New York)
- Advanced features (A/B testing, ML pricing)
- White-label offering
- API marketplace
- International expansion planning

---

## 13. Team & Roles

**Current Development**:
- Full-stack development (monorepo, mobile, API)
- QA automation (E2E testing)
- DevOps (CI/CD, infrastructure)

**Required for Launch**:
- Backend Engineer (API scaling, performance)
- Mobile Engineer (iOS/Android optimization)
- Frontend Engineer (web dashboard)
- QA Engineer (manual + automation)
- DevOps Engineer (infrastructure, monitoring)
- Product Manager (roadmap, user research)
- Designer (UI/UX, branding)

**Post-Launch**:
- Customer Success Manager
- Sales/BD Lead (operator/broker onboarding)
- Marketing Manager
- Data Analyst

---

## 14. Risk Assessment

### 14.1 Technical Risks

**Risk**: Database performance degradation at scale
**Mitigation**: Implement read replicas, query optimization, caching strategy

**Risk**: Real-time location tracking battery drain
**Mitigation**: Adaptive polling (60s during run, 5min when idle), background task optimization

**Risk**: Payment processing downtime
**Mitigation**: Fallback payment provider, retry logic, manual reconciliation process

### 14.2 Business Risks

**Risk**: Low operator adoption
**Mitigation**: Incentive programs, onboarding support, demo accounts

**Risk**: Trust/safety concerns (fraud, disputes)
**Mitigation**: Escrow system, proof-of-performance, review system, dispute resolution

**Risk**: Regulatory changes (outdoor advertising laws)
**Mitigation**: Legal counsel, compliance monitoring, geographic diversification

---

## 15. Documentation

**Current Documentation**:
- `/docs/ci-lanes.md` - CI/CD pipeline explanation
- `/docs/testing/ios-test-plan-lanes.md` - iOS testing strategy
- `/docs/security/` - Security controls and OWASP compliance
- `/apps/admin/*.md` - API integration guides

**Planned Documentation**:
- API Reference (Swagger/OpenAPI)
- Mobile SDK Documentation
- Operator Onboarding Guide
- Broker User Manual
- Driver App Tutorial
- Admin Dashboard Guide
- Deployment Runbook
- Incident Response Playbook

---

## Conclusion

The LED Billboard Marketplace is a comprehensive B2B platform designed to modernize the mobile billboard advertising industry. With a mobile-first approach, robust backend, and comprehensive testing infrastructure, the platform is positioned to scale from Texas-based MVP to a national marketplace.

**Key Differentiators**:
- Real-time driver location tracking
- Proof-of-performance verification
- Seamless operator-broker matching
- Mobile-optimized user experience
- Enterprise-grade security and compliance

**Next Steps**: Complete payment integration, messaging system, and proof upload features to reach Beta launch readiness.
