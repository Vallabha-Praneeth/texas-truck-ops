import { TrucksService } from './trucks.service';
export declare class TrucksController {
    private trucksService;
    constructor(trucksService: TrucksService);
    createTruck(body: unknown, req: any): Promise<{
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
//# sourceMappingURL=trucks.controller.d.ts.map