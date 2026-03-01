"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
const realtime_service_1 = require("../realtime/realtime.service");
let DriversService = class DriversService {
    constructor(realtimeService) {
        this.realtimeService = realtimeService;
    }
    async getMyLocation(userId, role) {
        this.assertDriverRole(role);
        const [presence] = await db_1.db
            .select()
            .from(db_1.driverPresence)
            .where((0, drizzle_orm_1.eq)(db_1.driverPresence.userId, userId))
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
    async updateMyLocation(userId, role, dto) {
        this.assertDriverRole(role);
        const booking = dto.bookingId === undefined || dto.bookingId === null
            ? null
            : await this.getAndValidateBooking(dto.bookingId, userId);
        const [upserted] = await db_1.db
            .insert(db_1.driverPresence)
            .values({
            userId,
            bookingId: dto.bookingId ?? null,
            isOnline: dto.isOnline ?? true,
            latitude: dto.latitude,
            longitude: dto.longitude,
            lastSeenAt: new Date(),
        })
            .onConflictDoUpdate({
            target: db_1.driverPresence.userId,
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
    async searchNearbyDrivers(dto) {
        const rows = await db_1.db
            .select()
            .from(db_1.driverPresence)
            .where((0, drizzle_orm_1.eq)(db_1.driverPresence.isOnline, true));
        const nearby = rows
            .filter((row) => typeof row.latitude === 'number' &&
            typeof row.longitude === 'number')
            .map((row) => ({
            ...row,
            distanceMiles: this.calculateDistanceMiles(dto.latitude, dto.longitude, row.latitude, row.longitude),
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
    async getAndValidateBooking(bookingId, driverUserId) {
        const [booking] = await db_1.db
            .select({
            id: db_1.bookings.id,
            driverUserId: db_1.bookings.driverUserId,
            brokerUserId: db_1.bookings.brokerUserId,
            operatorOrgId: db_1.bookings.operatorOrgId,
        })
            .from(db_1.bookings)
            .where((0, drizzle_orm_1.eq)(db_1.bookings.id, bookingId))
            .limit(1);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.driverUserId !== driverUserId) {
            throw new common_1.ForbiddenException('Driver is not assigned to this booking');
        }
        return booking;
    }
    assertDriverRole(role) {
        if (role !== 'driver') {
            throw new common_1.ForbiddenException('Only drivers can access driver location endpoints');
        }
    }
    serializePresence(presence) {
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
    calculateDistanceMiles(latitudeA, longitudeA, latitudeB, longitudeB) {
        const earthRadiusMiles = 3958.8;
        const latitudeDelta = this.toRadians(latitudeB - latitudeA);
        const longitudeDelta = this.toRadians(longitudeB - longitudeA);
        const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
            Math.cos(this.toRadians(latitudeA)) *
                Math.cos(this.toRadians(latitudeB)) *
                Math.sin(longitudeDelta / 2) *
                Math.sin(longitudeDelta / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMiles * c;
    }
    toRadians(value) {
        return (value * Math.PI) / 180;
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService])
], DriversService);
//# sourceMappingURL=drivers.service.js.map