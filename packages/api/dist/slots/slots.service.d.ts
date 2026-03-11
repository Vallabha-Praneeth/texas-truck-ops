import { CreateSlotDto, UpdateSlotDto, SearchSlotsDto } from '@led-billboard/shared';
export declare class SlotsService {
    createSlot(dto: CreateSlotDto, userId: string, userRole: string): Promise<{
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
    searchSlots(_filters: SearchSlotsDto): Promise<{
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
    getSlot(slotId: string, userId: string, userRole: string): Promise<{
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
    updateSlot(slotId: string, dto: UpdateSlotDto, userId: string, userRole: string): Promise<{
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
    deleteSlot(slotId: string, userId: string, userRole: string): Promise<void>;
    private verifyTruckOwnership;
}
//# sourceMappingURL=slots.service.d.ts.map