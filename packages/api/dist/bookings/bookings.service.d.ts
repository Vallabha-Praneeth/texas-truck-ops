import { RealtimeService } from '../realtime/realtime.service';
export declare enum BookingStatus {
    PENDING_DEPOSIT = "pending_deposit",
    CONFIRMED = "confirmed",
    RUNNING = "running",
    AWAITING_REVIEW = "awaiting_review",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    DISPUTED = "disputed"
}
export declare class BookingService {
    private readonly realtimeService?;
    constructor(realtimeService?: RealtimeService);
    acceptOffer(offerId: string, _userId: string): Promise<{
        id: string;
        createdAt: Date;
        status: "pending_deposit" | "confirmed" | "running" | "awaiting_review" | "completed" | "cancelled" | "disputed";
        slotId: string;
        acceptedOfferId: string;
        operatorOrgId: string;
        brokerUserId: string;
        driverUserId: string;
        amountCents: number;
        depositCents: number;
        depositPaidAt: Date;
        startedAt: Date;
        completedAt: Date;
        cancelledAt: Date;
        cancellationReason: string;
        updatedAt: Date;
    }>;
    transitionBookingStatus(bookingId: string, newStatus: BookingStatus, metadata?: {
        depositPaidAt?: Date;
        startedAt?: Date;
        completedAt?: Date;
        cancelledAt?: Date;
        cancellationReason?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: "pending_deposit" | "confirmed" | "running" | "awaiting_review" | "completed" | "cancelled" | "disputed";
        slotId: string;
        acceptedOfferId: string;
        operatorOrgId: string;
        brokerUserId: string;
        driverUserId: string;
        amountCents: number;
        depositCents: number;
        depositPaidAt: Date;
        startedAt: Date;
        completedAt: Date;
        cancelledAt: Date;
        cancellationReason: string;
        updatedAt: Date;
    }>;
    assignDriverToBooking(bookingId: string, driverUserId: string): Promise<{
        id: string;
        createdAt: Date;
        status: "pending_deposit" | "confirmed" | "running" | "awaiting_review" | "completed" | "cancelled" | "disputed";
        slotId: string;
        acceptedOfferId: string;
        operatorOrgId: string;
        brokerUserId: string;
        driverUserId: string;
        amountCents: number;
        depositCents: number;
        depositPaidAt: Date;
        startedAt: Date;
        completedAt: Date;
        cancelledAt: Date;
        cancellationReason: string;
        updatedAt: Date;
    }>;
    private validateTransition;
    checkSlotOverlap(truckId: string, startAt: Date, endAt: Date, excludeSlotId?: string): Promise<boolean>;
    private emitBookingCreated;
    private emitBookingStatusChanged;
    private emitDriverAssigned;
}
//# sourceMappingURL=bookings.service.d.ts.map