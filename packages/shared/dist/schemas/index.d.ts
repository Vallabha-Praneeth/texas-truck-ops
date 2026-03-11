import { z } from 'zod';
import { BookingStatus, UserRole } from '../types';
export declare const sendOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyOtpSchema: z.ZodEffects<z.ZodUnion<[z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    code: string;
}, {
    phone: string;
    code: string;
}>, z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>]>, {
    phone: string;
    code: string;
}, {
    phone: string;
    code: string;
} | {
    phone: string;
    otp: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    primaryRole: z.ZodNativeEnum<typeof UserRole>;
    organizationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    displayName: string;
    primaryRole: UserRole;
    email?: string | undefined;
    organizationId?: string | undefined;
}, {
    phone: string;
    displayName: string;
    primaryRole: UserRole;
    email?: string | undefined;
    organizationId?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    displayName: z.ZodOptional<z.ZodString>;
    primaryRole: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    organizationId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    primaryRole?: UserRole | undefined;
    organizationId?: string | undefined;
}, {
    phone?: string | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    primaryRole?: UserRole | undefined;
    organizationId?: string | undefined;
}>;
export declare const updateUserProfileSchema: z.ZodEffects<z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | null | undefined;
    displayName?: string | undefined;
}, {
    email?: string | null | undefined;
    displayName?: string | undefined;
}>, {
    email?: string | null | undefined;
    displayName?: string | undefined;
}, {
    email?: string | null | undefined;
    displayName?: string | undefined;
}>;
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["operator", "broker"]>;
    contactPhone: z.ZodString;
    contactEmail: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "operator" | "broker";
    name: string;
    contactPhone: string;
    contactEmail?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
}, {
    type: "operator" | "broker";
    name: string;
    contactPhone: string;
    contactEmail?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
}>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["operator", "broker"]>>;
    contactPhone: z.ZodOptional<z.ZodString>;
    contactEmail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: "operator" | "broker" | undefined;
    name?: string | undefined;
    contactPhone?: string | undefined;
    contactEmail?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
}, {
    type?: "operator" | "broker" | undefined;
    name?: string | undefined;
    contactPhone?: string | undefined;
    contactEmail?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
}>;
export declare const createTruckSchema: z.ZodObject<{
    orgId: z.ZodString;
    nickname: z.ZodString;
    plateNumber: z.ZodString;
    screenSizeFt: z.ZodString;
    baseRegion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orgId: string;
    nickname: string;
    plateNumber: string;
    screenSizeFt: string;
    baseRegion: string;
}, {
    orgId: string;
    nickname: string;
    plateNumber: string;
    screenSizeFt: string;
    baseRegion: string;
}>;
export declare const updateTruckSchema: z.ZodObject<{
    orgId: z.ZodOptional<z.ZodString>;
    nickname: z.ZodOptional<z.ZodString>;
    plateNumber: z.ZodOptional<z.ZodString>;
    screenSizeFt: z.ZodOptional<z.ZodString>;
    baseRegion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    orgId?: string | undefined;
    nickname?: string | undefined;
    plateNumber?: string | undefined;
    screenSizeFt?: string | undefined;
    baseRegion?: string | undefined;
}, {
    orgId?: string | undefined;
    nickname?: string | undefined;
    plateNumber?: string | undefined;
    screenSizeFt?: string | undefined;
    baseRegion?: string | undefined;
}>;
export declare const createSlotSchema: z.ZodObject<{
    truckId: z.ZodString;
    startAt: z.ZodString;
    endAt: z.ZodString;
    region: z.ZodString;
    radiusMiles: z.ZodNumber;
    repositionAllowed: z.ZodOptional<z.ZodBoolean>;
    maxRepositionMiles: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    truckId: string;
    startAt: string;
    endAt: string;
    region: string;
    radiusMiles: number;
    repositionAllowed?: boolean | undefined;
    maxRepositionMiles?: number | undefined;
    notes?: string | undefined;
}, {
    truckId: string;
    startAt: string;
    endAt: string;
    region: string;
    radiusMiles: number;
    repositionAllowed?: boolean | undefined;
    maxRepositionMiles?: number | undefined;
    notes?: string | undefined;
}>;
export declare const updateSlotSchema: z.ZodObject<{
    truckId: z.ZodOptional<z.ZodString>;
    startAt: z.ZodOptional<z.ZodString>;
    endAt: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    radiusMiles: z.ZodOptional<z.ZodNumber>;
    repositionAllowed: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    maxRepositionMiles: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    truckId?: string | undefined;
    startAt?: string | undefined;
    endAt?: string | undefined;
    region?: string | undefined;
    radiusMiles?: number | undefined;
    repositionAllowed?: boolean | undefined;
    maxRepositionMiles?: number | undefined;
    notes?: string | undefined;
}, {
    truckId?: string | undefined;
    startAt?: string | undefined;
    endAt?: string | undefined;
    region?: string | undefined;
    radiusMiles?: number | undefined;
    repositionAllowed?: boolean | undefined;
    maxRepositionMiles?: number | undefined;
    notes?: string | undefined;
}>;
export declare const searchSlotsSchema: z.ZodObject<{
    region: z.ZodOptional<z.ZodString>;
    startAt: z.ZodOptional<z.ZodString>;
    endAt: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    startAt?: string | undefined;
    endAt?: string | undefined;
    region?: string | undefined;
}, {
    startAt?: string | undefined;
    endAt?: string | undefined;
    region?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const createRequestSchema: z.ZodObject<{
    region: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    preferredStartAt: z.ZodString;
    preferredEndAt: z.ZodString;
    budgetCents: z.ZodOptional<z.ZodNumber>;
    minScreenWidthFt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region: string;
    title: string;
    description: string;
    preferredStartAt: string;
    preferredEndAt: string;
    budgetCents?: number | undefined;
    minScreenWidthFt?: string | undefined;
}, {
    region: string;
    title: string;
    description: string;
    preferredStartAt: string;
    preferredEndAt: string;
    budgetCents?: number | undefined;
    minScreenWidthFt?: string | undefined;
}>;
export declare const updateRequestSchema: z.ZodObject<{
    region: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    preferredStartAt: z.ZodOptional<z.ZodString>;
    preferredEndAt: z.ZodOptional<z.ZodString>;
    budgetCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    minScreenWidthFt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    region?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    preferredStartAt?: string | undefined;
    preferredEndAt?: string | undefined;
    budgetCents?: number | undefined;
    minScreenWidthFt?: string | undefined;
}, {
    region?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    preferredStartAt?: string | undefined;
    preferredEndAt?: string | undefined;
    budgetCents?: number | undefined;
    minScreenWidthFt?: string | undefined;
}>;
export declare const createOfferSchema: z.ZodEffects<z.ZodObject<{
    requestId: z.ZodOptional<z.ZodString>;
    slotId: z.ZodOptional<z.ZodString>;
    amountCents: z.ZodNumber;
    currency: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    requestId?: string | undefined;
    slotId?: string | undefined;
    currency?: string | undefined;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}, {
    amountCents: number;
    requestId?: string | undefined;
    slotId?: string | undefined;
    currency?: string | undefined;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}>, {
    amountCents: number;
    requestId?: string | undefined;
    slotId?: string | undefined;
    currency?: string | undefined;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}, {
    amountCents: number;
    requestId?: string | undefined;
    slotId?: string | undefined;
    currency?: string | undefined;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}>;
export declare const updateOfferSchema: z.ZodObject<{
    amountCents: z.ZodOptional<z.ZodNumber>;
    terms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "countered", "accepted", "rejected", "expired"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "countered" | "accepted" | "rejected" | "expired" | undefined;
    amountCents?: number | undefined;
    terms?: Record<string, unknown> | undefined;
}, {
    status?: "pending" | "countered" | "accepted" | "rejected" | "expired" | undefined;
    amountCents?: number | undefined;
    terms?: Record<string, unknown> | undefined;
}>;
export declare const counterOfferSchema: z.ZodObject<{
    amountCents: z.ZodNumber;
    terms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}, {
    amountCents: number;
    terms?: Record<string, unknown> | undefined;
    expiresAt?: string | undefined;
}>;
export declare const acceptOfferSchema: z.ZodObject<{
    offerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    offerId: string;
}, {
    offerId: string;
}>;
export declare const updateBookingStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof BookingStatus>;
    cancellationReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: BookingStatus;
    cancellationReason?: string | undefined;
}, {
    status: BookingStatus;
    cancellationReason?: string | undefined;
}>;
export declare const createMessageSchema: z.ZodObject<{
    threadId: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    threadId: string;
    content: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    threadId: string;
    content: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const createProofUploadSchema: z.ZodObject<{
    bookingId: z.ZodString;
    type: z.ZodEnum<["photo", "video", "gps_log"]>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    capturedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "photo" | "video" | "gps_log";
    bookingId: string;
    capturedAt: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    type: "photo" | "video" | "gps_log";
    bookingId: string;
    capturedAt: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
}>;
export declare const submitProofSchema: z.ZodObject<{
    bookingId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bookingId: string;
}, {
    bookingId: string;
}>;
export declare const getWalletBalanceSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
}, {
    organizationId: string;
}>;
export declare const getTransactionsSchema: z.ZodObject<{
    organizationId: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    limit: number;
    offset: number;
}, {
    organizationId: string;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const updateDriverLocationSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    bookingId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    bookingId?: string | null | undefined;
    isOnline?: boolean | undefined;
}, {
    latitude: number;
    longitude: number;
    bookingId?: string | null | undefined;
    isOnline?: boolean | undefined;
}>;
export declare const searchNearbyDriversSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    radiusMiles: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    radiusMiles: number;
    limit: number;
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
    radiusMiles?: number | undefined;
    limit?: number | undefined;
}>;
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
//# sourceMappingURL=index.d.ts.map