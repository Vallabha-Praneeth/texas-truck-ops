# Proof-of-Performance System - Quick Start Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database running
- Supabase project created
- Mobile development environment set up (Expo)

## Step 1: Database Setup (5 minutes)

### Run Migration

```bash
cd packages/db
pnpm drizzle-kit push:pg
```

This creates the `proof_uploads` table and `proof_status` enum.

## Step 2: Supabase Storage Setup (10 minutes)

### Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **Create new bucket**
4. Enter bucket name: `proofs`
5. Set to **Private**
6. Click **Create bucket**

### Configure RLS Policies

In Supabase SQL Editor, run:

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
    auth.uid() IN (
      SELECT driver_user_id::text
      FROM bookings
      WHERE id::text = (storage.foldername(name))[1]
    )
    OR auth.uid() IN (
      SELECT broker_user_id::text
      FROM bookings
      WHERE id::text = (storage.foldername(name))[1]
    )
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

## Step 3: Mobile App Permissions (5 minutes)

### iOS

Edit `apps/mobile/ios/LEDBillboardMarketplace/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to capture proof of completed runs</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to verify proof of completed runs</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to upload proof images</string>
```

### Android

Edit `apps/mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Step 4: Start Backend API (2 minutes)

```bash
# From project root
pnpm dev:api
```

API will be available at `http://localhost:8002`

## Step 5: Test the System (10 minutes)

### 5.1: Create Test Data

Use your existing test scripts or API to:
1. Create a booking with status `running`
2. Assign a driver to the booking

### 5.2: Test Proof Upload (Mobile)

```bash
# Start mobile app
pnpm --filter @led-billboard/mobile start
```

Then:
1. Login as the driver user
2. Navigate to "Driver" → "Proof Capture"
3. Select the running booking
4. Tap "Take Picture" or "Pick from Gallery"
5. Capture/select an image
6. Tap "Upload Proof"
7. Verify success message
8. Verify booking status changed to `awaiting_review`

### 5.3: Test Proof Approval (API)

```bash
# Get proof ID from upload response or database
# Login as broker to get JWT token

# Approve proof
curl -X PATCH http://localhost:8002/api/proofs/{PROOF_ID}/approve \
  -H "Authorization: Bearer {BROKER_JWT_TOKEN}"

# Verify booking status changed to 'completed'
curl http://localhost:8002/api/bookings/{BOOKING_ID} \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 5.4: Test Proof Rejection (API)

```bash
# Create another running booking and upload proof

# Reject proof
curl -X PATCH http://localhost:8002/api/proofs/{PROOF_ID}/reject \
  -H "Authorization: Bearer {BROKER_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Image is blurry"}'

# Verify booking stays in 'awaiting_review'
curl http://localhost:8002/api/bookings/{BOOKING_ID} \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

## Step 6: Verify Everything Works

### Check Database

```sql
-- View proof uploads
SELECT id, booking_id, status, captured_at, uploaded_at
FROM proof_uploads
ORDER BY uploaded_at DESC;

-- View booking status
SELECT id, status, started_at, completed_at
FROM bookings
WHERE status IN ('running', 'awaiting_review', 'completed');
```

### Check Supabase Storage

1. Go to Supabase Dashboard → Storage → `proofs`
2. Verify uploaded images are visible
3. Click on an image to view it
4. Verify folder structure: `{booking-id}/{timestamp}-{driver-id}.jpg`

### Check API Logs

```bash
# Watch API logs for errors
tail -f packages/api/logs/*.log
```

## Common Issues & Solutions

### Issue: "File upload failed"

**Solution:**
- Verify Supabase Storage bucket exists and is named `proofs`
- Check RLS policies are configured correctly
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`

### Issue: "Permission denied"

**Solution:**
- Check mobile app permissions are granted (camera, location)
- Verify JWT token is valid
- Ensure user is the assigned driver for the booking

### Issue: "Booking not in running status"

**Solution:**
- Verify booking status in database
- Transition booking to `running` before uploading proof
- Check booking state machine transitions

### Issue: "Cannot approve proof"

**Solution:**
- Verify proof status is `pending_review`
- Check user has broker/operator role
- Ensure JWT token is valid

## Next Steps

Now that the proof system is working:

1. **Update Broker/Operator Screens**
   - Add proof viewing in booking details
   - Add approve/reject buttons
   - Implement image lightbox viewer

2. **Add Notifications**
   - Notify broker when proof is uploaded
   - Notify driver when proof is reviewed
   - Use existing RealtimeModule for real-time updates

3. **Enhance Mobile UI**
   - Add proof upload history
   - Show proof status in driver runs list
   - Add "Capture Proof" button in active run card

4. **Add Analytics**
   - Track proof upload rate
   - Monitor approval/rejection rates
   - Measure average review time

## Testing Checklist

- [ ] Database migration completed
- [ ] Supabase Storage bucket created
- [ ] RLS policies configured
- [ ] Mobile permissions added (iOS)
- [ ] Mobile permissions added (Android)
- [ ] Backend API running
- [ ] Proof upload works (mobile)
- [ ] Booking status transitions to `awaiting_review`
- [ ] Proof approval works (API)
- [ ] Booking status transitions to `completed`
- [ ] Proof rejection works (API)
- [ ] Booking stays in `awaiting_review`
- [ ] Proof deletion works (pending only)
- [ ] Images visible in Supabase Storage
- [ ] File validation works (type, size)
- [ ] Authorization works (driver, broker roles)

## Resources

- **Full Documentation:** `/docs/proof-of-performance-setup.md`
- **Architecture Diagram:** `/docs/proof-system-architecture.md`
- **Implementation Summary:** `/PROOF_SYSTEM_IMPLEMENTATION.md`
- **API Documentation:** `/packages/api/src/proofs/README.md`

## Support

If you encounter any issues:

1. Check the error message in API logs
2. Verify database migration succeeded
3. Confirm Supabase Storage configuration
4. Review RLS policies in Supabase
5. Check mobile app permissions are granted
6. Verify JWT tokens are valid

For additional help, review the detailed documentation files listed above.

---

**Congratulations!** Your Proof-of-Performance Upload System is now ready to use. Drivers can upload proof photos, and brokers can approve them to complete bookings.
