import { CreateTruckDto } from '@led-billboard/shared';
export declare class TrucksService {
    createTruck(dto: CreateTruckDto, userId: string, userRole: string): Promise<{
        id: string;
        orgId: string;
        nickname: string;
        plateNumber: string;
        screenSizeFt: string;
        baseRegion: string;
        createdAt: string;
    }>;
    listTrucks(): Promise<{
        id: string;
        orgId: string;
        nickname: string;
        plateNumber: string;
        screenSizeFt: string;
        baseRegion: string;
        createdAt: string;
    }[]>;
}
//# sourceMappingURL=trucks.service.d.ts.map