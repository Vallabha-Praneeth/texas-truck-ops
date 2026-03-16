# Proofs Module

## Overview

The Proofs module handles proof-of-performance uploads for the LED Billboard Marketplace. It enables drivers to upload timestamped photos with GPS coordinates to prove completion of advertising runs, and allows brokers/operators to approve or reject these proofs.

## Architecture

### Module Structure

```
proofs/
├── dto/
│   ├── create-proof.dto.ts      # DTO for proof creation
│   ├── approve-proof.dto.ts     # DTO for proof approval
│   └── reject-proof.dto.ts      # DTO for proof rejection
├── proof-upload.repository.ts   # Database operations
├── proofs.service.ts            # Business logic
├── proofs.controller.ts         # REST API endpoints
├── proofs.module.ts             # Module configuration
└── README.md                    # This file
```

### Dependencies

- **SupabaseModule**: For image storage
- **BookingsModule**: For booking state transitions

## API Endpoints

### POST /api/proofs

Upload a proof of performance with an image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: JWT required (driver role)

**Form Data:**
- `image` (File, required): JPG or PNG image, max 10MB
- `bookingId` (string, required): UUID of the booking
- `capturedAt` (string, required): ISO 8601 timestamp
- `latitude` (number, optional): GPS latitude (-90 to 90)
- `longitude` (number, optional): GPS longitude (-180 to 180)
- `notes` (string, optional): Driver notes

**Response:**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "driverUserId": "uuid",
  "imageUrl": "https://...",
  "latitude": "30.2672",
  "longitude": "-97.7431",
  "capturedAt": "2024-01-15T10:30:00Z",
  "uploadedAt": "2024-01-15T10:31:00Z",
  "notes": "Completed run in downtown area",
  "status": "pending_review",
  "createdAt": "2024-01-15T10:31:00Z",
  "updatedAt": "2024-01-15T10:31:00Z"
}
```

**Side Effects:**
- Booking status transitions to `awaiting_review`

**Errors:**
- `400 Bad Request`: Invalid file type, file too large, booking not in running state
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: User is not the assigned driver
- `404 Not Found`: Booking not found

### GET /api/proofs/:id

Get a proof by ID.

**Request:**
- Method: `GET`
- Authentication: JWT required

**Response:**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "driverUserId": "uuid",
  "imageUrl": "https://...",
  "latitude": "30.2672",
  "longitude": "-97.7431",
  "capturedAt": "2024-01-15T10:30:00Z",
  "uploadedAt": "2024-01-15T10:31:00Z",
  "notes": "Completed run in downtown area",
  "status": "approved",
  "reviewedBy": "uuid",
  "reviewedAt": "2024-01-15T12:00:00Z",
  "createdAt": "2024-01-15T10:31:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Missing or invalid JWT
- `404 Not Found`: Proof not found

### GET /api/proofs/booking/:bookingId

List all proofs for a booking.

**Request:**
- Method: `GET`
- Authentication: JWT required

**Response:**
```json
[
  {
    "id": "uuid",
    "bookingId": "uuid",
    "driverUserId": "uuid",
    "imageUrl": "https://...",
    "status": "approved",
    ...
  },
  ...
]
```

**Errors:**
- `401 Unauthorized`: Missing or invalid JWT

### PATCH /api/proofs/:id/approve

Approve a proof (broker/operator only).

**Request:**
- Method: `PATCH`
- Authentication: JWT required (broker/operator role)

**Response:**
```json
{
  "id": "uuid",
  "status": "approved",
  "reviewedBy": "uuid",
  "reviewedAt": "2024-01-15T12:00:00Z",
  ...
}
```

**Side Effects:**
- Booking status transitions to `completed`
- `completedAt` timestamp is set

**Errors:**
- `400 Bad Request`: Proof is not in pending_review status
- `401 Unauthorized`: Missing or invalid JWT
- `404 Not Found`: Proof not found

### PATCH /api/proofs/:id/reject

Reject a proof (broker/operator only).

**Request:**
- Method: `PATCH`
- Authentication: JWT required (broker/operator role)
- Content-Type: `application/json`

**Body:**
```json
{
  "reason": "Image is blurry and GPS location doesn't match route"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "rejected",
  "reviewedBy": "uuid",
  "reviewedAt": "2024-01-15T12:00:00Z",
  "rejectionReason": "Image is blurry and GPS location doesn't match route",
  ...
}
```

**Side Effects:**
- Booking remains in `awaiting_review` status
- Driver can re-upload proof

**Errors:**
- `400 Bad Request`: Proof is not in pending_review status, missing reason
- `401 Unauthorized`: Missing or invalid JWT
- `404 Not Found`: Proof not found

### DELETE /api/proofs/:id

Delete a proof (driver only, before review).

**Request:**
- Method: `DELETE`
- Authentication: JWT required (driver role)

**Response:**
```json
{
  "id": "uuid",
  "deleted": true
}
```

**Side Effects:**
- Image is deleted from Supabase Storage
- Proof record is deleted from database

**Errors:**
- `400 Bad Request`: Proof is not in pending_review status
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: User is not the uploader
- `404 Not Found`: Proof not found

## Service Layer

### ProofsService

**Methods:**

#### uploadProof()
```typescript
async uploadProof(
  file: Express.Multer.File,
  bookingId: string,
  driverId: string,
  capturedAt: string,
  latitude?: number,
  longitude?: number,
  notes?: string,
): Promise<ProofUpload>
```

Validates file type and size, uploads to Supabase Storage, creates proof record, and transitions booking to `awaiting_review`.

#### getProofById()
```typescript
async getProofById(id: string): Promise<ProofUpload>
```

Retrieves a single proof by ID.

#### getProofsByBookingId()
```typescript
async getProofsByBookingId(bookingId: string): Promise<ProofUpload[]>
```

Retrieves all proofs for a booking, ordered by capture time descending.

#### approveProof()
```typescript
async approveProof(proofId: string, reviewerId: string): Promise<ProofUpload>
```

Approves a proof and transitions booking to `completed`.

#### rejectProof()
```typescript
async rejectProof(
  proofId: string,
  reviewerId: string,
  reason: string,
): Promise<ProofUpload>
```

Rejects a proof with a reason, keeps booking in `awaiting_review`.

#### deleteProof()
```typescript
async deleteProof(proofId: string, userId: string): Promise<ProofUpload>
```

Deletes a pending proof and its image from storage.

## Repository Layer

### ProofUploadRepository

**Methods:**

#### create()
```typescript
async create(data: CreateProofUploadData): Promise<ProofUpload>
```

Creates a new proof upload record in the database.

#### findById()
```typescript
async findById(id: string): Promise<ProofUpload | null>
```

Finds a proof by ID.

#### findByBookingId()
```typescript
async findByBookingId(bookingId: string): Promise<ProofUpload[]>
```

Finds all proofs for a booking.

#### findByDriverId()
```typescript
async findByDriverId(driverId: string): Promise<ProofUpload[]>
```

Finds all proofs uploaded by a driver.

#### updateStatus()
```typescript
async updateStatus(
  id: string,
  data: UpdateProofStatusData,
): Promise<ProofUpload>
```

Updates proof status (approve/reject).

#### delete()
```typescript
async delete(id: string): Promise<ProofUpload>
```

Deletes a proof record.

#### hasApprovedProof()
```typescript
async hasApprovedProof(bookingId: string): Promise<boolean>
```

Checks if a booking has any approved proofs.

## Validation Rules

### File Upload
- **File Type**: Only `image/jpeg`, `image/jpg`, `image/png`
- **File Size**: Maximum 10MB (10,485,760 bytes)
- **Required Fields**: `bookingId`, `capturedAt`, `image` file

### Booking State
- Proofs can only be uploaded for bookings in `running` status
- Only the assigned driver can upload proofs
- Booking auto-transitions to `awaiting_review` on first proof upload

### Proof Review
- Only `pending_review` proofs can be approved or rejected
- Approval transitions booking to `completed`
- Rejection keeps booking in `awaiting_review` for re-upload

### Proof Deletion
- Only `pending_review` proofs can be deleted
- Only the uploader can delete their own proofs
- Deletes image from Supabase Storage

## Error Handling

The module uses NestJS built-in exceptions:

- `BadRequestException`: Invalid input, file validation failures, state errors
- `NotFoundException`: Proof or booking not found
- `ForbiddenException`: Authorization failures

All errors are logged to the console for debugging.

## Testing

### Unit Tests
```bash
# Run tests for proofs module
npm test -- proofs
```

### Integration Tests
```bash
# Test full proof upload flow
curl -X POST http://localhost:8002/api/proofs \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "image=@proof.jpg" \
  -F "bookingId={BOOKING_ID}" \
  -F "capturedAt=2024-01-15T10:30:00Z" \
  -F "latitude=30.2672" \
  -F "longitude=-97.7431" \
  -F "notes=Completed run"
```

## Configuration

### Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

### Supabase Storage
- Bucket name: `proofs`
- Bucket type: Private (requires authentication)
- RLS policies: See `/docs/proof-of-performance-setup.md`

## Future Enhancements

1. **Image Compression**: Auto-compress images before upload to reduce storage costs
2. **Multiple Proofs**: Support multiple proof images per booking
3. **Video Support**: Add support for video proofs
4. **GPS Validation**: Verify GPS coordinates are within booking region
5. **Auto-Approval**: Auto-approve proofs based on GPS proximity and image quality
6. **Timestamp Overlay**: Add timestamp watermark to captured images
7. **Metadata Extraction**: Extract EXIF data from images for verification
