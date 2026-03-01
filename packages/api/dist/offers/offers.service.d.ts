import { CreateOfferDto, UpdateOfferDto } from '@led-billboard/shared';
import { BookingService } from '../bookings/bookings.service';
export declare class OffersService {
    private readonly bookingService?;
    constructor(bookingService?: BookingService);
    createOffer(dto: CreateOfferDto, userId: string, _userRole: string): Promise<{
        id: any;
        slotId: any;
        requestId: any;
        createdBy: any;
        amountCents: any;
        currency: any;
        terms: any;
        status: any;
        expiresAt: any;
        createdAt: any;
        updatedAt: any;
    }>;
    listOffers(userId: string, userRole: string): Promise<{
        id: any;
        slotId: any;
        requestId: any;
        createdBy: any;
        amountCents: any;
        currency: any;
        terms: any;
        status: any;
        expiresAt: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getOffer(offerId: string, userId: string, userRole: string): Promise<{
        id: any;
        slotId: any;
        requestId: any;
        createdBy: any;
        amountCents: any;
        currency: any;
        terms: any;
        status: any;
        expiresAt: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateOffer(offerId: string, dto: UpdateOfferDto, userId: string, userRole: string): Promise<{
        id: any;
        slotId: any;
        requestId: any;
        createdBy: any;
        amountCents: any;
        currency: any;
        terms: any;
        status: any;
        expiresAt: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteOffer(offerId: string, userId: string): Promise<void>;
    private formatOffer;
}
//# sourceMappingURL=offers.service.d.ts.map