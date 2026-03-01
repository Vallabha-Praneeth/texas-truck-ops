"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let BookingsService = class BookingsService {
    async listBookings(userId, userRole) {
        const baseSelect = {
            id: db_1.bookings.id,
            status: db_1.bookings.status,
            amountCents: db_1.bookings.amountCents,
            depositCents: db_1.bookings.depositCents,
            createdAt: db_1.bookings.createdAt,
            updatedAt: db_1.bookings.updatedAt,
            slotId: db_1.bookings.slotId,
            slotStartAt: db_1.availabilitySlots.startAt,
            slotEndAt: db_1.availabilitySlots.endAt,
            slotRegion: db_1.availabilitySlots.region,
            truckId: db_1.trucks.id,
            truckNickname: db_1.trucks.nickname,
            truckPlateNumber: db_1.trucks.plateNumber,
            operatorOrgId: db_1.bookings.operatorOrgId,
            operatorOrgName: db_1.orgs.name,
        };
        if (userRole === 'broker') {
            const result = await db_1.db
                .select(baseSelect)
                .from(db_1.bookings)
                .leftJoin(db_1.availabilitySlots, (0, drizzle_orm_1.eq)(db_1.bookings.slotId, db_1.availabilitySlots.id))
                .leftJoin(db_1.trucks, (0, drizzle_orm_1.eq)(db_1.availabilitySlots.truckId, db_1.trucks.id))
                .leftJoin(db_1.orgs, (0, drizzle_orm_1.eq)(db_1.bookings.operatorOrgId, db_1.orgs.id))
                .where((0, drizzle_orm_1.eq)(db_1.bookings.brokerUserId, userId))
                .orderBy((0, drizzle_orm_1.desc)(db_1.bookings.createdAt));
            return result.map((row) => this.formatBookingSummary(row));
        }
        if (userRole === 'operator') {
            const memberships = await db_1.db
                .select({ orgId: db_1.orgMembers.orgId })
                .from(db_1.orgMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId), (0, drizzle_orm_1.eq)(db_1.orgMembers.role, 'operator')));
            const operatorOrgIds = memberships.map((membership) => membership.orgId);
            if (operatorOrgIds.length === 0) {
                return [];
            }
            const result = await db_1.db
                .select(baseSelect)
                .from(db_1.bookings)
                .leftJoin(db_1.availabilitySlots, (0, drizzle_orm_1.eq)(db_1.bookings.slotId, db_1.availabilitySlots.id))
                .leftJoin(db_1.trucks, (0, drizzle_orm_1.eq)(db_1.availabilitySlots.truckId, db_1.trucks.id))
                .leftJoin(db_1.orgs, (0, drizzle_orm_1.eq)(db_1.bookings.operatorOrgId, db_1.orgs.id))
                .where((0, drizzle_orm_1.inArray)(db_1.bookings.operatorOrgId, operatorOrgIds))
                .orderBy((0, drizzle_orm_1.desc)(db_1.bookings.createdAt));
            return result.map((row) => this.formatBookingSummary(row));
        }
        if (userRole === 'driver') {
            const result = await db_1.db
                .select(baseSelect)
                .from(db_1.bookings)
                .leftJoin(db_1.availabilitySlots, (0, drizzle_orm_1.eq)(db_1.bookings.slotId, db_1.availabilitySlots.id))
                .leftJoin(db_1.trucks, (0, drizzle_orm_1.eq)(db_1.availabilitySlots.truckId, db_1.trucks.id))
                .leftJoin(db_1.orgs, (0, drizzle_orm_1.eq)(db_1.bookings.operatorOrgId, db_1.orgs.id))
                .where((0, drizzle_orm_1.eq)(db_1.bookings.driverUserId, userId))
                .orderBy((0, drizzle_orm_1.desc)(db_1.bookings.createdAt));
            return result.map((row) => this.formatBookingSummary(row));
        }
        return [];
    }
    async getBookingById(bookingId, userId, userRole) {
        const result = await db_1.db
            .select({
            id: db_1.bookings.id,
            slotId: db_1.bookings.slotId,
            acceptedOfferId: db_1.bookings.acceptedOfferId,
            operatorOrgId: db_1.bookings.operatorOrgId,
            brokerUserId: db_1.bookings.brokerUserId,
            driverUserId: db_1.bookings.driverUserId,
            status: db_1.bookings.status,
            amountCents: db_1.bookings.amountCents,
            depositCents: db_1.bookings.depositCents,
            depositPaidAt: db_1.bookings.depositPaidAt,
            startedAt: db_1.bookings.startedAt,
            completedAt: db_1.bookings.completedAt,
            cancelledAt: db_1.bookings.cancelledAt,
            cancellationReason: db_1.bookings.cancellationReason,
            createdAt: db_1.bookings.createdAt,
            updatedAt: db_1.bookings.updatedAt,
            slotStartAt: db_1.availabilitySlots.startAt,
            slotEndAt: db_1.availabilitySlots.endAt,
            truckId: db_1.trucks.id,
            truckNickname: db_1.trucks.nickname,
            truckPlateNumber: db_1.trucks.plateNumber,
            operatorOrgName: db_1.orgs.name,
            brokerDisplayName: db_1.users.displayName,
        })
            .from(db_1.bookings)
            .leftJoin(db_1.availabilitySlots, (0, drizzle_orm_1.eq)(db_1.bookings.slotId, db_1.availabilitySlots.id))
            .leftJoin(db_1.trucks, (0, drizzle_orm_1.eq)(db_1.availabilitySlots.truckId, db_1.trucks.id))
            .leftJoin(db_1.orgs, (0, drizzle_orm_1.eq)(db_1.bookings.operatorOrgId, db_1.orgs.id))
            .leftJoin(db_1.users, (0, drizzle_orm_1.eq)(db_1.bookings.brokerUserId, db_1.users.id))
            .where((0, drizzle_orm_1.eq)(db_1.bookings.id, bookingId))
            .limit(1);
        if (result.length === 0) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const booking = result[0];
        const isBroker = userId === booking.brokerUserId;
        let isOperatorMember = false;
        const isAssignedDriver = userRole === 'driver' && booking.driverUserId === userId;
        if (!isBroker && userRole === 'operator' && booking.operatorOrgId) {
            const [membership] = await db_1.db
                .select({
                id: db_1.orgMembers.id,
            })
                .from(db_1.orgMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, booking.operatorOrgId), (0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId)))
                .limit(1);
            isOperatorMember = !!membership;
        }
        if (!isBroker && !isOperatorMember && !isAssignedDriver) {
            throw new common_1.ForbiddenException('You do not have permission to view this booking');
        }
        let driverData = null;
        if (booking.driverUserId) {
            const [driver] = await db_1.db
                .select({
                id: db_1.users.id,
                displayName: db_1.users.displayName,
            })
                .from(db_1.users)
                .where((0, drizzle_orm_1.eq)(db_1.users.id, booking.driverUserId))
                .limit(1);
            if (driver) {
                driverData = {
                    id: driver.id,
                    displayName: driver.displayName,
                };
            }
        }
        return {
            id: booking.id,
            slotId: booking.slotId,
            acceptedOfferId: booking.acceptedOfferId,
            operatorOrgId: booking.operatorOrgId,
            brokerUserId: booking.brokerUserId,
            driverUserId: booking.driverUserId,
            status: booking.status,
            amountCents: booking.amountCents,
            depositCents: booking.depositCents,
            depositPaidAt: booking.depositPaidAt ? booking.depositPaidAt.toISOString() : null,
            startedAt: booking.startedAt ? booking.startedAt.toISOString() : null,
            completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
            cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
            cancellationReason: booking.cancellationReason,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            slot: booking.slotStartAt && booking.slotEndAt ? {
                id: booking.slotId,
                startAt: booking.slotStartAt.toISOString(),
                endAt: booking.slotEndAt.toISOString(),
                truck: booking.truckId ? {
                    id: booking.truckId,
                    nickname: booking.truckNickname,
                    plateNumber: booking.truckPlateNumber,
                } : null,
            } : null,
            operatorOrg: booking.operatorOrgName ? {
                id: booking.operatorOrgId,
                name: booking.operatorOrgName,
            } : null,
            brokerUser: booking.brokerDisplayName ? {
                id: booking.brokerUserId,
                displayName: booking.brokerDisplayName,
            } : null,
            driver: driverData,
        };
    }
    formatBookingSummary(row) {
        return {
            id: row.id,
            status: row.status,
            amountCents: row.amountCents,
            depositCents: row.depositCents,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            slot: row.slotStartAt && row.slotEndAt && row.slotRegion
                ? {
                    id: row.slotId,
                    startAt: row.slotStartAt.toISOString(),
                    endAt: row.slotEndAt.toISOString(),
                    region: row.slotRegion,
                    truck: row.truckId
                        ? {
                            id: row.truckId,
                            nickname: row.truckNickname,
                            plateNumber: row.truckPlateNumber,
                        }
                        : null,
                }
                : null,
            operatorOrg: row.operatorOrgName
                ? {
                    id: row.operatorOrgId,
                    name: row.operatorOrgName,
                }
                : null,
        };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)()
], BookingsService);
//# sourceMappingURL=bookings-query.service.js.map