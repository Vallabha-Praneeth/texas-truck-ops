#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const config = {
  projectId: process.env.GCLOUD_PROJECT || 'b2b-texas',
  region: process.env.GCLOUD_REGION || 'us-central1',
  apiService: process.env.API_SERVICE || 'b2b-api-staging',
  apiBaseUrl:
    process.env.API_BASE_URL ||
    'https://b2b-api-staging-524892342854.us-central1.run.app/api',
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || '',
  operatorPhone: process.env.OPERATOR_PHONE || '+15551234567',
  brokerPhone: process.env.BROKER_PHONE || '+15552012867',
  driverPhone: process.env.DRIVER_PHONE || '+15552012868',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const redact = (value) =>
  value ? `${value.slice(0, 4)}...${value.slice(-4)}` : '(missing)';

function toIso(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function runGcloud(args) {
  try {
    return execFileSync('gcloud', args, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = error?.stderr?.toString?.() || String(error);
    throw new Error(`gcloud ${args.join(' ')} failed: ${stderr}`);
  }
}

function parseJsonSafe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function apiRequest(method, path, options = {}) {
  const url = path.startsWith('http')
    ? path
    : `${config.apiBaseUrl}${path}`;
  const headers = {
    accept: 'application/json',
    ...(options.body ? { 'content-type': 'application/json' } : {}),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const json = parseJsonSafe(text);
  const expected = options.expect || [200];

  if (!expected.includes(response.status)) {
    throw new Error(
      `${method} ${path} -> ${response.status}\n${text || '(empty response body)'}`
    );
  }

  return {
    status: response.status,
    text,
    json,
  };
}

function extractLatestOtp(logText, phone) {
  const escapedPhone = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`OTP for ${escapedPhone}: ([0-9]{6})`, 'g');
  let match = null;
  let latest = null;
  while ((match = pattern.exec(logText)) !== null) {
    latest = match[1];
  }
  return latest;
}

async function fetchOtpFromLogs(phone, sinceIso) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const filter = [
      'resource.type="cloud_run_revision"',
      `resource.labels.service_name="${config.apiService}"`,
      `textPayload:"OTP for ${phone}"`,
      `timestamp>="${sinceIso}"`,
    ].join(' AND ');

    const logs = runGcloud([
      'logging',
      'read',
      filter,
      '--project',
      config.projectId,
      '--limit',
      '20',
      '--format',
      'value(timestamp,textPayload)',
    ]);

    const otp = extractLatestOtp(logs, phone);
    if (otp) {
      return otp;
    }

    await sleep(1000);
  }

  throw new Error(`Could not find OTP in Cloud Run logs for ${phone}`);
}

async function authWithOtp(phone, label) {
  const loginIssuedAt = new Date(Date.now() - 5000).toISOString();
  await apiRequest('POST', '/auth/login', {
    body: { phone },
    expect: [200],
  });
  await sleep(1200);
  const otp = await fetchOtpFromLogs(phone, loginIssuedAt);
  const verify = await apiRequest('POST', '/auth/verify-otp', {
    body: { phone, code: otp },
    expect: [200],
  });
  const token = verify.json?.token;
  const user = verify.json?.user;
  if (!token || !user?.id || !user?.primaryRole) {
    throw new Error(`Invalid verify response for ${label}: ${verify.text}`);
  }
  console.log(
    `${label}_AUTH role=${user.primaryRole} id=${user.id} token=${redact(token)}`
  );
  return { token, user };
}

async function promoteRole(adminToken, phone, primaryRole) {
  const result = await apiRequest('PATCH', '/users/internal/role', {
    token: adminToken,
    headers: { 'x-internal-key': config.internalServiceKey },
    body: { phone, primaryRole },
    expect: [200],
  });
  const updatedRole = result.json?.primaryRole;
  console.log(
    `PROMOTE phone=${phone} target=${primaryRole} result=${updatedRole || 'unknown'}`
  );
}

async function findOwnedSlot(operatorToken) {
  const slotsResult = await apiRequest(
    'GET',
    '/slots/search?limit=100&offset=0',
    {
      token: operatorToken,
      expect: [200],
    }
  );
  const slots = Array.isArray(slotsResult.json) ? slotsResult.json : [];

  for (const slot of slots) {
    const probe = await apiRequest('GET', `/slots/${slot.id}`, {
      token: operatorToken,
      expect: [200, 403, 404],
    });
    if (probe.status === 200) {
      return slot.id;
    }
  }

  return null;
}

async function createOwnedSlot(operatorToken) {
  const trucksResult = await apiRequest('GET', '/trucks', {
    token: operatorToken,
    expect: [200],
  });
  const trucks = Array.isArray(trucksResult.json) ? trucksResult.json : [];
  if (trucks.length === 0) {
    return null;
  }

  for (let i = 0; i < trucks.length; i += 1) {
    const truck = trucks[i];
    const startAt = toIso(24 + i * 6);
    const endAt = toIso(28 + i * 6);
    const create = await apiRequest('POST', '/slots', {
      token: operatorToken,
      body: {
        truckId: truck.id,
        startAt,
        endAt,
        region: 'DFW',
        radiusMiles: 25,
        repositionAllowed: false,
        maxRepositionMiles: 0,
        notes: `staging-driver-checkpoint-${Date.now()}`,
      },
      expect: [201, 400, 403, 404],
    });

    if (create.status === 201 && create.json?.id) {
      return create.json.id;
    }
  }

  return null;
}

async function pickAnyOpenSlot(token) {
  const slotsResult = await apiRequest(
    'GET',
    '/slots/search?limit=100&offset=0',
    {
      token,
      expect: [200],
    }
  );
  const slots = Array.isArray(slotsResult.json) ? slotsResult.json : [];
  return slots.length > 0 ? slots[0].id : null;
}

function pickNewBooking(beforeList, afterList, slotId) {
  const beforeIds = new Set(beforeList.map((booking) => booking.id));
  const byId = afterList.find((booking) => !beforeIds.has(booking.id));
  if (byId) return byId;

  const bySlot = afterList.find((booking) => booking?.slot?.id === slotId);
  if (bySlot) return bySlot;

  return null;
}

async function main() {
  console.log('== Staging Driver Checkpoint ==');
  console.log(`API=${config.apiBaseUrl}`);
  console.log(
    `PHONES operator=${config.operatorPhone} broker=${config.brokerPhone} driver=${config.driverPhone}`
  );

  if (!config.internalServiceKey) {
    const describe = runGcloud([
      'run',
      'services',
      'describe',
      config.apiService,
      '--project',
      config.projectId,
      '--region',
      config.region,
      '--format',
      'json(spec.template.spec.containers[0].env)',
    ]);
    const parsed = parseJsonSafe(describe);
    const env = parsed?.spec?.template?.spec?.containers?.[0]?.env || [];
    const hit = env.find((entry) => entry.name === 'INTERNAL_SERVICE_KEY');
    config.internalServiceKey = hit?.value || '';
  }

  if (!config.internalServiceKey) {
    throw new Error('INTERNAL_SERVICE_KEY not available');
  }

  const operatorInitial = await authWithOtp(config.operatorPhone, 'OPERATOR');

  const brokerInitial = await authWithOtp(config.brokerPhone, 'BROKER_INITIAL');
  if (brokerInitial.user.primaryRole !== 'broker') {
    await promoteRole(
      operatorInitial.token,
      config.brokerPhone,
      'broker'
    );
  }
  const broker = await authWithOtp(config.brokerPhone, 'BROKER');

  const driverInitial = await authWithOtp(config.driverPhone, 'DRIVER_INITIAL');
  if (driverInitial.user.primaryRole !== 'driver') {
    await promoteRole(
      operatorInitial.token,
      config.driverPhone,
      'driver'
    );
  }
  const driver = await authWithOtp(config.driverPhone, 'DRIVER');

  let slotId = await findOwnedSlot(operatorInitial.token);
  if (!slotId) {
    slotId = await createOwnedSlot(operatorInitial.token);
  }
  if (!slotId) {
    slotId = await pickAnyOpenSlot(operatorInitial.token);
    if (slotId) {
      console.log(
        `SLOT_FALLBACK id=${slotId} ownership=unverified`
      );
    }
  }
  if (!slotId) {
    throw new Error('NO_OPEN_SLOT_FOUND');
  }
  console.log(`SLOT_READY id=${slotId}`);

  const beforeBookings = await apiRequest('GET', '/bookings', {
    token: broker.token,
    expect: [200],
  });
  const beforeList = Array.isArray(beforeBookings.json) ? beforeBookings.json : [];

  const requestCreate = await apiRequest('POST', '/requests', {
    token: broker.token,
    body: {
      region: 'DFW',
      title: `staging-booking-${Date.now()}`,
      description: 'staging checkpoint request',
      preferredStartAt: toIso(24),
      preferredEndAt: toIso(30),
      budgetCents: 120000,
      minScreenWidthFt: '10',
    },
    expect: [201],
  });
  const requestId = requestCreate.json?.id;
  if (!requestId) {
    throw new Error(`REQUEST_CREATE_NO_ID: ${requestCreate.text}`);
  }
  console.log(`REQUEST_CREATED id=${requestId}`);

  const offerCreate = await apiRequest('POST', '/offers', {
    token: broker.token,
    body: {
      requestId,
      slotId,
      amountCents: 100000,
      currency: 'USD',
      terms: { note: 'staging checkpoint offer' },
    },
    expect: [201],
  });
  const offerId = offerCreate.json?.id;
  if (!offerId) {
    throw new Error(`OFFER_CREATE_NO_ID: ${offerCreate.text}`);
  }
  console.log(`OFFER_CREATED id=${offerId}`);

  const offerAccept = await apiRequest('PATCH', `/offers/${offerId}`, {
    token: operatorInitial.token,
    body: { status: 'accepted' },
    expect: [200],
  });
  if (offerAccept.json?.status !== 'accepted') {
    throw new Error(`OFFER_NOT_ACCEPTED: ${offerAccept.text}`);
  }
  console.log(`OFFER_ACCEPTED id=${offerId}`);

  const afterBookings = await apiRequest('GET', '/bookings', {
    token: broker.token,
    expect: [200],
  });
  const afterList = Array.isArray(afterBookings.json) ? afterBookings.json : [];
  const booking = pickNewBooking(beforeList, afterList, slotId);
  if (!booking?.id) {
    throw new Error(
      `BOOKING_NOT_CREATED before=${beforeList.length} after=${afterList.length}`
    );
  }
  console.log(`BOOKING_CREATED id=${booking.id} status=${booking.status}`);

  const confirmBooking = await apiRequest(
    'PATCH',
    `/bookings/${booking.id}/status`,
    {
      token: broker.token,
      body: { status: 'confirmed' },
      expect: [200],
    }
  );
  if (confirmBooking.json?.status !== 'confirmed') {
    throw new Error(`BOOKING_CONFIRM_FAILED: ${confirmBooking.text}`);
  }
  console.log(`BOOKING_CONFIRMED id=${booking.id}`);

  const assignDriver = await apiRequest(
    'PATCH',
    `/bookings/${booking.id}/assign-driver`,
    {
      token: broker.token,
      body: { driverUserId: driver.user.id },
      expect: [200],
    }
  );
  if (assignDriver.json?.driverUserId !== driver.user.id) {
    throw new Error(`DRIVER_ASSIGN_FAILED: ${assignDriver.text}`);
  }
  console.log(`DRIVER_ASSIGNED booking=${booking.id} driver=${driver.user.id}`);

  await apiRequest('PATCH', '/drivers/me/location', {
    token: driver.token,
    body: {
      bookingId: booking.id,
      latitude: 32.7767,
      longitude: -96.797,
      isOnline: true,
    },
    expect: [200],
  });
  console.log(`DRIVER_LOCATION_UPDATED booking=${booking.id}`);

  const running = await apiRequest(
    'PATCH',
    `/bookings/${booking.id}/status`,
    {
      token: driver.token,
      body: { status: 'running' },
      expect: [200],
    }
  );
  if (running.json?.status !== 'running') {
    throw new Error(`DRIVER_RUNNING_FAILED: ${running.text}`);
  }
  console.log(`BOOKING_RUNNING id=${booking.id}`);

  const awaitingReview = await apiRequest(
    'PATCH',
    `/bookings/${booking.id}/status`,
    {
      token: driver.token,
      body: { status: 'awaiting_review' },
      expect: [200],
    }
  );
  if (awaitingReview.json?.status !== 'awaiting_review') {
    throw new Error(`DRIVER_AWAITING_REVIEW_FAILED: ${awaitingReview.text}`);
  }
  console.log(`BOOKING_AWAITING_REVIEW id=${booking.id}`);

  console.log(`DRIVER_CHECKPOINT_PASS booking=${booking.id} offer=${offerId}`);
}

main().catch((error) => {
  console.error(String(error?.message || error));
  process.exit(1);
});
