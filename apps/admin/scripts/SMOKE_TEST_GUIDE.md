# Stage 3 Smoke Test Guide

## Overview

The Stage 3 smoke test validates the complete vertical slice with JWT authorization:
1. Mint broker and operator tokens
2. Create request (broker)
3. Create offer (operator)
4. Accept offer (operator)
5. View booking (both roles)

## Prerequisites

1. **JWT_SECRET** must be set in `apps/admin/.env.local`
2. **Dev server** running on `http://localhost:3000`
3. **Database** with at least one availability slot
4. **NODE_ENV** must NOT be `"production"` (or set `DEV_ONLY=true`)

## Running the Test

```bash
cd /Users/anitavallabha/B2B
./apps/admin/scripts/smoke_stage3.sh
```

## How Token Minting Works

The smoke test uses the dev-only API endpoint to mint tokens:

**Endpoint**: `POST /api/v1/dev/mint-token`

**Request**:
```json
{
  "sub": "user-id-string",
  "role": "broker" | "operator" | "admin"
}
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "sub": "user-id-string",
  "role": "broker"
}
```

## Manual Token Minting and Usage

### Step 1: Mint a Broker Token

```bash
curl -X POST http://localhost:3000/api/v1/dev/mint-token \
  -H "Content-Type: application/json" \
  -d '{"sub":"my-broker-123","role":"broker"}'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sub": "my-broker-123",
  "role": "broker"
}
```

### Step 2: Extract and Export the Token

```bash
export BROKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/dev/mint-token \
  -H "Content-Type: application/json" \
  -d '{"sub":"my-broker-123","role":"broker"}' | jq -r '.token')
```

### Step 3: Use the Token to Create a Request

```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $BROKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Billboard Campaign",
    "description": "Product launch campaign",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-15T18:00:00Z",
    "budgetCents": 500000
  }'
```

## Complete Manual Flow

```bash
# 1. Mint tokens
export BROKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/dev/mint-token \
  -H "Content-Type: application/json" \
  -d '{"sub":"broker-123","role":"broker"}' | jq -r '.token')

export OPERATOR_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/dev/mint-token \
  -H "Content-Type: application/json" \
  -d '{"sub":"operator-456","role":"operator"}' | jq -r '.token')

# 2. Create request (broker)
REQUEST_ID=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $BROKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Test Campaign",
    "description": "Testing auth",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-15T18:00:00Z"
  }' | jq -r '.id')

echo "Created request: $REQUEST_ID"

# 3. Create offer (operator) - requires valid SLOT_ID
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"YOUR_SLOT_ID\",
    \"amountCents\": 450000
  }"
```

## Troubleshooting

### "Token minting is only available in development"
- Ensure `NODE_ENV !== "production"` or set `DEV_ONLY=true`

### "JWT_SECRET not configured"
- Add `JWT_SECRET=your-secret-key` to `apps/admin/.env.local`

### "Failed to mint token (HTTP 500)"
- Check that JWT_SECRET is set correctly
- Verify the dev server is running

### "Unexpected 401 Unauthorized"
- Token may have expired (24h lifetime)
- JWT_SECRET mismatch between minting and verification

### "Unexpected 403 Forbidden"
- Wrong role for the endpoint (e.g., operator trying to create request)
- Ownership check failed (e.g., operator doesn't own the truck's org)

## What the Smoke Test Validates

✅ Token minting via API  
✅ Broker can create requests  
✅ Operator can create offers  
✅ Operator can accept offers  
✅ Broker can view their requests and bookings  
✅ Operator can view offers and bookings for their org  
✅ All authorization checks work correctly  
