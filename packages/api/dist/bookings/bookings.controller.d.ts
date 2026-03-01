import { BookingsService } from './bookings-query.service';
import { BookingService } from './bookings.service';
export declare class BookingsController {
    private readonly bookingsQueryService;
    private readonly bookingService;
    constructor(bookingsQueryService: BookingsService, bookingService: BookingService);
    listBookings(req: any): Promise<import("./bookings-query.service").BookingSummary[]>;
    getBooking(id: string, req: any): Promise<import("./bookings-query.service").BookingDetails>;
    updateBookingStatus(id: string, body: unknown, req: any): Promise<import("./bookings-query.service").BookingDetails>;
    assignDriver(id: string, body: unknown, req: any): Promise<import("./bookings-query.service").BookingDetails>;
    private toBookingStatus;
    private createTransitionMetadata;
    private isTransitionAllowedForRole;
}
//# sourceMappingURL=bookings.controller.d.ts.map