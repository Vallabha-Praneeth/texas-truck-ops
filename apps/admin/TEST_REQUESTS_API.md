# POST /api/v1/requests - Testing Guide

## Endpoint
`POST http://localhost:3000/api/v1/requests`

## Test with curl

### Valid Request (Success Case)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "DFW",
    "title": "Downtown Dallas Campaign",
    "description": "Need LED truck for 3-day campaign in downtown Dallas area",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z",
    "budgetCents": 150000,
    "minScreenWidthFt": "10"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid",
  "createdBy": "00000000-0000-0000-0000-000000000001",
  "region": "DFW",
  "title": "Downtown Dallas Campaign",
  "description": "Need LED truck for 3-day campaign in downtown Dallas area",
  "preferredStartAt": "2026-02-15T08:00:00.000Z",
  "preferredEndAt": "2026-02-17T20:00:00.000Z",
  "budgetCents": 150000,
  "minScreenWidthFt": "10",
  "status": "open",
  "createdAt": "2026-02-04T07:36:56.789Z"
}
```

---

### Minimal Valid Request (Optional Fields Omitted)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Houston",
    "title": "Houston Event",
    "description": "LED truck needed for Houston event",
    "preferredStartAt": "2026-03-01T10:00:00Z",
    "preferredEndAt": "2026-03-01T18:00:00Z"
  }'
```

---

### Invalid Region (Error Case)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "New York",
    "title": "Test",
    "description": "Test description",
    "preferredStartAt": "2026-02-15T08:00:00Z",
    "preferredEndAt": "2026-02-17T20:00:00Z"
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
        "field": "region",
        "message": "Region must be a valid Texas region (DFW, Houston, Austin, San Antonio, El Paso, or RGV)"
      }
    ]
  }
}
```

---

### Invalid Time Range (Error Case)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "Austin",
    "title": "Test",
    "description": "Test description",
    "preferredStartAt": "2026-02-17T20:00:00Z",
    "preferredEndAt": "2026-02-15T08:00:00Z"
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
        "field": "preferredEndAt",
        "message": "preferredEndAt must be after preferredStartAt"
      }
    ]
  }
}
```

---

### Past Date (Error Case)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{
    "region": "San Antonio",
    "title": "Test",
    "description": "Test description",
    "preferredStartAt": "2020-01-01T08:00:00Z",
    "preferredEndAt": "2020-01-02T08:00:00Z"
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
        "field": "preferredStartAt",
        "message": "preferredStartAt must be in the future"
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

The API will be available at `http://localhost:3000/api/v1/requests`

---

## Notes

1. **Authentication**: Currently using stub user ID `00000000-0000-0000-0000-000000000001`. In production, this would be replaced with actual JWT authentication.

2. **Texas Regions**: Only these regions are accepted:
   - DFW
   - Houston
   - Austin
   - San Antonio
   - El Paso
   - RGV

3. **Date Format**: All dates must be in ISO 8601 format with timezone (e.g., `2026-02-15T08:00:00Z`)

4. **Budget**: Optional, in USD cents (e.g., 150000 = $1,500.00)

5. **Database**: Requires Neon database connection configured in `packages/db/.env`
