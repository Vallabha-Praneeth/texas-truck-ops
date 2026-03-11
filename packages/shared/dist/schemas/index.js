"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNearbyDriversSchema = exports.updateDriverLocationSchema = exports.getTransactionsSchema = exports.getWalletBalanceSchema = exports.submitProofSchema = exports.createProofUploadSchema = exports.createMessageSchema = exports.updateBookingStatusSchema = exports.acceptOfferSchema = exports.counterOfferSchema = exports.updateOfferSchema = exports.createOfferSchema = exports.updateRequestSchema = exports.createRequestSchema = exports.searchSlotsSchema = exports.updateSlotSchema = exports.createSlotSchema = exports.updateTruckSchema = exports.createTruckSchema = exports.updateOrganizationSchema = exports.createOrganizationSchema = exports.updateUserProfileSchema = exports.updateUserSchema = exports.createUserSchema = exports.verifyOtpSchema = exports.sendOtpSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// Auth schemas
exports.sendOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+1[0-9]{10}$/, 'Must be a valid US phone number'),
});
const verifyOtpCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+1[0-9]{10}$/),
    code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
const verifyOtpLegacySchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+1[0-9]{10}$/),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
exports.verifyOtpSchema = zod_1.z
    .union([verifyOtpCodeSchema, verifyOtpLegacySchema])
    .transform((value) => ({
    phone: value.phone,
    code: 'code' in value ? value.code : value.otp,
}));
// User schemas
exports.createUserSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+1[0-9]{10}$/),
    email: zod_1.z.string().email().optional(),
    displayName: zod_1.z.string().min(1).max(100),
    primaryRole: zod_1.z.nativeEnum(types_1.UserRole),
    organizationId: zod_1.z.string().uuid().optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial();
exports.updateUserProfileSchema = zod_1.z
    .object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().nullable().optional(),
})
    .refine((value) => value.displayName !== undefined || value.email !== undefined, {
    message: 'At least one field must be provided',
});
// Organization schemas
exports.createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    type: zod_1.z.enum(['operator', 'broker']),
    contactPhone: zod_1.z.string().regex(/^\+1[0-9]{10}$/),
    contactEmail: zod_1.z.string().email().optional(),
    address: zod_1.z.string().max(500).optional(),
    taxId: zod_1.z.string().max(50).optional(),
});
exports.updateOrganizationSchema = exports.createOrganizationSchema.partial();
// Truck schemas
exports.createTruckSchema = zod_1.z.object({
    orgId: zod_1.z.string().uuid(),
    nickname: zod_1.z.string().min(1).max(100),
    plateNumber: zod_1.z.string().min(1).max(20),
    screenSizeFt: zod_1.z.string().min(1).max(50),
    baseRegion: zod_1.z.string().min(1).max(100),
});
exports.updateTruckSchema = exports.createTruckSchema.partial();
// Availability slot schemas
exports.createSlotSchema = zod_1.z.object({
    truckId: zod_1.z.string().uuid(),
    startAt: zod_1.z.string().datetime(),
    endAt: zod_1.z.string().datetime(),
    region: zod_1.z.string().min(1).max(50),
    radiusMiles: zod_1.z.coerce.number().int().positive(),
    repositionAllowed: zod_1.z.boolean().optional(),
    maxRepositionMiles: zod_1.z.coerce.number().int().min(0).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.updateSlotSchema = exports.createSlotSchema.partial();
exports.searchSlotsSchema = zod_1.z.object({
    region: zod_1.z.string().optional(),
    startAt: zod_1.z.string().datetime().optional(),
    endAt: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    offset: zod_1.z.coerce.number().int().nonnegative().default(0),
});
// Request schemas
exports.createRequestSchema = zod_1.z.object({
    region: zod_1.z.string().min(1).max(50),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000),
    preferredStartAt: zod_1.z.string().datetime(),
    preferredEndAt: zod_1.z.string().datetime(),
    budgetCents: zod_1.z.number().int().positive().optional(),
    minScreenWidthFt: zod_1.z.string().max(20).optional(),
});
exports.updateRequestSchema = exports.createRequestSchema.partial();
// Offer schemas
exports.createOfferSchema = zod_1.z
    .object({
    requestId: zod_1.z.string().uuid().optional(),
    slotId: zod_1.z.string().uuid().optional(),
    amountCents: zod_1.z.number().int().positive(),
    currency: zod_1.z.string().length(3).optional(),
    terms: zod_1.z.record(zod_1.z.unknown()).optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
})
    .refine((value) => value.requestId !== undefined || value.slotId !== undefined, {
    message: 'Either requestId or slotId must be provided',
});
exports.updateOfferSchema = zod_1.z.object({
    amountCents: zod_1.z.number().int().positive().optional(),
    terms: zod_1.z.record(zod_1.z.unknown()).optional(),
    status: zod_1.z
        .enum(['pending', 'countered', 'accepted', 'rejected', 'expired'])
        .optional(),
});
exports.counterOfferSchema = zod_1.z.object({
    amountCents: zod_1.z.number().int().positive(),
    terms: zod_1.z.record(zod_1.z.unknown()).optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
});
exports.acceptOfferSchema = zod_1.z.object({
    offerId: zod_1.z.string().uuid(),
});
// Booking schemas
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(types_1.BookingStatus),
    cancellationReason: zod_1.z.string().max(500).optional(),
});
// Message schemas
exports.createMessageSchema = zod_1.z.object({
    threadId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1).max(5000),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Proof upload schemas
exports.createProofUploadSchema = zod_1.z.object({
    bookingId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['photo', 'video', 'gps_log']),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    capturedAt: zod_1.z.string().datetime(),
});
exports.submitProofSchema = zod_1.z.object({
    bookingId: zod_1.z.string().uuid(),
});
// Wallet schemas
exports.getWalletBalanceSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
});
exports.getTransactionsSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    limit: zod_1.z.number().int().positive().max(100).default(20),
    offset: zod_1.z.number().int().nonnegative().default(0),
});
// Driver location schemas
exports.updateDriverLocationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    isOnline: zod_1.z.boolean().optional(),
    bookingId: zod_1.z.string().uuid().nullable().optional(),
});
exports.searchNearbyDriversSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    radiusMiles: zod_1.z.number().positive().max(100).default(5),
    limit: zod_1.z.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=index.js.map