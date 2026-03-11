export interface BookingDetails {
    id: string;
    slotId: string;
    acceptedOfferId: string | null;
    operatorOrgId: string;
    brokerUserId: string;
    driverUserId: string | null;
    status: string;
    amountCents: number;
    depositCents: number;
    depositPaidAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    createdAt: string;
    updatedAt: string;
    slot: {
        id: string;
        startAt: string;
        endAt: string;
        truck: {
            id: string;
            nickname: string | null;
            plateNumber: string | null;
        } | null;
    } | null;
    operatorOrg: {
        id: string;
        name: string;
    } | null;
    brokerUser: {
        id: string;
        displayName: string | null;
    } | null;
    driver: {
        id: string;
        displayName: string | null;
    } | null;
}
export interface BookingSummary {
    id: string;
    status: string;
    amountCents: number;
    depositCents: number;
    createdAt: string;
    updatedAt: string;
    slot: {
        id: string;
        startAt: string;
        endAt: string;
        region: string;
        truck: {
            id: string;
            nickname: string | null;
            plateNumber: string | null;
        } | null;
    } | null;
    operatorOrg: {
        id: string;
        name: string;
    } | null;
}
export declare class BookingsService {
    listBookings(userId: string, userRole: string): Promise<BookingSummary[]>;
    getBookingById(bookingId: string, userId: string, userRole: string): Promise<BookingDetails>;
    private formatBookingSummary;
}
//# sourceMappingURL=bookings-query.service.d.ts.map