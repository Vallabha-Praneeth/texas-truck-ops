# POST /api/v1/offers - Testing Guide

## Endpoint
`POST http://localhost:3000/api/v1/offers`

## Prerequisites

You need valid request and slot IDs. Create them first:

### 1. Create a Request
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Downtown Dallas Campaign",
    "description": "Need LED truck for 3-day campaign",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z",
    "budgetCents": 150000
  }'

# Copy the "id" from response - this is your REQUEST_ID
```

### 2. Create a Slot (requires truck and org setup)
For testing, you'll need to manually insert a slot or use an existing slot ID from your database.

---

## Test with curl

### Valid Offer (Success Case)

Replace `{REQUEST_ID}` and `{SLOT_ID}` with actual UUIDs:

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID}",
    "amountCents": 120000,
    "terms": {
      "deposit": 30,
      "cancellationPolicy": "24 hours notice"
    },
    "expiresAt": "2026-02-05T10:00:00Z"
  }'
```

**Example with actual IDs**:
```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "slotId": "660e8400-e29b-41d4-a716-446655440000",
    "amountCents": 120000,
    "terms": {
      "deposit": 30,
      "cancellationPolicy": "24 hours notice"
    },
    "expiresAt": "2026-02-05T10:00:00Z"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "slotId": "660e8400-e29b-41d4-a716-446655440000",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "amountCents": 120000,
  "currency": "USD",
  "terms": {
    "deposit": 30,
    "cancellationPolicy": "24 hours notice"
  },
  "status": "pending",
  "expiresAt": "2026-02-05T10:00:00.000Z",
  "createdAt": "2026-02-04T07:52:56.789Z"
}
```

---

### Minimal Valid Offer (Optional Fields Omitted)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID}",
    "amountCents": 100000
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid",
  "requestId": "...",
  "slotId": "...",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "amountCents": 100000,
  "currency": "USD",
  "terms": null,
  "status": "pending",
  "expiresAt": null,
  "createdAt": "2026-02-04T07:52:56.789Z"
}
```

---

### Invalid Amount (Error Case)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID}",
    "amountCents": -1000
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "amountCents",
        "message": "Amount must be a positive integer"
      }
    ]
  }
}
```

---

### Invalid UUID Format (Error Case)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "invalid-uuid",
    "slotId": "{SLOT_ID}",
    "amountCents": 120000
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "requestId",
        "message": "Request ID must be a valid UUID"
      }
    ]
  }
}
```

---

### Request Not Found (404 Error)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "00000000-0000-0000-0000-999999999999",
    "slotId": "{SLOT_ID}",
    "amountCents": 120000
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Request not found"
  }
}
```

---

### Slot Not Found (404 Error)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "00000000-0000-0000-0000-999999999999",
    "amountCents": 120000
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Slot not found"
  }
}
```

---

### Request Not Open (409 Error)

If the request status is "matched" or "closed":

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{CLOSED_REQUEST_ID}",
    "slotId": "{SLOT_ID}",
    "amountCents": 120000
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Request is not open for offers"
  }
}
```

---

### Slot Already Booked (409 Error)

If the slot is already associated with a booking:

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{BOOKED_SLOT_ID}",
    "amountCents": 120000
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Slot already booked"
  }
}
```

---

### Expiration in Past (Error Case)

```bash
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID}",
    "amountCents": 120000,
    "expiresAt": "2020-01-01T10:00:00Z"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "expiresAt",
        "message": "expiresAt must be in the future"
      }
    ]
  }
}
```

---

## Running the Admin App

Before testing, start the admin app:

```bash
cd apps/admin
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1/offers`

---

## Notes

1. **Authentication**: Currently using stub user ID `00000000-0000-0000-0000-000000000001`. In production, this would be replaced with actual JWT authentication.

2. **Request Status Check**: The endpoint verifies that the request status is "open" before allowing offer creation.

3. **Slot Availability Check**: The endpoint checks if the slot is already booked (has an associated booking) and rejects the offer if so.

4. **Currency**: Always defaults to "USD" regardless of input.

5. **Status**: New offers always start with status "pending".

6. **Terms**: Optional JSONB field that can contain any valid JSON object.

7. **Expiration**: Optional ISO 8601 datetime. If provided, must be in the future.

8. **Amount**: Must be a positive integer in USD cents (e.g., 120000 = $1,200.00).

---

## Business Logic

### Offer Creation Flow
1. Validate input data (UUIDs, amount, expiration)
2. Check request exists and is "open"
3. Check slot exists
4. Check slot is not already booked
5. Create offer with status "pending"
6. Return created offer

### Why Check Request Status?
- Only "open" requests should accept new offers
- "matched" requests already have an accepted offer
- "closed" requests are no longer active

### Why Check Slot Booking?
- Prevents offers on slots that are already committed
- Avoids race conditions where multiple offers compete for a booked slot
- Ensures data integrity

---

## Database Requirements

For successful testing, ensure:
1. A valid user exists with ID `00000000-0000-0000-0000-000000000001`
2. Valid request(s) exist with status "open"
3. Valid availability slot(s) exist
4. Database connection configured in `packages/db/.env`
