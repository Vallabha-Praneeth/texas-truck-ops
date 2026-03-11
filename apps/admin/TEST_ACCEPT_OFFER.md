# POST /api/v1/offers/:id/accept - Testing Guide

## Endpoint
`POST http://localhost:3000/api/v1/offers/{id}/accept`

## Purpose
Accept an offer and create a booking. This endpoint performs a database transaction to ensure atomicity.

---

## Prerequisites

You need a valid offer ID. Create the full flow:

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

# Copy the "id" - this is REQUEST_ID
```

### 2. Create an Offer
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
    }
  }'

# Copy the "id" - this is OFFER_ID
```

---

## Test with curl

### Valid Accept (Success Case)

Replace `{OFFER_ID}` with an actual UUID from a pending offer:

```bash
curl -X POST http://localhost:3000/api/v1/offers/{OFFER_ID}/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example with actual ID**:
```bash
curl -X POST http://localhost:3000/api/v1/offers/770e8400-e29b-41d4-a716-446655440000/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (201 Created):**
```json
{
  "booking": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "slotId": "660e8400-e29b-41d4-a716-446655440000",
    "acceptedOfferId": "770e8400-e29b-41d4-a716-446655440000",
    "operatorOrgId": "bb0e8400-e29b-41d4-a716-446655440000",
    "brokerUserId": "00000000-0000-0000-0000-000000000001",
    "status": "pending_deposit",
    "amountCents": 120000,
    "depositCents": 36000,
    "createdAt": "2026-02-04T08:41:45.789Z"
  }
}
```

**What Happens**:
1. ✅ Booking created with status "pending_deposit"
2. ✅ Offer status updated to "accepted"
3. ✅ Request status updated to "matched"
4. ✅ Deposit calculated (30% of amount = 36,000 cents)

---

### Offer Not Found (404 Error)

```bash
curl -X POST http://localhost:3000/api/v1/offers/00000000-0000-0000-0000-999999999999/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Offer not found"
  }
}
```

---

### Offer Not Pending (409 Error)

If offer status is "accepted", "rejected", or "expired":

```bash
curl -X POST http://localhost:3000/api/v1/offers/{ACCEPTED_OFFER_ID}/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (409 Conflict):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Offer is not in pending status"
  }
}
```

---

### Request Not Open (409 Error)

If request status is "matched" or "closed":

```bash
curl -X POST http://localhost:3000/api/v1/offers/{OFFER_FOR_CLOSED_REQUEST}/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (409 Conflict):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Request is not open"
  }
}
```

---

### Slot Already Booked (409 Error)

If slot already has a booking (race condition):

```bash
curl -X POST http://localhost:3000/api/v1/offers/{OFFER_FOR_BOOKED_SLOT}/accept \
  -H "Content-Type: application/json" \
  -d '{}'
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

### Invalid UUID Format (400 Error)

```bash
curl -X POST http://localhost:3000/api/v1/offers/invalid-id/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid offer ID format"
  }
}
```

---

## Complete Test Flow

```bash
# 1. Create a request
REQUEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Houston",
    "title": "Houston Event",
    "description": "LED truck needed",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }')

REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.id')
echo "Request ID: $REQUEST_ID"

# 2. Create an offer (replace SLOT_ID)
OFFER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID}\",
    \"amountCents\": 100000,
    \"terms\": {\"deposit\": 30}
  }")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')
echo "Offer ID: $OFFER_ID"

# 3. Accept the offer
curl -X POST http://localhost:3000/api/v1/offers/$OFFER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{}'

# 4. Verify booking was created
# (You can query bookings endpoint when implemented)

# 5. Try to accept again (should fail - offer not pending)
curl -X POST http://localhost:3000/api/v1/offers/$OFFER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Running the Admin App

Before testing, start the admin app:

```bash
cd apps/admin
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1/offers/:id/accept`

---

## Transaction Flow

### Database Transaction Steps

The endpoint uses a **single database transaction** to ensure atomicity:

```typescript
await db.transaction(async (tx) => {
  // 1. Load offer
  const offer = await tx.select()...;
  
  // 2. Verify offer.status === 'pending'
  if (offer.status !== 'pending') throw error;
  
  // 3. Load request and verify status === 'open'
  const request = await tx.select()...;
  if (request.status !== 'open') throw error;
  
  // 4. Check slot not booked
  const existingBooking = await tx.select()...;
  if (existingBooking) throw error;
  
  // 5. Get operator org ID (slot → truck → org)
  const slotWithTruck = await tx.select()...;
  
  // 6. Create booking
  const booking = await tx.insert(bookings)...;
  
  // 7. Update offer status to 'accepted'
  await tx.update(offers).set({ status: 'accepted' })...;
  
  // 8. Update request status to 'matched'
  await tx.update(requests).set({ status: 'matched' })...;
  
  return booking;
});
```

### Why Transaction?

**Atomicity**: All operations succeed or all fail together.

**Race Condition Prevention**:
- If two users try to accept different offers for the same slot simultaneously
- Transaction ensures only one succeeds
- The other gets a unique constraint violation error

**Data Consistency**:
- Booking, offer, and request are always in sync
- No orphaned bookings or inconsistent states

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| booking.id | uuid | Booking ID (auto-generated) |
| booking.slotId | uuid | Slot ID from offer |
| booking.acceptedOfferId | uuid | Offer ID that was accepted |
| booking.operatorOrgId | uuid | Operator organization (from truck) |
| booking.brokerUserId | uuid | Broker user (from offer creator) |
| booking.status | string | Always "pending_deposit" initially |
| booking.amountCents | number | Total amount from offer |
| booking.depositCents | number | Calculated deposit (30% default) |
| booking.createdAt | ISO 8601 | Creation timestamp |

---

## Business Logic

### Deposit Calculation
```typescript
const depositPercentage = offer.terms?.deposit || 30; // Default 30%
const depositCents = Math.round((amountCents * depositPercentage) / 100);
```

**Example**:
- Amount: 120,000 cents ($1,200)
- Deposit %: 30%
- Deposit: 36,000 cents ($360)

### Operator Org ID Resolution
```
Offer → Slot → Truck → Org
```

The operator org ID comes from the truck that owns the slot.

### Status Updates
- **Offer**: `pending` → `accepted`
- **Request**: `open` → `matched`
- **Booking**: Created with `pending_deposit`

---

## Error Scenarios

### 404 Not Found
- Offer ID doesn't exist
- Request doesn't exist (data integrity issue)
- Slot or truck doesn't exist (data integrity issue)

### 409 Conflict
- Offer status is not "pending" (already accepted/rejected/expired)
- Request status is not "open" (already matched/closed)
- Slot already has a booking (race condition or duplicate)

### 400 Validation Error
- Invalid UUID format

---

## Database Constraints

### Unique Constraint on bookings.slot_id
Prevents double-booking at database level:
```sql
CREATE UNIQUE INDEX bookings_slot_unique_idx ON bookings (slot_id);
```

If transaction tries to create a second booking for the same slot, PostgreSQL will reject it with a unique constraint violation.

---

## Notes

1. **Empty Request Body**: The endpoint accepts an empty JSON object `{}` as per API contract.

2. **Idempotency**: Not idempotent - calling twice will fail the second time (offer no longer pending).

3. **Rollback**: If any step in the transaction fails, all changes are rolled back automatically.

4. **Deposit Terms**: Reads deposit percentage from offer terms, defaults to 30% if not specified.

5. **Authentication**: Currently uses stub user ID. In production, would verify user is authorized to accept (slot owner).

---

## Drizzle Transaction Implementation

Drizzle provides transaction support via `db.transaction()`:

```typescript
const result = await db.transaction(async (tx) => {
  // All queries use 'tx' instead of 'db'
  const data = await tx.select()...;
  await tx.insert()...;
  await tx.update()...;
  
  // If any query throws, entire transaction rolls back
  // If function completes, transaction commits
  
  return data;
});
```

**Key Points**:
- Uses PostgreSQL `BEGIN`, `COMMIT`, `ROLLBACK`
- All queries in callback use transaction connection
- Automatic rollback on error
- Automatic commit on success
- Isolation level: READ COMMITTED (PostgreSQL default)
