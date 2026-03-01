# GET /api/v1/requests/:id - Testing Guide

## Endpoint
`GET http://localhost:3000/api/v1/requests/{id}`

## Prerequisites

First, create a request to get a valid ID:

```bash
# Create a request
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Downtown Dallas Campaign",
    "description": "Need LED truck for 3-day campaign",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z",
    "budgetCents": 150000,
    "minScreenWidthFt": "10"
  }'

# Copy the "id" from the response
```

---

## Test with curl

### Valid Request (Success Case)

Replace `{REQUEST_ID}` with an actual UUID from a created request:

```bash
curl -X GET http://localhost:3000/api/v1/requests/{REQUEST_ID}
```

**Example with actual ID**:
```bash
curl -X GET http://localhost:3000/api/v1/requests/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "region": "DFW",
  "title": "Downtown Dallas Campaign",
  "description": "Need LED truck for 3-day campaign",
  "preferredStartAt": "2026-02-15T08:00:00.000Z",
  "preferredEndAt": "2026-02-17T20:00:00.000Z",
  "budgetCents": 150000,
  "minScreenWidthFt": "10",
  "status": "open",
  "createdAt": "2026-02-04T07:36:56.789Z",
  "creator": {
    "id": "00000000-0000-0000-0000-000000000001",
    "displayName": "Stub User"
  }
}
```

---

### Request Not Found (404 Error)

```bash
curl -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999
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
curl -X GET http://localhost:3000/api/v1/requests/invalid-id
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

### Another Invalid UUID Example

```bash
curl -X GET http://localhost:3000/api/v1/requests/12345
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
# 1. Create a request and capture the ID
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Houston",
    "title": "Houston Event",
    "description": "LED truck needed for Houston event",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }')

# 2. Extract the ID (requires jq)
REQUEST_ID=$(echo $RESPONSE | jq -r '.id')

# 3. Fetch the request by ID
curl -X GET http://localhost:3000/api/v1/requests/$REQUEST_ID

# 4. Test 404 with non-existent ID
curl -X GET http://localhost:3000/api/v1/requests/00000000-0000-0000-0000-999999999999

# 5. Test 400 with invalid ID
curl -X GET http://localhost:3000/api/v1/requests/invalid-id
```

---

## Running the Admin App

Before testing, start the admin app:

```bash
cd apps/admin
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1/requests/:id`

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Request ID |
| createdBy | uuid | User ID who created the request |
| region | string | Texas region (DFW, Houston, etc.) |
| title | string | Request title |
| description | string | Detailed description |
| preferredStartAt | ISO 8601 | Preferred start datetime |
| preferredEndAt | ISO 8601 | Preferred end datetime |
| budgetCents | number/null | Budget in USD cents |
| minScreenWidthFt | string/null | Minimum screen width |
| status | string | Request status (open/matched/closed) |
| createdAt | ISO 8601 | Creation timestamp |
| creator | object | Creator user details |
| creator.id | uuid | Creator user ID |
| creator.displayName | string | Creator display name |

---

## Notes

1. **UUID Validation**: The endpoint validates that the ID is a properly formatted UUID v4 before querying the database.

2. **Creator Join**: The endpoint performs a LEFT JOIN with the `users` table to include creator details in the response.

3. **Null Handling**: Optional fields (`budgetCents`, `minScreenWidthFt`) may be `null` in the response.

4. **Date Format**: All timestamps are returned in ISO 8601 format with timezone (e.g., `2026-02-15T08:00:00.000Z`).

5. **Error Consistency**: All errors follow the same JSON structure:
   ```json
   {
     "error": {
       "code": "ERROR_CODE",
       "message": "Human-readable message"
     }
   }
   ```

6. **Database**: Requires Neon database connection configured in `packages/db/.env`.

---

## Troubleshooting

### Request Not Found
- Verify the request ID exists in the database
- Check that you're using the correct UUID format
- Ensure the database connection is working

### Invalid UUID Format
- UUIDs must be in format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- All characters must be hexadecimal (0-9, a-f)
- Example valid UUID: `550e8400-e29b-41d4-a716-446655440000`

### Server Error (500)
- Check the admin app console for error details
- Verify database connection in `packages/db/.env`
- Ensure the `requests` and `users` tables exist
