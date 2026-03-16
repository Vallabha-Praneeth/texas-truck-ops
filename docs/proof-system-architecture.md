# Proof-of-Performance System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LED Billboard Marketplace                     │
│                  Proof-of-Performance Upload System              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Driver     │         │    Broker    │         │   Operator   │
│  Mobile App  │         │  Mobile/Web  │         │  Mobile/Web  │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ Upload Proof           │ Approve/Reject         │ View Proofs
       │ (Photo + GPS)          │ Proofs                 │
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS Backend API                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      ProofsModule                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │  Controller  │─▶│   Service    │─▶│   Repository    │ │ │
│  │  │  (REST API)  │  │ (Logic)      │  │ (Database)      │ │ │
│  │  └──────────────┘  └──────┬───────┘  └─────────────────┘ │ │
│  │                            │                               │ │
│  │                            ▼                               │ │
│  │                    ┌──────────────┐                        │ │
│  │                    │ Supabase     │                        │ │
│  │                    │ Service      │                        │ │
│  │                    └──────┬───────┘                        │ │
│  └───────────────────────────┼────────────────────────────────┘ │
└────────────────────────────┬─┼────────────────────────────────┘
                             │ │
                             │ └─────────────┐
                             │               │
                             ▼               ▼
                  ┌──────────────┐  ┌──────────────┐
                  │  PostgreSQL  │  │   Supabase   │
                  │   Database   │  │   Storage    │
                  │              │  │   (Images)   │
                  │ proof_uploads│  │    Bucket:   │
                  │    table     │  │    proofs    │
                  └──────────────┘  └──────────────┘
```

## Data Flow

### 1. Proof Upload Flow

```
Driver Mobile App
       │
       │ 1. Capture photo with camera
       │    (expo-camera)
       │
       │ 2. Get GPS coordinates
       │    (expo-location)
       │
       │ 3. Create FormData with:
       │    - image file
       │    - bookingId
       │    - capturedAt (timestamp)
       │    - latitude
       │    - longitude
       │    - notes (optional)
       │
       ▼
POST /api/proofs
       │
       ▼
ProofsController.uploadProof()
       │
       ├─▶ Validate file type (JPG/PNG)
       ├─▶ Validate file size (<10MB)
       ├─▶ Verify booking exists
       ├─▶ Verify booking status = 'running'
       ├─▶ Verify user = assigned driver
       │
       ▼
ProofsService.uploadProof()
       │
       ├─▶ Upload to Supabase Storage
       │   (SupabaseService.uploadProofImage)
       │   Returns: public URL
       │
       ├─▶ Create proof record in DB
       │   (ProofUploadRepository.create)
       │   Status: 'pending_review'
       │
       └─▶ Transition booking status
           (BookingService.transitionBookingStatus)
           'running' → 'awaiting_review'
       │
       ▼
Return proof record to client
```

### 2. Proof Approval Flow

```
Broker/Operator App
       │
       │ View proof image
       │ Review GPS location
       │ Review timestamp
       │
       ▼
PATCH /api/proofs/:id/approve
       │
       ▼
ProofsController.approveProof()
       │
       ▼
ProofsService.approveProof()
       │
       ├─▶ Verify proof exists
       ├─▶ Verify status = 'pending_review'
       │
       ├─▶ Update proof record
       │   (ProofUploadRepository.updateStatus)
       │   - status: 'approved'
       │   - reviewedBy: reviewerId
       │   - reviewedAt: now()
       │
       └─▶ Transition booking status
           (BookingService.transitionBookingStatus)
           'awaiting_review' → 'completed'
           Set completedAt timestamp
       │
       ▼
Return updated proof record
```

### 3. Proof Rejection Flow

```
Broker/Operator App
       │
       │ View proof image
       │ Determine issue
       │ Enter rejection reason
       │
       ▼
PATCH /api/proofs/:id/reject
       │
       ▼
ProofsController.rejectProof()
       │
       ▼
ProofsService.rejectProof()
       │
       ├─▶ Verify proof exists
       ├─▶ Verify status = 'pending_review'
       │
       └─▶ Update proof record
           (ProofUploadRepository.updateStatus)
           - status: 'rejected'
           - reviewedBy: reviewerId
           - reviewedAt: now()
           - rejectionReason: reason
       │
       │ NOTE: Booking stays in 'awaiting_review'
       │       Driver can re-upload proof
       │
       ▼
Return updated proof record
```

## State Transitions

### Booking Status State Machine

```
pending_deposit
       │
       ▼
   confirmed
       │
       ▼
    running ◄────────────────┐
       │                     │
       │ (proof uploaded)    │
       ▼                     │
awaiting_review              │
       │                     │
       ├─────────────────────┘
       │ (proof rejected)
       │
       │ (proof approved)
       ▼
   completed
```

### Proof Status States

```
pending_review ──┬──▶ approved
                 │
                 └──▶ rejected
```

## Database Schema

### proof_uploads Table

```sql
CREATE TABLE proof_uploads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  latitude          NUMERIC(10, 7),
  longitude         NUMERIC(10, 7),
  captured_at       TIMESTAMPTZ NOT NULL,
  uploaded_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes             TEXT,
  status            proof_status DEFAULT 'pending_review' NOT NULL,
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX proof_uploads_booking_idx ON proof_uploads(booking_id);
CREATE INDEX proof_uploads_driver_idx ON proof_uploads(driver_user_id);
CREATE INDEX proof_uploads_status_idx ON proof_uploads(status);
CREATE INDEX proof_uploads_captured_at_idx ON proof_uploads(captured_at DESC);
```

### proof_status Enum

```sql
CREATE TYPE proof_status AS ENUM (
  'pending_review',
  'approved',
  'rejected'
);
```

## Security Model

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────┐
│                     All Endpoints                        │
│                   Require JWT Token                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────┬──────────────────┬─────────────────────┐
│   Driver Role   │  Broker Role     │  Operator Role      │
├─────────────────┼──────────────────┼─────────────────────┤
│ Upload proof    │ View proofs      │ View proofs         │
│ (own bookings)  │ Approve proofs   │ Approve proofs      │
│                 │ Reject proofs    │ Reject proofs       │
│ View proofs     │                  │                     │
│ (own bookings)  │                  │                     │
│                 │                  │                     │
│ Delete proof    │                  │                     │
│ (pending only)  │                  │                     │
└─────────────────┴──────────────────┴─────────────────────┘
```

### Supabase Storage RLS Policies

```
Storage Bucket: proofs (Private)
       │
       ├─▶ INSERT Policy
       │   - Driver can upload to their own bookings
       │   - booking_id folder must match driver's booking
       │
       ├─▶ SELECT Policy
       │   - Driver can view their own uploads
       │   - Broker can view proofs for their bookings
       │   - Operator can view proofs for their org's bookings
       │
       └─▶ DELETE Policy
           - Driver can delete their pending proofs
           - Must be in 'pending_review' status
```

## File Organization

### Supabase Storage Structure

```
proofs/                         (bucket)
  └── {booking-id}/             (folder)
      ├── {timestamp}-{driver-id}.jpg
      ├── {timestamp}-{driver-id}.jpg
      └── {timestamp}-{driver-id}.png
```

Example:
```
proofs/
  └── a1b2c3d4-e5f6-7890-abcd-ef1234567890/
      ├── 1705320600000-d1e2f3g4-h5i6-7890-jklm-no1234567890.jpg
      ├── 1705320720000-d1e2f3g4-h5i6-7890-jklm-no1234567890.jpg
      └── 1705320840000-d1e2f3g4-h5i6-7890-jklm-no1234567890.png
```

## Mobile App Permissions

### iOS (Info.plist)

```xml
NSCameraUsageDescription
NSLocationWhenInUseUsageDescription
NSPhotoLibraryUsageDescription
```

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Error Handling

### Client-Side Errors

```
┌─────────────────────────────────────────────────────┐
│  File Validation                                    │
│  ├─ Invalid type → "Only JPG and PNG allowed"      │
│  └─ Too large → "File must be < 10MB"              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Permission Errors                                  │
│  ├─ Camera → Request permission                     │
│  └─ Location → Request permission                   │
└─────────────────────────────────────────────────────┘
```

### Server-Side Errors

```
┌─────────────────────────────────────────────────────┐
│  HTTP 400 Bad Request                               │
│  ├─ Invalid file type                               │
│  ├─ File too large                                  │
│  ├─ Booking not in 'running' status                 │
│  └─ Proof not in 'pending_review' status            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  HTTP 401 Unauthorized                              │
│  └─ Missing or invalid JWT token                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  HTTP 403 Forbidden                                 │
│  ├─ User is not assigned driver                     │
│  └─ User is not uploader (for delete)               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  HTTP 404 Not Found                                 │
│  ├─ Booking not found                               │
│  └─ Proof not found                                 │
└─────────────────────────────────────────────────────┘
```

## Performance Considerations

### Database Optimization

- **Indexes**: Created on frequently queried columns
  - `booking_id` for finding proofs by booking
  - `driver_user_id` for finding proofs by driver
  - `status` for filtering by review status
  - `captured_at DESC` for ordering by time

### Storage Optimization

- **File Validation**: Prevents oversized uploads (max 10MB)
- **Folder Organization**: Files grouped by booking_id for easy cleanup
- **Public URLs**: Cached for fast access

### API Optimization

- **Eager Loading**: Proofs include all necessary data in single query
- **Pagination**: Can be added for large proof lists (future enhancement)
- **Caching**: Can cache approved proofs (future enhancement)

## Monitoring & Analytics

### Key Metrics

```
┌─────────────────────────────────────────────────────┐
│  Upload Metrics                                     │
│  ├─ Total uploads per day                           │
│  ├─ Failed uploads per day                          │
│  ├─ Average file size                               │
│  └─ Upload success rate                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Review Metrics                                     │
│  ├─ Approval rate (%)                               │
│  ├─ Rejection rate (%)                              │
│  ├─ Average review time                             │
│  └─ Pending reviews count                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Storage Metrics                                    │
│  ├─ Total storage used                              │
│  ├─ Storage cost per month                          │
│  └─ Average storage per proof                       │
└─────────────────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests

- Service methods (upload, approve, reject, delete)
- Repository methods (CRUD operations)
- DTO validation

### Integration Tests

- Full upload flow with Supabase Storage
- Approval flow with booking status transitions
- Rejection flow
- Authorization checks

### E2E Tests

- Driver uploads proof from mobile app
- Broker approves proof from web app
- Verify booking completion
- Test permission denials

## Future Enhancements

1. **Image Processing**
   - Auto-compress images before upload
   - Generate thumbnails for faster loading
   - Add timestamp watermark to images

2. **Advanced Validation**
   - GPS proximity validation (verify location within booking region)
   - Image quality analysis
   - Duplicate detection

3. **Multiple Proofs**
   - Support multiple images per booking
   - Image gallery view
   - Slideshow mode

4. **Video Support**
   - Upload video proofs
   - Video thumbnail generation
   - Video playback in app

5. **Notifications**
   - Notify broker when proof is uploaded
   - Notify driver when proof is reviewed
   - Push notifications

6. **Analytics Dashboard**
   - Proof upload trends
   - Approval rate by driver
   - Average review time by broker
   - Geographic proof heat map
