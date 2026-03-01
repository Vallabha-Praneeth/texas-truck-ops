import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'operator',
  'broker',
  'driver',
  'admin',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending_deposit',
  'confirmed',
  'running',
  'awaiting_review',
  'completed',
  'cancelled',
  'disputed',
]);

export const offerStatusEnum = pgEnum('offer_status', [
  'pending',
  'countered',
  'accepted',
  'rejected',
  'expired',
]);

// Organizations table
export const orgs = pgTable('orgs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'operator' or 'broker'
  contactPhone: varchar('contact_phone', { length: 20 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  taxId: varchar('tax_id', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    primaryRole: userRoleEnum('primary_role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: uniqueIndex('users_phone_idx').on(table.phone),
  })
);

// Organization members table (many-to-many)
export const orgMembers = pgTable(
  'org_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('org_members_org_idx').on(table.orgId),
    userIdx: index('org_members_user_idx').on(table.userId),
    uniqueMember: uniqueIndex('org_members_unique_idx').on(table.orgId, table.userId),
  })
);

// Trucks table
export const trucks = pgTable(
  'trucks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .references(() => orgs.id, { onDelete: 'cascade' })
      .notNull(),
    nickname: varchar('nickname', { length: 100 }).notNull(),
    plateNumber: varchar('plate_number', { length: 20 }).notNull(),
    screenSizeFt: varchar('screen_size_ft', { length: 50 }).notNull(),
    baseRegion: varchar('base_region', { length: 100 }).notNull(), // Texas city/region
    verified: boolean('verified').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('trucks_org_idx').on(table.orgId),
    verifiedIdx: index('trucks_verified_idx').on(table.verified),
  })
);

// Availability slots table with PostGIS
// Note: baseGeog geography(Point,4326) will be added via custom SQL in migration
export const availabilitySlots = pgTable(
  'availability_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    truckId: uuid('truck_id')
      .references(() => trucks.id, { onDelete: 'cascade' })
      .notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    region: text('region').notNull(), // DFW, Houston, Austin, San Antonio, El Paso, RGV
    radiusMiles: integer('radius_miles').notNull(),
    repositionAllowed: boolean('reposition_allowed').default(false).notNull(),
    maxRepositionMiles: integer('max_reposition_miles').default(0).notNull(),
    notes: text('notes'),
    isBooked: boolean('is_booked').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    truckTimeIdx: index('slots_truck_time_idx').on(table.truckId, table.startAt),
    regionTimeIdx: index('slots_region_time_idx').on(table.region, table.startAt),
  })
);

// Requests table
export const requests = pgTable(
  'requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    region: text('region').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    preferredStartAt: timestamp('preferred_start_at', { withTimezone: true }).notNull(),
    preferredEndAt: timestamp('preferred_end_at', { withTimezone: true }).notNull(),
    budgetCents: integer('budget_cents'),
    minScreenWidthFt: varchar('min_screen_width_ft', { length: 20 }),
    status: varchar('status', { length: 20 }).default('open').notNull(), // open, matched, closed
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('requests_created_by_idx').on(table.createdBy),
    statusIdx: index('requests_status_idx').on(table.status),
    regionIdx: index('requests_region_idx').on(table.region),
  })
);

// Offers table
export const offers = pgTable(
  'offers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id')
      .references(() => requests.id, { onDelete: 'cascade' }),
    slotId: uuid('slot_id')
      .references(() => availabilitySlots.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    terms: jsonb('terms'), // Flexible terms object
    status: offerStatusEnum('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    requestIdx: index('offers_request_idx').on(table.requestId),
    slotIdx: index('offers_slot_idx').on(table.slotId),
    statusIdx: index('offers_status_idx').on(table.status),
  })
);

// Bookings table
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slotId: uuid('slot_id')
      .references(() => availabilitySlots.id)
      .notNull()
      .unique(), // Prevent double-booking
    acceptedOfferId: uuid('accepted_offer_id')
      .references(() => offers.id)
      .notNull(),
    operatorOrgId: uuid('operator_org_id')
      .references(() => orgs.id)
      .notNull(),
    brokerUserId: uuid('broker_user_id')
      .references(() => users.id)
      .notNull(),
    driverUserId: uuid('driver_user_id').references(() => users.id),
    status: bookingStatusEnum('status').default('pending_deposit').notNull(),
    amountCents: integer('amount_cents').notNull(),
    depositCents: integer('deposit_cents').notNull(),
    depositPaidAt: timestamp('deposit_paid_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slotIdx: uniqueIndex('bookings_slot_unique_idx').on(table.slotId),
    operatorStatusIdx: index('bookings_operator_status_idx').on(
      table.operatorOrgId,
      table.status
    ),
    brokerStatusIdx: index('bookings_broker_status_idx').on(
      table.brokerUserId,
      table.status
    ),
  })
);

// Driver presence + latest location
export const driverPresence = pgTable(
  'driver_presence',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id, {
      onDelete: 'set null',
    }),
    isOnline: boolean('is_online').default(false).notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    onlineSeenIdx: index('driver_presence_online_seen_idx').on(
      table.isOnline,
      table.lastSeenAt
    ),
    bookingIdx: index('driver_presence_booking_idx').on(table.bookingId),
    latLngIdx: index('driver_presence_lat_lng_idx').on(
      table.latitude,
      table.longitude
    ),
  })
);
