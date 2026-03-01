import { CreateRequestDto, UpdateRequestDto } from '@led-billboard/shared';
export declare class RequestsService {
    createRequest(dto: CreateRequestDto, userId: string): Promise<{
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
    listRequests(filters?: {
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
    getRequest(requestId: string, userId: string, userRole: string): Promise<{
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
    updateRequest(requestId: string, dto: UpdateRequestDto, userId: string): Promise<{
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
    deleteRequest(requestId: string, userId: string): Promise<void>;
    getRequestOffers(requestId: string, userId: string, userRole: string): Promise<{
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
    private formatOffer;
    private formatRequest;
}
//# sourceMappingURL=requests.service.d.ts.map