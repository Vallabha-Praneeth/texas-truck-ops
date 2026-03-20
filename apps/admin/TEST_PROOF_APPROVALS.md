# Test Plan: Proof Approvals Interface

## Overview
This document provides step-by-step instructions for testing the proof approval interface in the web admin dashboard.

## Prerequisites

### Backend Setup
1. NestJS API running on port 3001
   ```bash
   cd packages/api
   npm run dev
   ```

2. Database with test data:
   - At least one broker user
   - At least one booking in `awaiting_review` status
   - At least one proof upload for that booking

### Frontend Setup
1. Admin app running on port 8001
   ```bash
   cd apps/admin
   npm run dev
   ```

2. Environment variables set:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

## Test Scenarios

### Scenario 1: View Empty State

**Purpose:** Verify empty state displays when no proofs pending

**Steps:**
1. Login as broker
2. Click "Proof Approvals" button in header
3. Verify empty state message appears
4. Verify message: "No proofs pending approval. All bookings are up to date."

**Expected Result:**
✅ Empty state displays correctly
✅ No errors in console
✅ Navigation works

---

### Scenario 2: View Pending Proofs

**Purpose:** Verify proof list displays correctly

**Setup:**
- Create a booking with status `awaiting_review`
- Upload a proof with GPS coordinates and notes

**Steps:**
1. Navigate to `/broker/proofs`
2. Verify booking card appears
3. Check booking details:
   - Booking ID (first 8 chars)
   - Amount in USD
   - Status badge (yellow "Awaiting Review")
4. Check proof details:
   - Image thumbnail displays
   - Captured timestamp
   - GPS coordinates
   - Driver notes
   - Status badge "pending review"

**Expected Result:**
✅ Booking card displays
✅ All metadata shows correctly
✅ Image loads from Supabase URL
✅ GPS link to Google Maps works

---

### Scenario 3: View Full Image

**Purpose:** Test image modal and metadata overlay

**Steps:**
1. Navigate to proof approvals page
2. Click on proof image thumbnail
3. Verify modal opens
4. Check full-size image displays
5. Verify metadata panel shows:
   - GPS coordinates
   - Google Maps link
   - Driver notes
   - Timestamp
6. Click Google Maps link
7. Verify opens in new tab
8. Close modal

**Expected Result:**
✅ Modal opens with full image
✅ Image quality is good
✅ Metadata is readable
✅ Google Maps link works
✅ Modal closes properly

---

### Scenario 4: Approve Proof

**Purpose:** Test proof approval workflow

**Setup:**
- One booking with status `awaiting_review`
- One proof with status `pending_review`

**Steps:**
1. Navigate to proof approvals
2. Click green "Approve" button
3. Verify button shows "Approving..."
4. Wait for API response
5. Check booking removed from list
6. Verify in database:
   ```sql
   SELECT status, reviewed_by, reviewed_at
   FROM proof_uploads
   WHERE id = '<proof_id>';
   -- Should show: approved, <reviewer_id>, <timestamp>

   SELECT status, completed_at
   FROM bookings
   WHERE id = '<booking_id>';
   -- Should show: completed, <timestamp>
   ```

**Expected Result:**
✅ Loading state displays
✅ Success (booking removed)
✅ No errors shown
✅ Proof status = `approved`
✅ Booking status = `completed`
✅ Reviewer ID recorded
✅ Timestamps set

---

### Scenario 5: Reject Proof

**Purpose:** Test proof rejection workflow

**Setup:**
- One booking with status `awaiting_review`
- One proof with status `pending_review`

**Steps:**
1. Navigate to proof approvals
2. Click red "Reject" button
3. Verify rejection modal opens
4. Enter rejection reason: "Image is too blurry to verify billboard"
5. Click "Confirm Rejection"
6. Verify button shows "Rejecting..."
7. Wait for API response
8. Check modal closes
9. Verify proof still in list but status changed
10. Verify in database:
    ```sql
    SELECT status, rejection_reason, reviewed_by, reviewed_at
    FROM proof_uploads
    WHERE id = '<proof_id>';
    -- Should show: rejected, "Image is too blurry...", <reviewer_id>, <timestamp>

    SELECT status
    FROM bookings
    WHERE id = '<booking_id>';
    -- Should still show: awaiting_review
    ```

**Expected Result:**
✅ Modal opens
✅ Form validation works (can't submit empty)
✅ Loading state displays
✅ Success message
✅ Proof status = `rejected`
✅ Booking status still `awaiting_review`
✅ Rejection reason saved
✅ Driver can re-upload

---

### Scenario 6: Navigation Badge Count

**Purpose:** Test badge showing pending count

**Setup:**
- Create 3 bookings in `awaiting_review` status

**Steps:**
1. Login to broker dashboard
2. Check "Proof Approvals" button in header
3. Verify red badge appears with number "3"
4. Navigate to proof approvals
5. Approve one proof
6. Return to dashboard
7. Verify badge now shows "2"

**Expected Result:**
✅ Badge displays count
✅ Badge updates after approval
✅ Badge hidden when count = 0

---

### Scenario 7: Error Handling

**Purpose:** Test error states

**Test 7a: Network Error**
1. Stop backend API
2. Navigate to proof approvals
3. Verify error message displays
4. Check message is user-friendly

**Test 7b: Invalid Token**
1. Clear localStorage token
2. Navigate to proof approvals
3. Verify redirect to login page

**Test 7c: API Error (500)**
1. Modify backend to return 500 error
2. Try to approve proof
3. Verify error message displays

**Expected Result:**
✅ Error messages display
✅ No console errors
✅ Redirect on auth failure
✅ Graceful degradation

---

### Scenario 8: Responsive Design

**Purpose:** Test mobile and tablet layouts

**Steps:**
1. Open proof approvals in Chrome DevTools
2. Toggle device toolbar
3. Test at different viewports:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)
4. Check:
   - Grid layouts adjust
   - Buttons remain clickable
   - Text is readable
   - Images scale properly
   - Modals work on mobile

**Expected Result:**
✅ Layouts responsive
✅ No horizontal scroll
✅ Touch targets adequate (44px min)
✅ Modals work on all sizes

---

### Scenario 9: Multiple Proofs per Booking

**Purpose:** Test booking with multiple proof uploads

**Setup:**
- One booking
- Driver uploads proof → rejected
- Driver uploads second proof

**Steps:**
1. Navigate to proof approvals
2. Verify booking shows both proofs
3. Check older proof shows "rejected" badge
4. Check newer proof shows "pending_review" badge
5. Approve newer proof
6. Verify booking moves to completed

**Expected Result:**
✅ Multiple proofs display
✅ Status badges correct
✅ Can approve any pending proof
✅ Booking completes on first approval

---

### Scenario 10: GPS Coordinates Missing

**Purpose:** Test proof without GPS data

**Setup:**
- Upload proof without latitude/longitude

**Steps:**
1. Navigate to proof approvals
2. Check proof item
3. Verify GPS section doesn't display
4. Check no broken links or errors
5. Can still approve/reject

**Expected Result:**
✅ No GPS section shown
✅ No errors
✅ Approve/reject still works
✅ Other metadata displays

---

## Performance Tests

### Load Test: Many Pending Proofs

**Setup:**
- Create 50 bookings in `awaiting_review`

**Steps:**
1. Navigate to proof approvals
2. Measure page load time
3. Check scrolling performance
4. Verify images load progressively

**Expected Result:**
✅ Page loads in < 3 seconds
✅ Smooth scrolling
✅ Images lazy-load
✅ No memory leaks

---

## Accessibility Tests

### Keyboard Navigation

**Steps:**
1. Navigate to proof approvals
2. Press Tab to navigate
3. Check:
   - All buttons reachable
   - Focus indicators visible
   - Can approve/reject with keyboard
   - Modal can be closed with Esc

**Expected Result:**
✅ Full keyboard access
✅ Logical tab order
✅ Focus visible
✅ Esc closes modals

---

### Screen Reader

**Steps:**
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate proof approvals
3. Verify:
   - Page title announced
   - Button labels clear
   - Image alt text present
   - Status communicated

**Expected Result:**
✅ All content accessible
✅ Semantic HTML used
✅ ARIA labels where needed

---

## Integration Tests

### End-to-End Flow

**Complete workflow from driver upload to broker approval:**

1. **Driver uploads proof (mobile app)**
   - Take photo
   - Add GPS and notes
   - Submit proof
   - Booking → `awaiting_review`

2. **Broker reviews (web admin)**
   - See notification badge
   - Navigate to proof approvals
   - Review image and metadata
   - Approve proof

3. **System processes (backend)**
   - Booking → `completed`
   - Payout triggered
   - Notifications sent

4. **Verify (all apps)**
   - Mobile app shows "Completed"
   - Web admin shows empty state
   - Database updated correctly
   - Payout recorded

**Expected Result:**
✅ Full flow works end-to-end
✅ All status transitions correct
✅ Data consistent across systems

---

## Common Issues

### Issue: Images not loading

**Symptoms:**
- Broken image icon
- Console error: Failed to load resource

**Debug Steps:**
1. Check Supabase Storage URL
2. Verify bucket is public
3. Check CORS settings
4. Inspect network request

**Fix:**
```bash
# Make bucket public in Supabase dashboard
# Update bucket policies
```

---

### Issue: Approve/Reject not working

**Symptoms:**
- Button click does nothing
- Error message appears

**Debug Steps:**
1. Check console for errors
2. Verify JWT token in localStorage
3. Check API endpoint URL
4. Inspect network request/response

**Fix:**
```typescript
// Re-login to get fresh token
localStorage.clear();
// Navigate to login page
```

---

### Issue: Badge count wrong

**Symptoms:**
- Badge shows incorrect number
- Badge doesn't update

**Debug Steps:**
1. Check bookings API response
2. Verify filter logic
3. Check localStorage token

**Fix:**
- Refresh page
- Clear cache
- Check backend data

---

## Test Data Setup

### SQL Script to Create Test Data

```sql
-- Create test broker user
INSERT INTO users (id, email, primary_role, display_name)
VALUES
  ('broker-test-id', 'broker@test.com', 'broker', 'Test Broker');

-- Create test driver user
INSERT INTO users (id, email, primary_role, display_name)
VALUES
  ('driver-test-id', 'driver@test.com', 'driver', 'Test Driver');

-- Create test booking
INSERT INTO bookings (id, broker_id, amount_cents, status, driver_user_id)
VALUES
  ('booking-test-id', 'broker-test-id', 10000, 'awaiting_review', 'driver-test-id');

-- Create test proof
INSERT INTO proof_uploads (
  id,
  booking_id,
  driver_user_id,
  image_url,
  latitude,
  longitude,
  captured_at,
  notes,
  status
)
VALUES (
  'proof-test-id',
  'booking-test-id',
  'driver-test-id',
  'https://<supabase-url>/storage/v1/object/public/proofs/test.jpg',
  '32.7767',
  '-96.7970',
  NOW(),
  'Photo taken at downtown location',
  'pending_review'
);
```

---

## Regression Tests

After each update, verify:

- [ ] Login still works
- [ ] Dashboard loads
- [ ] Navigation to proof approvals works
- [ ] Approve proof works
- [ ] Reject proof works
- [ ] Images display
- [ ] Badge count correct
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Back button works

---

## Sign-Off

**Tester:** ___________________
**Date:** ___________________
**Result:** PASS / FAIL
**Notes:** ___________________

---

## Next Steps

After testing:
1. Document any bugs found
2. Create tickets for fixes
3. Retest after fixes
4. Deploy to staging
5. User acceptance testing
6. Deploy to production
