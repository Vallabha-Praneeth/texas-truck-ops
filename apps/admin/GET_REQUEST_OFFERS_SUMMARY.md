# GET /api/v1/requests/:id/offers - Implementation Summary

## Status
✅ **ALREADY IMPLEMENTED** (Stage 3.3 Step 2, verified in Step 4)

## File Location
`apps/admin/app/api/v1/requests/[id]/offers/route.ts`

---

## Implementation Details

### ✅ All Requirements Met

1. **UUID Validation**: Returns 400 for invalid UUID format
2. **Request Verification**: Returns 404 if request doesn't exist
3. **Offers Query**: Fetches all offers where `requestId == :id`
4. **Response Shape**: Matches API contract exactly
5. **ISO 8601 Timestamps**: All dates formatted as ISO 8601 strings
6. **Null Handling**: `expiresAt` and `terms` can be null
7. **Currency Preserved**: Returns "USD" from database
8. **Sorting**: DESC by `createdAt` (newest first)
9. **Empty Array**: Returns 200 with `[]` if no offers (not 404)
10. **No Schema Changes**: No database modifications
11. **No Git**: No git operations

---

## Complete File Contents

The file is already implemented at:
**`apps/admin/app/api/v1/requests/[id]/offers/route.ts`**

Key features:
- UUID regex validation
- Request existence check
- LEFT JOINs with `availability_slots` and `trucks`
- Sorted by `createdAt DESC`
- ISO 8601 timestamp conversion
- Nested `slot` and `truck` objects
- Empty array handling

---

## curl Examples

### 1. Success Case - Fetch Offers for Request

```bash
curl -X GET http://localhost:3000/api/v1/requests/550e8400-e29b-41d4-a716-446655440000/offers
```

**Expected Response (200 OK)**:
```json
{
  "offers": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
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
      "createdAt": "2026-02-04T10:00:00.000Z",
      "slot": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "startAt": "2026-02-15T08:00:00.000Z",
        "endAt": "2026-02-17T20:00:00.000Z",
        "truck": {
          "nickname": "Big Red"
        }
      }
    }
  ],
  "total": 1
}
```

---

### 2. Negative Test - Invalid UUID (400 Error)

```bash
curl -X GET http://localhost:3000/api/v1/requests/invalid-uuid-format/offers
```

**Expected Response (400 Bad Request)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request ID format"
  }
}
```

---

### 3. Request Not Found (404 Error)

```bash
curl -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999/offers
```

**Expected Response (404 Not Found)**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Request not found"
  }
}
```

---

### 4. Empty Offers List (200 OK, Not 404)

```bash
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_WITH_NO_OFFERS}/offers
```

**Expected Response (200 OK)**:
```json
{
  "offers": [],
  "total": 0
}
```

**Important**: This is NOT a 404 error. An empty list is a valid response when the request exists but has no offers.

---

## Complete Test Flow

```bash
# 1. Create a request
REQUEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Test Campaign",
    "description": "Testing offers endpoint",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z",
    "budgetCents": 150000
  }')

REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.id')
echo "Created Request ID: $REQUEST_ID"

# 2. Fetch offers (should be empty initially)
echo "\n--- Fetching offers (should be empty) ---"
curl -s -X GET http://localhost:3000/api/v1/requests/$REQUEST_ID/offers | jq

# 3. Create first offer (replace SLOT_ID)
echo "\n--- Creating first offer ---"
curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID_1}\",
    \"amountCents\": 100000,
    \"terms\": {\"deposit\": 30}
  }" | jq

# 4. Create second offer (replace SLOT_ID)
echo "\n--- Creating second offer ---"
curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID_2}\",
    \"amountCents\": 120000,
    \"terms\": {\"deposit\": 40}
  }" | jq

# 5. Fetch offers again (should have 2 offers, newest first)
echo "\n--- Fetching offers (should have 2, newest first) ---"
curl -s -X GET http://localhost:3000/api/v1/requests/$REQUEST_ID/offers | jq

# 6. Test invalid UUID (should return 400)
echo "\n--- Testing invalid UUID (should return 400) ---"
curl -s -X GET http://localhost:3000/api/v1/requests/invalid-id/offers | jq

# 7. Test non-existent request (should return 404)
echo "\n--- Testing non-existent request (should return 404) ---"
curl -s -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999/offers | jq
```

---

## Response Structure

### Top-Level
```typescript
{
  offers: Array<Offer>,  // Array of offer objects
  total: number          // Count of offers
}
```

### Offer Object
```typescript
{
  id: string;              // UUID
  requestId: string;       // UUID
  slotId: string;          // UUID
  createdBy: string;       // UUID
  amountCents: number;     // Integer (USD cents)
  currency: string;        // "USD"
  terms: object | null;    // JSONB or null
  status: string;          // "pending" | "accepted" | "rejected" | "expired"
  expiresAt: string | null; // ISO 8601 or null
  createdAt: string;       // ISO 8601
  slot: {                  // Nested slot object or null
    id: string;            // UUID
    startAt: string;       // ISO 8601
    endAt: string;         // ISO 8601
    truck: {               // Nested truck object or null
      nickname: string;
    } | null;
  } | null;
}
```

---

## Sorting Behavior

**Order**: `createdAt DESC` (newest first)

**Rationale**:
- Most recent offers are most relevant
- Common UX pattern in marketplaces
- Matches user expectations

**SQL**:
```sql
ORDER BY offers.created_at DESC
```

---

## Database Queries

### 1. Verify Request Exists
```sql
SELECT id FROM requests WHERE id = $1 LIMIT 1;
```

### 2. Fetch Offers with JOINs
```sql
SELECT 
  offers.*,
  availability_slots.start_at,
  availability_slots.end_at,
  trucks.nickname
FROM offers
LEFT JOIN availability_slots ON offers.slot_id = availability_slots.id
LEFT JOIN trucks ON availability_slots.truck_id = trucks.id
WHERE offers.request_id = $1
ORDER BY offers.created_at DESC;
```

---

## Key Implementation Details

### UUID Validation
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(id)) {
  return 400;
}
```

### Request Verification
```typescript
const [existingRequest] = await db
  .select({ id: requests.id })
  .from(requests)
  .where(eq(requests.id, id))
  .limit(1);

if (!existingRequest) {
  return 404;
}
```

### Empty Array Handling
```typescript
// Always return 200 with array (even if empty)
return NextResponse.json({
  offers: formattedOffers,  // [] if no offers
  total: formattedOffers.length  // 0 if no offers
}, { status: 200 });
```

### ISO 8601 Conversion
```typescript
expiresAt: offer.expiresAt ? offer.expiresAt.toISOString() : null,
createdAt: offer.createdAt.toISOString(),
```

---

## Documentation

- **Full Test Guide**: `apps/admin/TEST_GET_REQUEST_OFFERS.md`
- **Walkthrough**: `stage3.3.2_walkthrough.md`
- **Previous Summary**: `apps/admin/GET_REQUEST_OFFERS_SUMMARY.md`

---

## Running the Endpoint

```bash
# Start the admin app
cd apps/admin
pnpm dev

# Endpoint available at:
# http://localhost:3000/api/v1/requests/:id/offers
```

---

## Summary

This endpoint is **fully implemented and tested**. It meets all requirements:

✅ UUID validation (400 on invalid)  
✅ Request verification (404 if not found)  
✅ Offers query with JOINs  
✅ API contract compliance  
✅ ISO 8601 timestamps  
✅ Null handling (expiresAt, terms)  
✅ Currency preservation ("USD")  
✅ DESC sorting (newest first)  
✅ Empty array handling (200, not 404)  
✅ No schema changes  
✅ No git operations  

**Status**: ✅ READY FOR PRODUCTION
