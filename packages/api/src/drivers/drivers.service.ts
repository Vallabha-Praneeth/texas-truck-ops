import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    db,
    bookings,
    driverPresence,
} from '@led-billboard/db';
import {
    SearchNearbyDriversDto,
    UpdateDriverLocationDto,
} from '@led-billboard/shared';
import { eq } from 'drizzle-orm';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class DriversService {
    constructor(private readonly realtimeService: RealtimeService) {}

    async getMyLocation(userId: string, role: string) {
        this.assertDriverRole(role);

        const [presence] = await db
            .select()
            .from(driverPresence)
            .where(eq(driverPresence.userId, userId))
            .limit(1);

        if (!presence) {
            return {
                userId,
                bookingId: null,
                isOnline: false,
                latitude: null,
                longitude: null,
                lastSeenAt: null,
                createdAt: null,
                updatedAt: null,
            };
        }

        return this.serializePresence(presence);
    }

    async updateMyLocation(
        userId: string,
        role: string,
        dto: UpdateDriverLocationDto
    ) {
        this.assertDriverRole(role);

        const booking =
            dto.bookingId === undefined || dto.bookingId === null
                ? null
                : await this.getAndValidateBooking(dto.bookingId, userId);

        const [upserted] = await db
            .insert(driverPresence)
            .values({
                userId,
                bookingId: dto.bookingId ?? null,
                isOnline: dto.isOnline ?? true,
                latitude: dto.latitude,
                longitude: dto.longitude,
                lastSeenAt: new Date(),
            })
            .onConflictDoUpdate({
                target: driverPresence.userId,
                set: {
                    bookingId: dto.bookingId ?? null,
                    isOnline: dto.isOnline ?? true,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    lastSeenAt: new Date(),
                    updatedAt: new Date(),
                },
            })
            .returning();

        const payload = {
            userId: upserted.userId,
            bookingId: upserted.bookingId,
            isOnline: upserted.isOnline,
            latitude: upserted.latitude,
            longitude: upserted.longitude,
            lastSeenAt: upserted.lastSeenAt.toISOString(),
        };

        this.realtimeService.emit({
            channel: `user:${upserted.userId}`,
            event: 'driver:location_updated',
            payload,
            source: 'domain',
        });

        if (booking) {
            this.realtimeService.emit({
                channel: `booking:${booking.id}`,
                event: 'driver:location_updated',
                payload,
                source: 'domain',
            });

            this.realtimeService.emit({
                channel: `user:${booking.brokerUserId}`,
                event: 'driver:location_updated',
                payload,
                source: 'domain',
            });

            this.realtimeService.emit({
                channel: `org:${booking.operatorOrgId}`,
                event: 'driver:location_updated',
                payload,
                source: 'domain',
            });
        }

        return this.serializePresence(upserted);
    }

    async searchNearbyDrivers(dto: SearchNearbyDriversDto) {
        const rows = await db
            .select()
            .from(driverPresence)
            .where(eq(driverPresence.isOnline, true));

        const nearby = rows
            .filter(
                (row) =>
                    typeof row.latitude === 'number' &&
                    typeof row.longitude === 'number'
            )
            .map((row) => ({
                ...row,
                distanceMiles: this.calculateDistanceMiles(
                    dto.latitude,
                    dto.longitude,
                    row.latitude as number,
                    row.longitude as number
                ),
            }))
            .filter((row) => row.distanceMiles <= dto.radiusMiles)
            .sort((a, b) => a.distanceMiles - b.distanceMiles)
            .slice(0, dto.limit);

        return nearby.map((row) => ({
            userId: row.userId,
            bookingId: row.bookingId,
            isOnline: row.isOnline,
            latitude: row.latitude,
            longitude: row.longitude,
            distanceMiles: Number(row.distanceMiles.toFixed(2)),
            lastSeenAt: row.lastSeenAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        }));
    }

    private async getAndValidateBooking(bookingId: string, driverUserId: string) {
        const [booking] = await db
            .select({
                id: bookings.id,
                driverUserId: bookings.driverUserId,
                brokerUserId: bookings.brokerUserId,
                operatorOrgId: bookings.operatorOrgId,
            })
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.driverUserId !== driverUserId) {
            throw new ForbiddenException(
                'Driver is not assigned to this booking'
            );
        }

        return booking;
    }

    private assertDriverRole(role: string) {
        if (role !== 'driver') {
            throw new ForbiddenException(
                'Only drivers can access driver location endpoints'
            );
        }
    }

    private serializePresence(presence: typeof driverPresence.$inferSelect) {
        return {
            userId: presence.userId,
            bookingId: presence.bookingId,
            isOnline: presence.isOnline,
            latitude: presence.latitude,
            longitude: presence.longitude,
            lastSeenAt: presence.lastSeenAt.toISOString(),
            createdAt: presence.createdAt.toISOString(),
            updatedAt: presence.updatedAt.toISOString(),
        };
    }

    private calculateDistanceMiles(
        latitudeA: number,
        longitudeA: number,
        latitudeB: number,
        longitudeB: number
    ) {
        const earthRadiusMiles = 3958.8;
        const latitudeDelta = this.toRadians(latitudeB - latitudeA);
        const longitudeDelta = this.toRadians(longitudeB - longitudeA);
        const a =
            Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
            Math.cos(this.toRadians(latitudeA)) *
                Math.cos(this.toRadians(latitudeB)) *
                Math.sin(longitudeDelta / 2) *
                Math.sin(longitudeDelta / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMiles * c;
    }

    private toRadians(value: number) {
        return (value * Math.PI) / 180;
    }
}
