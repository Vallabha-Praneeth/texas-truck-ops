"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverPresence = exports.bookings = exports.offers = exports.requests = exports.availabilitySlots = exports.trucks = exports.orgMembers = exports.users = exports.orgs = exports.offerStatusEnum = exports.bookingStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', [
    'operator',
    'broker',
    'driver',
    'admin',
]);
exports.bookingStatusEnum = (0, pg_core_1.pgEnum)('booking_status', [
    'pending_deposit',
    'confirmed',
    'running',
    'awaiting_review',
    'completed',
    'cancelled',
    'disputed',
]);
exports.offerStatusEnum = (0, pg_core_1.pgEnum)('offer_status', [
    'pending',
    'countered',
    'accepted',
    'rejected',
    'expired',
]);
// Organizations table
exports.orgs = (0, pg_core_1.pgTable)('orgs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(), // 'operator' or 'broker'
    contactPhone: (0, pg_core_1.varchar)('contact_phone', { length: 20 }).notNull(),
    contactEmail: (0, pg_core_1.varchar)('contact_email', { length: 255 }),
    taxId: (0, pg_core_1.varchar)('tax_id', { length: 50 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }).notNull().unique(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 100 }).notNull(),
    primaryRole: (0, exports.userRoleEnum)('primary_role').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    phoneIdx: (0, pg_core_1.uniqueIndex)('users_phone_idx').on(table.phone),
}));
// Organization members table (many-to-many)
exports.orgMembers = (0, pg_core_1.pgTable)('org_members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => exports.orgs.id, { onDelete: 'cascade' })
        .notNull(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    role: (0, exports.userRoleEnum)('role').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    orgIdx: (0, pg_core_1.index)('org_members_org_idx').on(table.orgId),
    userIdx: (0, pg_core_1.index)('org_members_user_idx').on(table.userId),
    uniqueMember: (0, pg_core_1.uniqueIndex)('org_members_unique_idx').on(table.orgId, table.userId),
}));
// Trucks table
exports.trucks = (0, pg_core_1.pgTable)('trucks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => exports.orgs.id, { onDelete: 'cascade' })
        .notNull(),
    nickname: (0, pg_core_1.varchar)('nickname', { length: 100 }).notNull(),
    plateNumber: (0, pg_core_1.varchar)('plate_number', { length: 20 }).notNull(),
    screenSizeFt: (0, pg_core_1.varchar)('screen_size_ft', { length: 50 }).notNull(),
    baseRegion: (0, pg_core_1.varchar)('base_region', { length: 100 }).notNull(), // Texas city/region
    verified: (0, pg_core_1.boolean)('verified').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    orgIdx: (0, pg_core_1.index)('trucks_org_idx').on(table.orgId),
    verifiedIdx: (0, pg_core_1.index)('trucks_verified_idx').on(table.verified),
}));
// Availability slots table with PostGIS
// Note: baseGeog geography(Point,4326) will be added via custom SQL in migration
exports.availabilitySlots = (0, pg_core_1.pgTable)('availability_slots', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    truckId: (0, pg_core_1.uuid)('truck_id')
        .references(() => exports.trucks.id, { onDelete: 'cascade' })
        .notNull(),
    startAt: (0, pg_core_1.timestamp)('start_at', { withTimezone: true }).notNull(),
    endAt: (0, pg_core_1.timestamp)('end_at', { withTimezone: true }).notNull(),
    region: (0, pg_core_1.text)('region').notNull(), // DFW, Houston, Austin, San Antonio, El Paso, RGV
    radiusMiles: (0, pg_core_1.integer)('radius_miles').notNull(),
    repositionAllowed: (0, pg_core_1.boolean)('reposition_allowed').default(false).notNull(),
    maxRepositionMiles: (0, pg_core_1.integer)('max_reposition_miles').default(0).notNull(),
    notes: (0, pg_core_1.text)('notes'),
    isBooked: (0, pg_core_1.boolean)('is_booked').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    truckTimeIdx: (0, pg_core_1.index)('slots_truck_time_idx').on(table.truckId, table.startAt),
    regionTimeIdx: (0, pg_core_1.index)('slots_region_time_idx').on(table.region, table.startAt),
}));
// Requests table
exports.requests = (0, pg_core_1.pgTable)('requests', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    region: (0, pg_core_1.text)('region').notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    preferredStartAt: (0, pg_core_1.timestamp)('preferred_start_at', { withTimezone: true }).notNull(),
    preferredEndAt: (0, pg_core_1.timestamp)('preferred_end_at', { withTimezone: true }).notNull(),
    budgetCents: (0, pg_core_1.integer)('budget_cents'),
    minScreenWidthFt: (0, pg_core_1.varchar)('min_screen_width_ft', { length: 20 }),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('open').notNull(), // open, matched, closed
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    createdByIdx: (0, pg_core_1.index)('requests_created_by_idx').on(table.createdBy),
    statusIdx: (0, pg_core_1.index)('requests_status_idx').on(table.status),
    regionIdx: (0, pg_core_1.index)('requests_region_idx').on(table.region),
}));
// Offers table
exports.offers = (0, pg_core_1.pgTable)('offers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    requestId: (0, pg_core_1.uuid)('request_id')
        .references(() => exports.requests.id, { onDelete: 'cascade' })
        .notNull(),
    slotId: (0, pg_core_1.uuid)('slot_id')
        .references(() => exports.availabilitySlots.id, { onDelete: 'cascade' })
        .notNull(),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => exports.users.id)
        .notNull(),
    amountCents: (0, pg_core_1.integer)('amount_cents').notNull(),
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).default('USD').notNull(),
    terms: (0, pg_core_1.jsonb)('terms'), // Flexible terms object
    status: (0, exports.offerStatusEnum)('status').default('pending').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    requestIdx: (0, pg_core_1.index)('offers_request_idx').on(table.requestId),
    slotIdx: (0, pg_core_1.index)('offers_slot_idx').on(table.slotId),
    statusIdx: (0, pg_core_1.index)('offers_status_idx').on(table.status),
}));
// Bookings table
exports.bookings = (0, pg_core_1.pgTable)('bookings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    slotId: (0, pg_core_1.uuid)('slot_id')
        .references(() => exports.availabilitySlots.id)
        .notNull()
        .unique(), // Prevent double-booking
    acceptedOfferId: (0, pg_core_1.uuid)('accepted_offer_id')
        .references(() => exports.offers.id)
        .notNull(),
    operatorOrgId: (0, pg_core_1.uuid)('operator_org_id')
        .references(() => exports.orgs.id)
        .notNull(),
    brokerUserId: (0, pg_core_1.uuid)('broker_user_id')
        .references(() => exports.users.id)
        .notNull(),
    driverUserId: (0, pg_core_1.uuid)('driver_user_id').references(() => exports.users.id),
    status: (0, exports.bookingStatusEnum)('status').default('pending_deposit').notNull(),
    amountCents: (0, pg_core_1.integer)('amount_cents').notNull(),
    depositCents: (0, pg_core_1.integer)('deposit_cents').notNull(),
    depositPaidAt: (0, pg_core_1.timestamp)('deposit_paid_at', { withTimezone: true }),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at', { withTimezone: true }),
    cancellationReason: (0, pg_core_1.text)('cancellation_reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    slotIdx: (0, pg_core_1.uniqueIndex)('bookings_slot_unique_idx').on(table.slotId),
    operatorStatusIdx: (0, pg_core_1.index)('bookings_operator_status_idx').on(table.operatorOrgId, table.status),
    brokerStatusIdx: (0, pg_core_1.index)('bookings_broker_status_idx').on(table.brokerUserId, table.status),
}));
// Driver presence + latest location
exports.driverPresence = (0, pg_core_1.pgTable)('driver_presence', {
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .primaryKey(),
    bookingId: (0, pg_core_1.uuid)('booking_id').references(() => exports.bookings.id, {
        onDelete: 'set null',
    }),
    isOnline: (0, pg_core_1.boolean)('is_online').default(false).notNull(),
    latitude: (0, pg_core_1.doublePrecision)('latitude'),
    longitude: (0, pg_core_1.doublePrecision)('longitude'),
    lastSeenAt: (0, pg_core_1.timestamp)('last_seen_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    onlineSeenIdx: (0, pg_core_1.index)('driver_presence_online_seen_idx').on(table.isOnline, table.lastSeenAt),
    bookingIdx: (0, pg_core_1.index)('driver_presence_booking_idx').on(table.bookingId),
    latLngIdx: (0, pg_core_1.index)('driver_presence_lat_lng_idx').on(table.latitude, table.longitude),
}));
//# sourceMappingURL=schema.js.map