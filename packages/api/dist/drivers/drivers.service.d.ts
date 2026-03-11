import { SearchNearbyDriversDto, UpdateDriverLocationDto } from '@led-billboard/shared';
import { RealtimeService } from '../realtime/realtime.service';
export declare class DriversService {
    private readonly realtimeService;
    constructor(realtimeService: RealtimeService);
    getMyLocation(userId: string, role: string): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        lastSeenAt: string;
        createdAt: string;
        updatedAt: string;
    }>;
    updateMyLocation(userId: string, role: string, dto: UpdateDriverLocationDto): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        lastSeenAt: string;
        createdAt: string;
        updatedAt: string;
    }>;
    searchNearbyDrivers(dto: SearchNearbyDriversDto): Promise<{
        userId: string;
        bookingId: string;
        isOnline: boolean;
        latitude: number;
        longitude: number;
        distanceMiles: number;
        lastSeenAt: string;
        updatedAt: string;
    }[]>;
    private getAndValidateBooking;
    private assertDriverRole;
    private serializePresence;
    private calculateDistanceMiles;
    private toRadians;
}
//# sourceMappingURL=drivers.service.d.ts.map