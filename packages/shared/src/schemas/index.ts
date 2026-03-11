import { z } from 'zod';
import { BookingStatus, UserRole } from '../types';

// Auth schemas
export const sendOtpSchema = z.object({
    phone: z.string().regex(/^\+1[0-9]{10}$/, 'Must be a valid US phone number'),
});

const verifyOtpCodeSchema = z.object({
    phone: z.string().regex(/^\+1[0-9]{10}$/),
    code: z.string().length(6, 'OTP must be 6 digits'),
});

const verifyOtpLegacySchema = z.object({
    phone: z.string().regex(/^\+1[0-9]{10}$/),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const verifyOtpSchema = z
    .union([verifyOtpCodeSchema, verifyOtpLegacySchema])
    .transform((value) => ({
        phone: value.phone,
        code: 'code' in value ? value.code : value.otp,
    }));

// User schemas
export const createUserSchema = z.object({
    phone: z.string().regex(/^\+1[0-9]{10}$/),
    email: z.string().email().optional(),
    displayName: z.string().min(1).max(100),
    primaryRole: z.nativeEnum(UserRole),
    organizationId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial();
export const updateUserProfileSchema = z
    .object({
        displayName: z.string().min(1).max(100).optional(),
        email: z.string().email().nullable().optional(),
    })
    .refine(
        (value) => value.displayName !== undefined || value.email !== undefined,
        {
            message: 'At least one field must be provided',
        }
    );

// Organization schemas
export const createOrganizationSchema = z.object({
    name: z.string().min(1).max(200),
    type: z.enum(['operator', 'broker']),
    contactPhone: z.string().regex(/^\+1[0-9]{10}$/),
    contactEmail: z.string().email().optional(),
    address: z.string().max(500).optional(),
    taxId: z.string().max(50).optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// Truck schemas
export const createTruckSchema = z.object({
    orgId: z.string().uuid(),
    nickname: z.string().min(1).max(100),
    plateNumber: z.string().min(1).max(20),
    screenSizeFt: z.string().min(1).max(50),
    baseRegion: z.string().min(1).max(100),
});

export const updateTruckSchema = createTruckSchema.partial();

// Availability slot schemas
export const createSlotSchema = z.object({
    truckId: z.string().uuid(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    region: z.string().min(1).max(50),
    radiusMiles: z.coerce.number().int().positive(),
    repositionAllowed: z.boolean().optional(),
    maxRepositionMiles: z.coerce.number().int().min(0).optional(),
    notes: z.string().max(500).optional(),
});

export const updateSlotSchema = createSlotSchema.partial();

export const searchSlotsSchema = z.object({
    region: z.string().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
});

// Request schemas
export const createRequestSchema = z.object({
    region: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    description: z.string().max(2000),
    preferredStartAt: z.string().datetime(),
    preferredEndAt: z.string().datetime(),
    budgetCents: z.number().int().positive().optional(),
    minScreenWidthFt: z.string().max(20).optional(),
});

export const updateRequestSchema = createRequestSchema.partial();

// Offer schemas
export const createOfferSchema = z
    .object({
        requestId: z.string().uuid().optional(),
        slotId: z.string().uuid().optional(),
        amountCents: z.number().int().positive(),
        currency: z.string().length(3).optional(),
        terms: z.record(z.unknown()).optional(),
        expiresAt: z.string().datetime().optional(),
    })
    .refine(
        (value) => value.requestId !== undefined || value.slotId !== undefined,
        {
            message: 'Either requestId or slotId must be provided',
        }
    );

export const updateOfferSchema = z.object({
    amountCents: z.number().int().positive().optional(),
    terms: z.record(z.unknown()).optional(),
    status: z
        .enum(['pending', 'countered', 'accepted', 'rejected', 'expired'])
        .optional(),
});

export const counterOfferSchema = z.object({
    amountCents: z.number().int().positive(),
    terms: z.record(z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
});

export const acceptOfferSchema = z.object({
    offerId: z.string().uuid(),
});

// Booking schemas
export const updateBookingStatusSchema = z.object({
    status: z.nativeEnum(BookingStatus),
    cancellationReason: z.string().max(500).optional(),
});

// Message schemas
export const createMessageSchema = z.object({
    threadId: z.string().uuid(),
    content: z.string().min(1).max(5000),
    metadata: z.record(z.unknown()).optional(),
});

// Proof upload schemas
export const createProofUploadSchema = z.object({
    bookingId: z.string().uuid(),
    type: z.enum(['photo', 'video', 'gps_log']),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    capturedAt: z.string().datetime(),
});

export const submitProofSchema = z.object({
    bookingId: z.string().uuid(),
});

// Wallet schemas
export const getWalletBalanceSchema = z.object({
    organizationId: z.string().uuid(),
});

export const getTransactionsSchema = z.object({
    organizationId: z.string().uuid(),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
});

// Driver location schemas
export const updateDriverLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    isOnline: z.boolean().optional(),
    bookingId: z.string().uuid().nullable().optional(),
});

export const searchNearbyDriversSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMiles: z.number().positive().max(100).default(5),
    limit: z.number().int().positive().max(100).default(20),
});

// Type exports for use in API
export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type CreateTruckDto = z.infer<typeof createTruckSchema>;
export type UpdateTruckDto = z.infer<typeof updateTruckSchema>;
export type CreateSlotDto = z.infer<typeof createSlotSchema>;
export type UpdateSlotDto = z.infer<typeof updateSlotSchema>;
export type SearchSlotsDto = z.infer<typeof searchSlotsSchema>;
export type CreateRequestDto = z.infer<typeof createRequestSchema>;
export type UpdateRequestDto = z.infer<typeof updateRequestSchema>;
export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;
export type CounterOfferDto = z.infer<typeof counterOfferSchema>;
export type AcceptOfferDto = z.infer<typeof acceptOfferSchema>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;
export type CreateMessageDto = z.infer<typeof createMessageSchema>;
export type CreateProofUploadDto = z.infer<typeof createProofUploadSchema>;
export type SubmitProofDto = z.infer<typeof submitProofSchema>;
export type GetWalletBalanceDto = z.infer<typeof getWalletBalanceSchema>;
export type GetTransactionsDto = z.infer<typeof getTransactionsSchema>;
export type UpdateDriverLocationDto = z.infer<typeof updateDriverLocationSchema>;
export type SearchNearbyDriversDto = z.infer<typeof searchNearbyDriversSchema>;
