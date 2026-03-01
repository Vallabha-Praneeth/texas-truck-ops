# GET /api/v1/requests/:id/offers - Testing Guide

## Endpoint
`GET http://localhost:3000/api/v1/requests/{id}/offers`

## Prerequisites

You need a valid request ID with some offers. Create them first:

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

### 2. Create Offers for the Request
```bash
# Create first offer (replace IDs)
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID_1}",
    "amountCents": 120000,
    "terms": {"deposit": 30}
  }'

# Create second offer (replace IDs)
curl -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "{REQUEST_ID}",
    "slotId": "{SLOT_ID_2}",
    "amountCents": 135000,
    "terms": {"deposit": 40}
  }'
```

---

## Test with curl

### Valid Request with Offers (Success Case)

Replace `{REQUEST_ID}` with an actual UUID:

```bash
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_ID}/offers
```

**Example with actual ID**:
```bash
curl -X GET http://localhost:3000/api/v1/requests/550e8400-e29b-41d4-a716-446655440000/offers
```

**Expected Response (200 OK):**
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
        "deposit": 30
      },
      "status": "pending",
      "expiresAt": null,
      "createdAt": "2026-02-04T07:52:56.789Z",
      "slot": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "startAt": "2026-02-15T08:00:00.000Z",
        "endAt": "2026-02-17T20:00:00.000Z",
        "truck": {
          "nickname": "Big Red"
        }
      }
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "slotId": "990e8400-e29b-41d4-a716-446655440000",
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "amountCents": 135000,
      "currency": "USD",
      "terms": {
        "deposit": 40
      },
      "status": "pending",
      "expiresAt": null,
      "createdAt": "2026-02-04T07:55:12.345Z",
      "slot": {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "startAt": "2026-02-16T10:00:00.000Z",
        "endAt": "2026-02-18T18:00:00.000Z",
        "truck": {
          "nickname": "Blue Thunder"
        }
      }
    }
  ],
  "total": 2
}
```

---

### Request with No Offers (Empty List)

```bash
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_ID_WITH_NO_OFFERS}/offers
```

**Expected Response (200 OK):**
```json
{
  "offers": [],
  "total": 0
}
```

**Note**: This is NOT a 404 error. An empty list is a valid response.

---

### Request Not Found (404 Error)

```bash
curl -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999/offers
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

### Invalid UUID Format (400 Error)

```bash
curl -X GET http://localhost:3000/api/v1/requests/invalid-id/offers
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request ID format"
  }
}
```

---

## Complete Test Flow

```bash
# 1. Create a request
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Houston",
    "title": "Houston Event",
    "description": "LED truck needed",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }')

# 2. Extract request ID (requires jq)
REQUEST_ID=$(echo $RESPONSE | jq -r '.id')

# 3. Create an offer for the request (replace SLOT_ID)
curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID}\",
    \"amountCents\": 100000
  }"

# 4. Fetch all offers for the request
curl -X GET http://localhost:3000/api/v1/requests/$REQUEST_ID/offers

# 5. Test 404 with non-existent request
curl -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999/offers

# 6. Test 400 with invalid ID
curl -X GET http://localhost:3000/api/v1/requests/invalid-id/offers
```

---

## Running the Admin App

Before testing, start the admin app:

```bash
cd apps/admin
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1/requests/:id/offers`

---

## Response Fields

### Offer Object
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Offer ID |
| requestId | uuid | Request ID |
| slotId | uuid | Slot ID |
| createdBy | uuid | User ID who created the offer |
| amountCents | number | Offer amount in USD cents |
| currency | string | Currency code (always "USD") |
| terms | object/null | Terms JSONB object |
| status | string | Offer status (pending/accepted/rejected/etc.) |
| expiresAt | ISO 8601/null | Expiration datetime |
| createdAt | ISO 8601 | Creation timestamp |
| slot | object/null | Slot details |

### Slot Object (nested)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Slot ID |
| startAt | ISO 8601 | Slot start datetime |
| endAt | ISO 8601 | Slot end datetime |
| truck | object/null | Truck details |

### Truck Object (nested)
| Field | Type | Description |
|-------|------|-------------|
| nickname | string | Truck nickname |

---

## Notes

1. **Empty List vs 404**: 
   - Request exists but has no offers → 200 with empty array
   - Request doesn't exist → 404 error

2. **Ordering**: Offers are ordered by `createdAt` (oldest first)

3. **Joins**: The endpoint performs LEFT JOINs with:
   - `availability_slots` to get slot details
   - `trucks` to get truck nickname

4. **Null Handling**: 
   - If slot is deleted, `slot` field will be `null`
   - If truck is deleted, `truck` field will be `null`
   - `terms` and `expiresAt` can be `null` if not provided

5. **No Pagination**: This endpoint returns all offers for the request (no limit/offset)

6. **Date Format**: All timestamps are in ISO 8601 format with timezone

---

## Use Cases

### Broker Viewing Offers on Their Request
A broker creates a request and wants to see all offers from operators:
```bash
# Broker's request ID
curl -X GET http://localhost:3000/api/v1/requests/{BROKER_REQUEST_ID}/offers
```

### Operator Checking Competition
An operator wants to see what other offers exist for a request:
```bash
# Request they're interested in
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_ID}/offers
```

### Admin Monitoring
An admin wants to see all offers for a specific request:
```bash
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_ID}/offers
```

---

## Troubleshooting

### Empty Array Returned
- Verify offers were actually created for this request
- Check that `requestId` in offers matches the request ID
- Query database directly: `SELECT * FROM offers WHERE request_id = '{REQUEST_ID}';`

### Slot/Truck Details Missing
- Slot or truck may have been deleted (LEFT JOIN returns null)
- This is expected behavior - offer still exists even if slot is deleted

### Request Not Found
- Verify the request ID exists in database
- Check UUID format is correct
- Ensure database connection is working
