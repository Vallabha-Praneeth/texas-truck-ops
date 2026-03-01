import { ConfigService } from '@nestjs/config';
import { DriversService } from './drivers.service';
export declare class DriversController {
    private readonly configService;
    private readonly driversService;
    constructor(configService: ConfigService, driversService: DriversService);
    updateMyLocation(req: any, body: unknown): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        lastSeenAt: string;
        createdAt: string;
        updatedAt: string;
    }>;
    getMyLocation(req: any): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        lastSeenAt: string;
        createdAt: string;
        updatedAt: string;
    }>;
    getNearbyDrivers(internalKey: string | undefined, latitude: string, longitude: string, radiusMiles?: string, limit?: string): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        distanceMiles: number;
        lastSeenAt: string;
        updatedAt: string;
    }[]>;
}
//# sourceMappingURL=drivers.controller.d.ts.map