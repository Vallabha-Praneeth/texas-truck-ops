import { RequestsService } from './requests.service';
export declare class RequestsController {
    private requestsService;
    constructor(requestsService: RequestsService);
    createRequest(body: unknown, req: any): Promise<{
        id: any;
        createdBy: any;
        region: any;
        title: any;
        description: any;
        preferredStartAt: any;
        preferredEndAt: any;
        budgetCents: any;
        minScreenWidthFt: any;
        status: any;
        createdAt: any;
    }>;
    listRequests(filters: {
        region?: string;
        status?: string;
    }): Promise<{
        id: any;
        createdBy: any;
        region: any;
        title: any;
        description: any;
        preferredStartAt: any;
        preferredEndAt: any;
        budgetCents: any;
        minScreenWidthFt: any;
        status: any;
        createdAt: any;
    }[]>;
    getRequest(id: string, req: any): Promise<{
        id: any;
        createdBy: any;
        region: any;
        title: any;
        description: any;
        preferredStartAt: any;
        preferredEndAt: any;
        budgetCents: any;
        minScreenWidthFt: any;
        status: any;
        createdAt: any;
    }>;
    updateRequest(id: string, body: unknown, req: any): Promise<{
        id: any;
        createdBy: any;
        region: any;
        title: any;
        description: any;
        preferredStartAt: any;
        preferredEndAt: any;
        budgetCents: any;
        minScreenWidthFt: any;
        status: any;
        createdAt: any;
    }>;
    getRequestOffers(id: string, req: any): Promise<{
        offers: {
            slot: {
                id: string;
                startAt: string;
                endAt: string;
                truck: {
                    nickname: string;
                };
            };
            id: any;
            requestId: any;
            slotId: any;
            createdBy: any;
            amountCents: any;
            currency: any;
            terms: any;
            status: any;
            expiresAt: any;
            createdAt: any;
        }[];
        total: number;
    }>;
    deleteRequest(id: string, req: any): Promise<void>;
}
//# sourceMappingURL=requests.controller.d.ts.map