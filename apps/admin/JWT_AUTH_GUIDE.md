# JWT Authentication - Testing Guide

## Overview

All protected endpoints now require JWT authentication via the `Authorization: Bearer {token}` header.

---

## Protected Endpoints

1. **POST /api/v1/requests** - Create request
2. **POST /api/v1/offers** - Create offer
3. **POST /api/v1/offers/:id/accept** - Accept offer
4. **GET /api/v1/requests/:id/offers** - List offers
5. **GET /api/v1/bookings/:id** - Get booking

---

## Setup

### 1. Set JWT Secret

Add to `apps/admin/.env.local`:

```bash
JWT_SECRET=dev-secret-key-change-in-production
```

**Important**: Use a strong secret in production!

### 2. Generate Test Token

```bash
cd apps/admin
node scripts/generate-test-jwt.mjs
```

**Output**:
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiYnJva2VyIiwiaWF0IjoxNzM4NzM0ODU1LCJleHAiOjE3Mzg4MjEyNTV9.abc123...
```

**Custom User/Role**:
```bash
# Generate token for specific user and role
node scripts/generate-test-jwt.mjs {USER_ID} {ROLE} {ORG_ID}

# Examples
node scripts/generate-test-jwt.mjs "user-123" "broker"
node scripts/generate-test-jwt.mjs "user-456" "operator" "org-789"
node scripts/generate-test-jwt.mjs "admin-1" "admin"
```

---

## curl Examples

### Without Token (401 Error)

```bash
# Try to create request without token
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Test Campaign",
    "description": "Test",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }'
```

**Expected Response (401)**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

---

### With Valid Token (Success)

```bash
# 1. Generate token
TOKEN=$(cd apps/admin && node scripts/generate-test-jwt.mjs)

# 2. Create request with token
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "region": "DFW",
    "title": "Authenticated Request",
    "description": "Created with JWT auth",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z",
    "budgetCents": 150000
  }'
```

**Expected Response (201)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "region": "DFW",
  "title": "Authenticated Request",
  "description": "Created with JWT auth",
  "preferredStartAt": "2026-03-01T10:00:00.000Z",
  "preferredEndAt": "2026-03-01T18:00:00.000Z",
  "budgetCents": 150000,
  "minScreenWidthFt": null,
  "status": "open",
  "createdAt": "2026-02-05T04:24:15.789Z"
}
```

---

## Complete Authenticated Flow

```bash
# Generate token once
TOKEN=$(cd apps/admin && node scripts/generate-test-jwt.mjs)

# 1. Create request
REQUEST_ID=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "region": "Houston",
    "title": "Auth Test",
    "description": "Testing JWT auth",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }' | jq -r '.id')

echo "Request ID: $REQUEST_ID"

# 2. List offers (empty)
curl -s -X GET "http://localhost:3000/api/v1/requests/$REQUEST_ID/offers" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Create offer (replace SLOT_ID)
OFFER_ID=$(curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID}\",
    \"amountCents\": 120000
  }" | jq -r '.id')

echo "Offer ID: $OFFER_ID"

# 4. Accept offer
BOOKING_ID=$(curl -s -X POST "http://localhost:3000/api/v1/offers/$OFFER_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' | jq -r '.booking.id')

echo "Booking ID: $BOOKING_ID"

# 5. Get booking
curl -s -X GET "http://localhost:3000/api/v1/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## JWT Token Structure

### Payload
```json
{
  "sub": "00000000-0000-0000-0000-000000000001",  // User ID
  "role": "broker",                               // Primary role
  "orgId": "org-uuid",                            // Optional: Organization ID
  "iat": 1738734855,                              // Issued at
  "exp": 1738821255                               // Expires at (24h)
}
```

### Roles
- `broker` - Can create requests
- `operator` - Can create offers, accept offers
- `admin` - Full access

---

## Error Scenarios

### Missing Authorization Header
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Response**: 401 Unauthorized

### Invalid Token Format
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: InvalidFormat" \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Response**: 401 Unauthorized

### Expired Token
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer {expired-token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Response**: 401 Unauthorized

### Invalid Signature
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer {tampered-token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Response**: 401 Unauthorized

---

## Testing with Postman

### 1. Create Environment Variable
- Variable: `jwt_token`
- Value: (paste generated token)

### 2. Set Authorization Header
- Type: Bearer Token
- Token: `{{jwt_token}}`

### 3. Send Request
All protected endpoints will now use the token automatically.

---

## Implementation Details

### Auth Helper
**File**: `apps/admin/lib/auth/require-auth.ts`

```typescript
export async function getAuthOrUnauthorized(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return unauthorized('Missing or invalid authentication token');
  }
  return auth;
}
```

### Usage in Route Handler
```typescript
export async function POST(req: NextRequest) {
  // Require authentication
  const authResult = await getAuthOrUnauthorized(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  // Use auth.userId, auth.primaryRole, auth.orgId
  const userId = auth.userId;
}
```

### Auth Context
```typescript
interface AuthContext {
  userId: string;
  primaryRole: 'broker' | 'operator' | 'admin';
  orgId?: string;
}
```

---

## Environment Variables

### Development (.env.local)
```bash
JWT_SECRET=dev-secret-key-change-in-production
```

### Production
```bash
JWT_SECRET={strong-random-secret-256-bits}
```

**Generate strong secret**:
```bash
openssl rand -base64 32
```

---

## Security Notes

1. **HTTPS Only**: In production, always use HTTPS
2. **Strong Secret**: Use a cryptographically strong secret (256+ bits)
3. **Token Expiration**: Tokens expire after 24 hours
4. **No Refresh**: Currently no refresh token mechanism (future enhancement)
5. **Role-Based**: Roles are in JWT but not yet enforced (future: authorization)

---

## Next Steps

1. **Authorization**: Add role-based access control
2. **Refresh Tokens**: Implement refresh token flow
3. **OTP Login**: Implement phone OTP authentication
4. **Token Revocation**: Add token blacklist/revocation
5. **Rate Limiting**: Add rate limiting per user

---

## Troubleshooting

### "JWT_SECRET not configured"
Add `JWT_SECRET` to `apps/admin/.env.local`

### "Invalid token"
- Check token format (should be 3 parts separated by dots)
- Verify token not expired
- Ensure JWT_SECRET matches between generation and verification

### "Token expired"
Generate a new token with `generate-test-jwt.mjs`

### "401 on valid token"
- Check Authorization header format: `Bearer {token}`
- Verify admin app is running
- Check console logs for JWT verification errors
