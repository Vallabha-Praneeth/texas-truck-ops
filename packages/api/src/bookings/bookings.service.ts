import { Injectable, Optional } from '@nestjs/common';
import { db } from '@led-billboard/db';
import {
    bookings,
    availabilitySlots,
    offers,
    trucks,
    requests,
    users,
} from '@led-billboard/db';
import { eq, and } from 'drizzle-orm';
import { RealtimeService } from '../realtime/realtime.service';

export enum BookingStatus {
    PENDING_DEPOSIT = 'pending_deposit',
    CONFIRMED = 'confirmed',
    RUNNING = 'running',
    AWAITING_REVIEW = 'awaiting_review',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed',
}

@Injectable()
export class BookingService {
    constructor(
        @Optional()
        private readonly realtimeService?: RealtimeService
    ) {}

    /**
     * Accept an offer and create a booking with slot locking
     * This prevents double-booking through:
     * 1. Transaction isolation
     * 2. Unique constraint on bookings.slot_id
     * 3. Atomic slot.isBooked update
     */
    async acceptOffer(offerId: string, _userId: string) {
        const createdBooking = await db.transaction(async (tx) => {
            // 1. Get the offer with slot info
            const [offer] = await tx
                .select()
                .from(offers)
                .where(eq(offers.id, offerId))
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

            // 2. Check if slot is already booked (race condition check)
            const [slot] = await tx
                .select()
                .from(availabilitySlots)
                .where(eq(availabilitySlots.id, offer.slotId))
                .limit(1);

            if (!slot) {
                throw new Error('Slot not found');
            }

            if (slot.isBooked) {
                throw new Error('Slot is already booked');
            }

            const [truck] = await tx
                .select({
                    id: trucks.id,
                    orgId: trucks.orgId,
                })
                .from(trucks)
                .where(eq(trucks.id, slot.truckId))
                .limit(1);

            if (!truck) {
                throw new Error('Truck not found');
            }

            let brokerUserId = offer.createdBy;
            if (offer.requestId) {
                const [request] = await tx
                    .select({
                        id: requests.id,
                        createdBy: requests.createdBy,
                    })
                    .from(requests)
                    .where(eq(requests.id, offer.requestId))
                    .limit(1);

                if (!request) {
                    throw new Error('Request not found');
                }

                brokerUserId = request.createdBy;
            }

            // 3. Mark slot as booked (atomic update)
            await tx
                .update(availabilitySlots)
                .set({ isBooked: true, updatedAt: new Date() })
                .where(
                    and(
                        eq(availabilitySlots.id, offer.slotId),
                        eq(availabilitySlots.isBooked, false) // Ensure it's still available
                    )
                );

            // 4. Update offer status
            await tx
                .update(offers)
                .set({ status: 'accepted', updatedAt: new Date() })
                .where(eq(offers.id, offerId));

            // 5. Create booking (unique constraint on slot_id prevents duplicates)
            const depositAmount = Math.floor(offer.amountCents * 0.3); // 30% deposit

            const [booking] = await tx
                .insert(bookings)
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

    /**
     * Transition booking through state machine
     * Valid transitions:
     * pending_deposit -> confirmed (on deposit payment)
     * confirmed -> running (driver starts)
     * running -> awaiting_review (driver submits proof)
     * awaiting_review -> completed (broker approves)
     * any -> cancelled (with reason)
     * any -> disputed (escalation)
     */
    async transitionBookingStatus(
        bookingId: string,
        newStatus: BookingStatus,
        metadata?: {
            depositPaidAt?: Date;
            startedAt?: Date;
            completedAt?: Date;
            cancelledAt?: Date;
            cancellationReason?: string;
        }
    ) {
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Validate state transition
        this.validateTransition(booking.status, newStatus);

        // Update booking
        const updateData: any = {
            status: newStatus,
            updatedAt: new Date(),
            ...metadata,
        };

        const [updated] = await db
            .update(bookings)
            .set(updateData)
            .where(eq(bookings.id, bookingId))
            .returning();

        this.emitBookingStatusChanged(updated, booking.status, newStatus);

        return updated;
    }

    async assignDriverToBooking(bookingId: string, driverUserId: string) {
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            throw new Error('Booking not found');
        }

        const [driver] = await db
            .select({
                id: users.id,
                primaryRole: users.primaryRole,
            })
            .from(users)
            .where(eq(users.id, driverUserId))
            .limit(1);

        if (!driver) {
            throw new Error('Driver user not found');
        }

        if (driver.primaryRole !== 'driver') {
            throw new Error('Assigned user must have driver role');
        }

        const [updated] = await db
            .update(bookings)
            .set({
                driverUserId,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        this.emitDriverAssigned(updated);

        return updated;
    }

    private validateTransition(
        currentStatus: string,
        newStatus: BookingStatus
    ): void {
        const validTransitions: Record<string, BookingStatus[]> = {
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
            [BookingStatus.COMPLETED]: [], // Terminal state
            [BookingStatus.CANCELLED]: [], // Terminal state
            [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        };

        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            throw new Error(
                `Invalid transition from ${currentStatus} to ${newStatus}`
            );
        }
    }

    /**
     * Check for slot overlap for a given truck
     * Prevents creating overlapping slots for the same truck
     */
    async checkSlotOverlap(
        truckId: string,
        startAt: Date,
        endAt: Date,
        excludeSlotId?: string
    ): Promise<boolean> {
        const query = db
            .select()
            .from(availabilitySlots)
            .where(
                and(
                    eq(availabilitySlots.truckId, truckId),
                    // Check for time overlap: (start1 < end2) AND (end1 > start2)
                    // This SQL will be: start_time < $endTime AND end_time > $startTime
                )
            );

        // Note: Drizzle doesn't have built-in overlap operators, so we'd need raw SQL
        // For now, fetch all slots for the truck and check in memory
        const slots = await query;

        const overlapping = slots.filter((slot) => {
            if (excludeSlotId && slot.id === excludeSlotId) {
                return false;
            }
            // Check if time ranges overlap
            return slot.startAt < endAt && slot.endAt > startAt;
        });

        return overlapping.length > 0;
    }

    private emitBookingCreated(booking: typeof bookings.$inferSelect) {
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

    private emitBookingStatusChanged(
        booking: typeof bookings.$inferSelect,
        previousStatus: string,
        newStatus: string
    ) {
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

    private emitDriverAssigned(booking: typeof bookings.$inferSelect) {
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
}
