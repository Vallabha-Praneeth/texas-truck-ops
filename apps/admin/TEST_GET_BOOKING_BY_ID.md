# GET /api/v1/bookings/:id - Testing Guide

## Endpoint
`GET http://localhost:3000/api/v1/bookings/{id}`

## Purpose
Retrieve detailed information about a specific booking including related slot, truck, organization, and user data.

---

## Prerequisites

You need a valid booking ID. Create one by accepting an offer:

### 1. Create Request, Offer, and Accept
```bash
# Create request
REQUEST_ID=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Test Campaign",
    "description": "Test",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z"
  }' | jq -r '.id')

# Create offer (replace SLOT_ID)
OFFER_ID=$(curl -s -X POST http://localhost:3000/api/v1/offers \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"slotId\": \"{SLOT_ID}\",
    \"amountCents\": 120000,
    \"terms\": {\"deposit\": 30}
  }" | jq -r '.id')

# Accept offer to create booking
BOOKING_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/offers/$OFFER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{}')

BOOKING_ID=$(echo $BOOKING_RESPONSE | jq -r '.booking.id')
echo "Booking ID: $BOOKING_ID"
```

---

## Test with curl

### Valid Request (Success Case)

Replace `{BOOKING_ID}` with an actual UUID:

```bash
curl -X GET http://localhost:3000/api/v1/bookings/{BOOKING_ID}
```

**Example with actual ID**:
```bash
curl -X GET http://localhost:3000/api/v1/bookings/aa0e8400-e29b-41d4-a716-446655440000
```

**Expected Response (200 OK):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "slotId": "660e8400-e29b-41d4-a716-446655440000",
  "acceptedOfferId": "770e8400-e29b-41d4-a716-446655440000",
  "operatorOrgId": "bb0e8400-e29b-41d4-a716-446655440000",
  "brokerUserId": "00000000-0000-0000-0000-000000000001",
  "driverUserId": null,
  "status": "pending_deposit",
  "amountCents": 120000,
  "depositCents": 36000,
  "depositPaidAt": null,
  "startedAt": null,
  "completedAt": null,
  "cancelledAt": null,
  "cancellationReason": null,
  "createdAt": "2026-02-04T08:41:45.789Z",
  "updatedAt": "2026-02-04T08:41:45.789Z",
  "slot": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "startAt": "2026-02-15T08:00:00.000Z",
    "endAt": "2026-02-17T20:00:00.000Z",
    "truck": {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "nickname": "Big Red",
      "plateNumber": "TX-ABC123"
    }
  },
  "operatorOrg": {
    "id": "bb0e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Trucking"
  },
  "brokerUser": {
    "id": "00000000-0000-0000-0000-000000000001",
    "displayName": "Stub User"
  },
  "driver": null
}
```

---

### Booking Not Found (404 Error)

```bash
curl -X GET http://localhost:3000/api/v1/bookings/00000000-0000-0000-0000-999999999999
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Booking not found"
  }
}
```

---

### Invalid UUID Format (400 Error)

```bash
curl -X GET http://localhost:3000/api/v1/bookings/invalid-id
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid booking ID format"
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

The API will be available at `http://localhost:3000/api/v1/bookings/:id`

---

## Response Fields

### Booking Object
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Booking ID |
| slotId | uuid | Slot ID |
| acceptedOfferId | uuid | Offer ID that was accepted |
| operatorOrgId | uuid | Operator organization ID |
| brokerUserId | uuid | Broker user ID |
| driverUserId | uuid/null | Driver user ID (null if not assigned) |
| status | string | Booking status (pending_deposit/confirmed/running/etc.) |
| amountCents | number | Total amount in USD cents |
| depositCents | number | Deposit amount in USD cents |
| depositPaidAt | ISO 8601/null | Deposit payment timestamp |
| startedAt | ISO 8601/null | Job start timestamp |
| completedAt | ISO 8601/null | Job completion timestamp |
| cancelledAt | ISO 8601/null | Cancellation timestamp |
| cancellationReason | string/null | Reason for cancellation |
| createdAt | ISO 8601 | Creation timestamp |
| updatedAt | ISO 8601 | Last update timestamp |

### Nested Objects
| Field | Type | Description |
|-------|------|-------------|
| slot | object/null | Slot details |
| slot.id | uuid | Slot ID |
| slot.startAt | ISO 8601 | Slot start time |
| slot.endAt | ISO 8601 | Slot end time |
| slot.truck | object/null | Truck details |
| slot.truck.id | uuid | Truck ID |
| slot.truck.nickname | string | Truck nickname |
| slot.truck.plateNumber | string | Truck plate number |
| operatorOrg | object/null | Operator organization |
| operatorOrg.id | uuid | Organization ID |
| operatorOrg.name | string | Organization name |
| brokerUser | object/null | Broker user |
| brokerUser.id | uuid | User ID |
| brokerUser.displayName | string | User display name |
| driver | object/null | Driver user (if assigned) |
| driver.id | uuid | Driver user ID |
| driver.displayName | string | Driver display name |

---

## Database Joins

The endpoint performs multiple LEFT JOINs to fetch all related data:

```sql
SELECT 
  bookings.*,
  availability_slots.start_at,
  availability_slots.end_at,
  trucks.id AS truck_id,
  trucks.nickname AS truck_nickname,
  trucks.plate_number AS truck_plate_number,
  orgs.name AS operator_org_name,
  users.display_name AS broker_display_name
FROM bookings
LEFT JOIN availability_slots ON bookings.slot_id = availability_slots.id
LEFT JOIN trucks ON availability_slots.truck_id = trucks.id
LEFT JOIN orgs ON bookings.operator_org_id = orgs.id
LEFT JOIN users ON bookings.broker_user_id = users.id
WHERE bookings.id = $1;

-- Separate query for driver (if exists)
SELECT id, display_name FROM users WHERE id = $2;
```

**Why separate driver query?**
- Can't alias the same table (`users`) twice in one Drizzle query
- Driver is optional (may be null)
- Keeps main query simpler

---

## Null Handling

### Optional Timestamps
- `depositPaidAt`: null until deposit is paid
- `startedAt`: null until job starts
- `completedAt`: null until job completes
- `cancelledAt`: null unless cancelled

### Optional References
- `driverUserId`: null until driver assigned
- `driver`: null if no driver assigned
- `slot`: null if slot deleted (shouldn't happen)
- `slot.truck`: null if truck deleted (shouldn't happen)
- `operatorOrg`: null if org deleted (shouldn't happen)
- `brokerUser`: null if user deleted (shouldn't happen)

---

## Booking Status Values

| Status | Description |
|--------|-------------|
| pending_deposit | Waiting for deposit payment |
| confirmed | Deposit paid, booking confirmed |
| running | Job in progress |
| awaiting_review | Job completed, awaiting review |
| completed | Job reviewed and completed |
| cancelled | Booking cancelled |
| disputed | Dispute raised |

---

## Use Cases

### Operator Viewing Booking
Operator wants to see details of a booking for their truck:
```bash
curl -X GET http://localhost:3000/api/v1/bookings/{BOOKING_ID}
```

### Broker Checking Status
Broker wants to check the status of their booking:
```bash
curl -X GET http://localhost:3000/api/v1/bookings/{BOOKING_ID}
```

### Driver Viewing Assignment
Driver wants to see details of their assigned booking:
```bash
curl -X GET http://localhost:3000/api/v1/bookings/{BOOKING_ID}
```

### Admin Monitoring
Admin wants to view any booking for support:
```bash
curl -X GET http://localhost:3000/api/v1/bookings/{BOOKING_ID}
```

---

## Notes

1. **All timestamps in ISO 8601**: Consistent format across all date fields

2. **Nested objects**: Slot, truck, org, and user details included for convenience

3. **LEFT JOINs**: Ensures booking is returned even if related data is deleted

4. **Driver separate query**: Required because can't join users table twice in Drizzle

5. **No pagination**: Single booking fetch, no need for pagination

6. **No authorization**: Currently anyone can view any booking (MVP limitation)

---

## Troubleshooting

### Booking Not Found
- Verify booking ID exists in database
- Check UUID format is correct
- Ensure database connection is working

### Missing Nested Data
- Slot/truck/org/user may have been deleted (LEFT JOIN returns null)
- This is expected behavior - booking still exists

### Driver Always Null
- Driver is only assigned after booking is confirmed
- Check `driverUserId` field in booking record
