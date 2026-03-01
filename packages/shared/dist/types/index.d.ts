export declare enum UserRole {
    OPERATOR = "operator",
    BROKER = "broker",
    DRIVER = "driver",
    ADMIN = "admin"
}
export declare enum BookingStatus {
    PENDING_DEPOSIT = "pending_deposit",
    CONFIRMED = "confirmed",
    RUNNING = "running",
    AWAITING_REVIEW = "awaiting_review",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    DISPUTED = "disputed"
}
export declare enum OfferStatus {
    PENDING = "pending",
    COUNTERED = "countered",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum TransactionType {
    DEPOSIT = "deposit",
    PAYOUT = "payout",
    REFUND = "refund",
    FEE = "fee"
}
export interface User {
    id: string;
    phone: string;
    email?: string | null;
    displayName: string;
    primaryRole: UserRole;
    createdAt: Date;
}
export interface Organization {
    id: string;
    name: string;
    type: 'operator' | 'broker';
    contactPhone: string;
    contactEmail?: string;
    address?: string;
    taxId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Truck {
    id: string;
    orgId: string;
    nickname: string;
    plateNumber: string;
    screenSizeFt: string;
    baseRegion: string;
    verified: boolean;
    createdAt: Date;
}
export interface AvailabilitySlot {
    id: string;
    truckId: string;
    startAt: Date;
    endAt: Date;
    region: string;
    radiusMiles: number;
    repositionAllowed: boolean;
    maxRepositionMiles: number;
    notes?: string;
    isBooked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Request {
    id: string;
    createdBy: string;
    title: string;
    description: string;
    region: string;
    preferredStartAt: Date;
    preferredEndAt: Date;
    budgetCents?: number;
    minScreenWidthFt?: string;
    status: 'open' | 'matched' | 'closed';
    createdAt: Date;
}
export interface Offer {
    id: string;
    requestId?: string | null;
    slotId?: string | null;
    createdBy: string;
    amountCents: number;
    currency: string;
    terms?: Record<string, unknown>;
    status: OfferStatus;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Booking {
    id: string;
    slotId: string;
    acceptedOfferId: string | null;
    operatorOrgId: string;
    brokerUserId: string;
    driverUserId?: string;
    status: BookingStatus;
    amountCents: number;
    depositCents: number;
    depositPaidAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DriverPresence {
    userId: string;
    bookingId?: string | null;
    isOnline: boolean;
    latitude?: number | null;
    longitude?: number | null;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Message {
    id: string;
    threadId: string;
    senderId: string;
    content: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface Thread {
    id: string;
    requestId?: string;
    bookingId?: string;
    participantIds: string[];
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProofUpload {
    id: string;
    bookingId: string;
    uploadedBy: string;
    type: 'photo' | 'video' | 'gps_log';
    url: string;
    latitude?: number;
    longitude?: number;
    capturedAt: Date;
    createdAt: Date;
}
export interface WalletTransaction {
    id: string;
    organizationId: string;
    bookingId?: string;
    type: TransactionType;
    amount: number;
    balance: number;
    description: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map