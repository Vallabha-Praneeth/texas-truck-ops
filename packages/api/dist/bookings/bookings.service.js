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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = exports.BookingStatus = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const db_2 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
const realtime_service_1 = require("../realtime/realtime.service");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING_DEPOSIT"] = "pending_deposit";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["RUNNING"] = "running";
    BookingStatus["AWAITING_REVIEW"] = "awaiting_review";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["DISPUTED"] = "disputed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
let BookingService = class BookingService {
    constructor(realtimeService) {
        this.realtimeService = realtimeService;
    }
    async acceptOffer(offerId, _userId) {
        const createdBooking = await db_1.db.transaction(async (tx) => {
            const [offer] = await tx
                .select()
                .from(db_2.offers)
                .where((0, drizzle_orm_1.eq)(db_2.offers.id, offerId))
                .limit(1);
            if (!offer) {
                throw new Error('Offer not found');
            }
            if (offer.status !== 'pending') {
                throw new Error(`Offer is ${offer.status}, cannot accept`);
            }
            if (!offer.slotId) {
                throw new Error('Offer has no slot and cannot be accepted');
            }
            const [slot] = await tx
                .select()
                .from(db_2.availabilitySlots)
                .where((0, drizzle_orm_1.eq)(db_2.availabilitySlots.id, offer.slotId))
                .limit(1);
            if (!slot) {
                throw new Error('Slot not found');
            }
            if (slot.isBooked) {
                throw new Error('Slot is already booked');
            }
            const [truck] = await tx
                .select({
                id: db_2.trucks.id,
                orgId: db_2.trucks.orgId,
            })
                .from(db_2.trucks)
                .where((0, drizzle_orm_1.eq)(db_2.trucks.id, slot.truckId))
                .limit(1);
            if (!truck) {
                throw new Error('Truck not found');
            }
            let brokerUserId = offer.createdBy;
            if (offer.requestId) {
                const [request] = await tx
                    .select({
                    id: db_2.requests.id,
                    createdBy: db_2.requests.createdBy,
                })
                    .from(db_2.requests)
                    .where((0, drizzle_orm_1.eq)(db_2.requests.id, offer.requestId))
                    .limit(1);
                if (!request) {
                    throw new Error('Request not found');
                }
                brokerUserId = request.createdBy;
            }
            await tx
                .update(db_2.availabilitySlots)
                .set({ isBooked: true, updatedAt: new Date() })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_2.availabilitySlots.id, offer.slotId), (0, drizzle_orm_1.eq)(db_2.availabilitySlots.isBooked, false)));
            await tx
                .update(db_2.offers)
                .set({ status: 'accepted', updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(db_2.offers.id, offerId));
            const depositAmount = Math.floor(offer.amountCents * 0.3);
            const [booking] = await tx
                .insert(db_2.bookings)
                .values({
                acceptedOfferId: offer.id,
                slotId: offer.slotId,
                operatorOrgId: truck.orgId,
                brokerUserId,
                amountCents: offer.amountCents,
                depositCents: depositAmount,
                status: BookingStatus.PENDING_DEPOSIT,
            })
                .returning();
            return booking;
        });
        this.emitBookingCreated(createdBooking);
        return createdBooking;
    }
    async transitionBookingStatus(bookingId, newStatus, metadata) {
        const [booking] = await db_1.db
            .select()
            .from(db_2.bookings)
            .where((0, drizzle_orm_1.eq)(db_2.bookings.id, bookingId))
            .limit(1);
        if (!booking) {
            throw new Error('Booking not found');
        }
        this.validateTransition(booking.status, newStatus);
        const updateData = {
            status: newStatus,
            updatedAt: new Date(),
            ...metadata,
        };
        const [updated] = await db_1.db
            .update(db_2.bookings)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(db_2.bookings.id, bookingId))
            .returning();
        this.emitBookingStatusChanged(updated, booking.status, newStatus);
        return updated;
    }
    async assignDriverToBooking(bookingId, driverUserId) {
        const [booking] = await db_1.db
            .select()
            .from(db_2.bookings)
            .where((0, drizzle_orm_1.eq)(db_2.bookings.id, bookingId))
            .limit(1);
        if (!booking) {
            throw new Error('Booking not found');
        }
        const [driver] = await db_1.db
            .select({
            id: db_2.users.id,
            primaryRole: db_2.users.primaryRole,
        })
            .from(db_2.users)
            .where((0, drizzle_orm_1.eq)(db_2.users.id, driverUserId))
            .limit(1);
        if (!driver) {
            throw new Error('Driver user not found');
        }
        if (driver.primaryRole !== 'driver') {
            throw new Error('Assigned user must have driver role');
        }
        const [updated] = await db_1.db
            .update(db_2.bookings)
            .set({
            driverUserId,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(db_2.bookings.id, bookingId))
            .returning();
        this.emitDriverAssigned(updated);
        return updated;
    }
    validateTransition(currentStatus, newStatus) {
        const validTransitions = {
            [BookingStatus.PENDING_DEPOSIT]: [
                BookingStatus.CONFIRMED,
                BookingStatus.CANCELLED,
            ],
            [BookingStatus.CONFIRMED]: [
                BookingStatus.RUNNING,
                BookingStatus.CANCELLED,
                BookingStatus.DISPUTED,
            ],
            [BookingStatus.RUNNING]: [
                BookingStatus.AWAITING_REVIEW,
                BookingStatus.DISPUTED,
            ],
            [BookingStatus.AWAITING_REVIEW]: [
                BookingStatus.COMPLETED,
                BookingStatus.DISPUTED,
            ],
            [BookingStatus.COMPLETED]: [],
            [BookingStatus.CANCELLED]: [],
            [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        };
        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
        }
    }
    async checkSlotOverlap(truckId, startAt, endAt, excludeSlotId) {
        const query = db_1.db
            .select()
            .from(db_2.availabilitySlots)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_2.availabilitySlots.truckId, truckId)));
        const slots = await query;
        const overlapping = slots.filter((slot) => {
            if (excludeSlotId && slot.id === excludeSlotId) {
                return false;
            }
            return slot.startAt < endAt && slot.endAt > startAt;
        });
        return overlapping.length > 0;
    }
    emitBookingCreated(booking) {
        if (!this.realtimeService) {
            return;
        }
        const payload = {
            bookingId: booking.id,
            status: booking.status,
            slotId: booking.slotId,
            acceptedOfferId: booking.acceptedOfferId,
            brokerUserId: booking.brokerUserId,
            operatorOrgId: booking.operatorOrgId,
            amountCents: booking.amountCents,
            createdAt: booking.createdAt.toISOString(),
        };
        this.realtimeService.emit({
            channel: `booking:${booking.id}`,
            event: 'booking:created',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `user:${booking.brokerUserId}`,
            event: 'booking:created',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `org:${booking.operatorOrgId}`,
            event: 'booking:created',
            payload,
            source: 'domain',
        });
    }
    emitBookingStatusChanged(booking, previousStatus, newStatus) {
        if (!this.realtimeService) {
            return;
        }
        const payload = {
            bookingId: booking.id,
            previousStatus,
            status: newStatus,
            startedAt: booking.startedAt?.toISOString() ?? null,
            completedAt: booking.completedAt?.toISOString() ?? null,
            cancelledAt: booking.cancelledAt?.toISOString() ?? null,
            updatedAt: booking.updatedAt.toISOString(),
        };
        this.realtimeService.emit({
            channel: `booking:${booking.id}`,
            event: 'booking:status_changed',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `user:${booking.brokerUserId}`,
            event: 'booking:status_changed',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `org:${booking.operatorOrgId}`,
            event: 'booking:status_changed',
            payload,
            source: 'domain',
        });
        if (booking.driverUserId) {
            this.realtimeService.emit({
                channel: `user:${booking.driverUserId}`,
                event: 'booking:status_changed',
                payload,
                source: 'domain',
            });
        }
    }
    emitDriverAssigned(booking) {
        if (!this.realtimeService) {
            return;
        }
        const payload = {
            bookingId: booking.id,
            driverUserId: booking.driverUserId,
            updatedAt: booking.updatedAt.toISOString(),
        };
        this.realtimeService.emit({
            channel: `booking:${booking.id}`,
            event: 'booking:driver_assigned',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `user:${booking.brokerUserId}`,
            event: 'booking:driver_assigned',
            payload,
            source: 'domain',
        });
        this.realtimeService.emit({
            channel: `org:${booking.operatorOrgId}`,
            event: 'booking:driver_assigned',
            payload,
            source: 'domain',
        });
        if (booking.driverUserId) {
            this.realtimeService.emit({
                channel: `user:${booking.driverUserId}`,
                event: 'booking:driver_assigned',
                payload,
                source: 'domain',
            });
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService])
], BookingService);
//# sourceMappingURL=bookings.service.js.map