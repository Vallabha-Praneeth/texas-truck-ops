# Proof-of-Performance Upload System - Setup Guide

## Overview

The Proof-of-Performance Upload System enables drivers to upload timestamped photos with GPS location as proof that they completed billboard advertising runs. Brokers can then approve or reject these proofs to complete the booking lifecycle.

## Architecture

### Database Schema (Migration 0005)

**Table: `proof_uploads`**
- `id` (UUID) - Primary key
- `booking_id` (UUID) - Foreign key to bookings table
- `driver_user_id` (UUID) - Foreign key to users table
- `image_url` (TEXT) - Supabase Storage public URL
- `latitude` (NUMERIC) - GPS latitude coordinate
- `longitude` (NUMERIC) - GPS longitude coordinate
- `captured_at` (TIMESTAMPTZ) - When the photo was taken
- `uploaded_at` (TIMESTAMPTZ) - When the proof was uploaded
- `notes` (TEXT) - Optional notes from driver
- `status` (proof_status ENUM) - `pending_review`, `approved`, `rejected`
- `reviewed_by` (UUID) - Foreign key to users table (reviewer)
- `reviewed_at` (TIMESTAMPTZ) - When proof was reviewed
- `rejection_reason` (TEXT) - Reason if rejected
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record update timestamp

**Indexes:**
- `proof_uploads_booking_idx` on `booking_id`
- `proof_uploads_driver_idx` on `driver_user_id`
- `proof_uploads_status_idx` on `status`
- `proof_uploads_captured_at_idx` on `captured_at DESC`

### Backend API Endpoints

**POST /api/proofs**
- Upload proof image with metadata
- Required: multipart/form-data with `image` file
- Body: `bookingId`, `capturedAt`, `latitude`, `longitude`, `notes` (optional)
- Returns: Created proof record
- Authentication: JWT required (driver role)

**GET /api/proofs/:id**
- Get proof by ID
- Returns: Proof record with all details
- Authentication: JWT required

**GET /api/proofs/booking/:bookingId**
- List all proofs for a booking
- Returns: Array of proof records
- Authentication: JWT required

**PATCH /api/proofs/:id/approve**
- Approve a proof (broker/operator only)
- Transitions booking to `completed` status
- Authentication: JWT required (broker/operator role)

**PATCH /api/proofs/:id/reject**
- Reject a proof (broker/operator only)
- Body: `reason` (string, required)
- Keeps booking in `awaiting_review` for driver to re-upload
- Authentication: JWT required (broker/operator role)

**DELETE /api/proofs/:id**
- Delete a proof (driver only, before review)
- Only allowed for `pending_review` proofs
- Deletes image from Supabase Storage
- Authentication: JWT required (driver role)

### Booking Lifecycle Integration

The proof upload system integrates with the booking state machine:

1. **running → awaiting_review**: Auto-triggered when driver uploads first proof
2. **awaiting_review → completed**: Triggered when broker approves proof
3. **awaiting_review → awaiting_review**: Broker rejects proof, driver can re-upload

## Supabase Storage Setup

### 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** → **Create new bucket**
2. Bucket name: `proofs`
3. Set to **Private** (requires authentication)
4. Click **Create bucket**

### 2. Configure Row Level Security (RLS) Policies

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Policy: Drivers can upload to their own bookings
CREATE POLICY "Drivers can upload proofs for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proofs'
  AND auth.uid() IN (
    SELECT driver_user_id::text
    FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Users can view proofs for their bookings
CREATE POLICY "Users can view proofs for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proofs'
  AND (
    -- Drivers can see their own uploads
    auth.uid() IN (
      SELECT driver_user_id::text
      FROM bookings
      WHERE id::text = (storage.foldername(name))[1]
    )
    -- Brokers can see proofs for their bookings
    OR auth.uid() IN (
      SELECT broker_user_id::text
      FROM bookings
      WHERE id::text = (storage.foldername(name))[1]
    )
    -- Operators can see proofs for their bookings
    OR auth.uid() IN (
      SELECT u.id::text
      FROM bookings b
      JOIN org_members om ON b.operator_org_id = om.org_id
      JOIN users u ON om.user_id = u.id
      WHERE b.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Policy: Drivers can delete their pending proofs
CREATE POLICY "Drivers can delete pending proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'proofs'
  AND auth.uid() IN (
    SELECT pu.driver_user_id::text
    FROM proof_uploads pu
    WHERE pu.image_url LIKE '%' || name
      AND pu.status = 'pending_review'
  )
);
```

### 3. Set Bucket Settings

1. Max file size: 10MB (default is sufficient)
2. Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`

## Mobile App Configuration

### Required Permissions (iOS)

Add to `apps/mobile/ios/LEDBillboardMarketplace/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to capture proof of completed runs</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to verify proof of completed runs</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to upload proof images</string>
```

### Required Permissions (Android)

Add to `apps/mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Testing Guide

### 1. Run Database Migration

```bash
# From project root
cd packages/db
pnpm drizzle-kit push:pg
```

### 2. Start Backend API

```bash
pnpm dev:api
```

### 3. Create Supabase Storage Bucket

Follow the "Supabase Storage Setup" section above.

### 4. Test Upload Flow (Mobile)

1. Start mobile app: `pnpm --filter @led-billboard/mobile start`
2. Login as a driver user
3. Navigate to "Proof Capture" screen
4. Select a running booking
5. Tap "Take Picture" or "Pick from Gallery"
6. Capture/select an image
7. Add optional notes
8. Tap "Upload Proof"
9. Verify booking status changes to `awaiting_review`

### 5. Test Approval Flow (Web/API)

```bash
# Using curl to approve proof
curl -X PATCH http://localhost:8002/api/proofs/{PROOF_ID}/approve \
  -H "Authorization: Bearer {BROKER_JWT_TOKEN}"

# Verify booking status changed to `completed`
curl http://localhost:8002/api/bookings/{BOOKING_ID} \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

## Security Considerations

1. **File Type Validation**: Only JPG and PNG images are allowed
2. **File Size Validation**: Maximum 10MB per upload
3. **Authentication**: All endpoints require valid JWT
4. **Authorization**:
   - Only assigned driver can upload proof for their booking
   - Only broker/operator can approve/reject proofs
   - Only uploader can delete pending proofs
5. **Storage Security**: RLS policies prevent unauthorized access to images

## Error Handling

### Common Errors

**"Only JPG and PNG images are allowed"**
- User tried to upload unsupported file type
- Solution: Only select .jpg or .png images

**"File size must be less than 10MB"**
- Image file is too large
- Solution: Compress image or take lower quality photo

**"Cannot upload proof for booking with status: {status}"**
- Booking is not in `running` state
- Solution: Ensure booking has been started by driver

**"Only the assigned driver can upload proof for this booking"**
- User is not the assigned driver
- Solution: Ensure correct driver is logged in

**"Cannot approve proof with status: {status}"**
- Proof is not in `pending_review` state
- Solution: Check proof status before approving

## Monitoring

### Key Metrics to Track

1. **Proof Upload Rate**: Number of proofs uploaded per day
2. **Approval Rate**: Percentage of proofs approved vs rejected
3. **Average Review Time**: Time between upload and approval/rejection
4. **Failed Uploads**: Track upload failures for debugging
5. **Storage Usage**: Monitor Supabase Storage usage

### Logging

The system logs:
- Proof upload attempts and results
- Approval/rejection actions with reviewer ID
- Storage errors (image upload/delete failures)
- Authentication/authorization failures

## Future Enhancements

1. **Image Compression**: Auto-compress images before upload
2. **Timestamp Overlay**: Add timestamp watermark to captured images
3. **Multiple Proofs**: Allow multiple proof images per booking
4. **Video Support**: Support video proofs in addition to photos
5. **GPS Validation**: Verify GPS coordinates are within booking region
6. **Notification System**: Notify broker when proof is uploaded
7. **Auto-Approval**: Auto-approve proofs based on GPS proximity
