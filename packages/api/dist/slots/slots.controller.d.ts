import { SlotsService } from './slots.service';
export declare class SlotsController {
    private slotsService;
    constructor(slotsService: SlotsService);
    createSlot(body: unknown, req: any): Promise<{
        id: string;
        truckId: string;
        startAt: string;
        endAt: string;
        region: string;
        radiusMiles: number;
        repositionAllowed: boolean;
        maxRepositionMiles: number;
        notes: string;
        isBooked: boolean;
        createdAt: string;
    }>;
    searchSlots(query: unknown): Promise<{
        id: string;
        truckId: string;
        startAt: string;
        endAt: string;
        region: string;
        radiusMiles: number;
        repositionAllowed: boolean;
        maxRepositionMiles: number;
        notes: string;
        isBooked: boolean;
        createdAt: string;
    }[]>;
    getSlot(id: string, req: any): Promise<{
        id: string;
        truckId: string;
        startAt: string;
        endAt: string;
        region: string;
        radiusMiles: number;
        repositionAllowed: boolean;
        maxRepositionMiles: number;
        notes: string;
        isBooked: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    updateSlot(id: string, body: unknown, req: any): Promise<{
        id: string;
        truckId: string;
        startAt: string;
        endAt: string;
        region: string;
        radiusMiles: number;
        repositionAllowed: boolean;
        maxRepositionMiles: number;
        notes: string;
        isBooked: boolean;
        updatedAt: string;
    }>;
    deleteSlot(id: string, req: any): Promise<void>;
}
//# sourceMappingURL=slots.controller.d.ts.map