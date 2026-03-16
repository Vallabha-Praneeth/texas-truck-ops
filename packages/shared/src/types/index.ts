// Core domain types for the LED Billboard Marketplace

export enum UserRole {
    OPERATOR = 'operator',
    BROKER = 'broker',
    DRIVER = 'driver',
    ADMIN = 'admin',
}

export enum BookingStatus {
    PENDING_DEPOSIT = 'pending_deposit',
    CONFIRMED = 'confirmed',
    RUNNING = 'running',
    AWAITING_REVIEW = 'awaiting_review',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed',
}

export enum OfferStatus {
    PENDING = 'pending',
    COUNTERED = 'countered',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    REFUND = 'refund',
    PAYOUT = 'payout',
    PLATFORM_FEE = 'platform_fee',
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum PaymentMethod {
    STRIPE = 'stripe',
    CARD = 'card',
    BANK_TRANSFER = 'bank_transfer',
}

export enum ProofStatus {
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
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
    screenSizeFt: string; // e.g., "10x20 ft"
    baseRegion: string; // City/region in Texas
    verified: boolean;
    createdAt: Date;
}

export interface AvailabilitySlot {
    id: string;
    truckId: string;
    startAt: Date;
    endAt: Date;
    region: string; // DFW, Houston, Austin, San Antonio, El Paso, RGV
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
    metadata?: Record<string, unknown>; // For structured offer cards
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
    driverUserId: string;
    imageUrl: string;
    latitude?: number | null;
    longitude?: number | null;
    capturedAt: Date;
    uploadedAt: Date;
    notes?: string | null;
    status: ProofStatus;
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface WalletTransaction {
    id: string;
    userId: string;
    bookingId?: string | null;
    amount: string; // Using string for numeric precision
    type: TransactionType;
    status: TransactionStatus;
    paymentMethod?: string | null;
    externalTransactionId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: Date;
    completedAt?: Date | null;
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
