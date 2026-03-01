import { OffersService } from './offers.service';
export declare class OffersController {
    private offersService;
    constructor(offersService: OffersService);
    createOffer(body: unknown, req: any): Promise<{
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
    listOffers(req: any): Promise<{
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
    getOffer(id: string, req: any): Promise<{
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
    updateOffer(id: string, body: unknown, req: any): Promise<{
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
    deleteOffer(id: string, req: any): Promise<void>;
}
//# sourceMappingURL=offers.controller.d.ts.map