import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db, bookings, availabilitySlots, trucks, orgs, users, orgMembers } from '@led-billboard/db';
import { eq, and, desc, inArray } from 'drizzle-orm';

export interface BookingDetails {
    id: string;
    slotId: string;
    acceptedOfferId: string | null;
    operatorOrgId: string;
    brokerUserId: string;
    driverUserId: string | null;
    status: string;
    amountCents: number;
    depositCents: number;
    depositPaidAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    createdAt: string;
    updatedAt: string;
    slot: {
        id: string;
        startAt: string;
        endAt: string;
        truck: {
            id: string;
            nickname: string | null;
            plateNumber: string | null;
        } | null;
    } | null;
    operatorOrg: {
        id: string;
        name: string;
    } | null;
    brokerUser: {
        id: string;
        displayName: string | null;
    } | null;
    driver: {
        id: string;
        displayName: string | null;
    } | null;
}

export interface BookingSummary {
    id: string;
    status: string;
    amountCents: number;
    depositCents: number;
    createdAt: string;
    updatedAt: string;
    slot: {
        id: string;
        startAt: string;
        endAt: string;
        region: string;
        truck: {
            id: string;
            nickname: string | null;
            plateNumber: string | null;
        } | null;
    } | null;
    operatorOrg: {
        id: string;
        name: string;
    } | null;
}

interface BookingSummaryRow {
    id: string;
    status: string;
    amountCents: number;
    depositCents: number;
    createdAt: Date;
    updatedAt: Date;
    slotId: string;
    slotStartAt: Date | null;
    slotEndAt: Date | null;
    slotRegion: string | null;
    truckId: string | null;
    truckNickname: string | null;
    truckPlateNumber: string | null;
    operatorOrgId: string;
    operatorOrgName: string | null;
}

@Injectable()
export class BookingsService {
    async listBookings(userId: string, userRole: string): Promise<BookingSummary[]> {
        const baseSelect = {
            id: bookings.id,
            status: bookings.status,
            amountCents: bookings.amountCents,
            depositCents: bookings.depositCents,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            slotId: bookings.slotId,
            slotStartAt: availabilitySlots.startAt,
            slotEndAt: availabilitySlots.endAt,
            slotRegion: availabilitySlots.region,
            truckId: trucks.id,
            truckNickname: trucks.nickname,
            truckPlateNumber: trucks.plateNumber,
            operatorOrgId: bookings.operatorOrgId,
            operatorOrgName: orgs.name,
        };

        if (userRole === 'broker') {
            const result = await db
                .select(baseSelect)
                .from(bookings)
                .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
                .leftJoin(trucks, eq(availabilitySlots.truckId, trucks.id))
                .leftJoin(orgs, eq(bookings.operatorOrgId, orgs.id))
                .where(eq(bookings.brokerUserId, userId))
                .orderBy(desc(bookings.createdAt));

            return result.map((row) =>
                this.formatBookingSummary(row as BookingSummaryRow)
            );
        }

        if (userRole === 'operator') {
            const memberships = await db
                .select({ orgId: orgMembers.orgId })
                .from(orgMembers)
                .where(
                    and(
                        eq(orgMembers.userId, userId),
                        eq(orgMembers.role, 'operator')
                    )
                );

            const operatorOrgIds = memberships.map((membership) => membership.orgId);
            if (operatorOrgIds.length === 0) {
                return [];
            }

            const result = await db
                .select(baseSelect)
                .from(bookings)
                .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
                .leftJoin(trucks, eq(availabilitySlots.truckId, trucks.id))
                .leftJoin(orgs, eq(bookings.operatorOrgId, orgs.id))
                .where(inArray(bookings.operatorOrgId, operatorOrgIds))
                .orderBy(desc(bookings.createdAt));

            return result.map((row) =>
                this.formatBookingSummary(row as BookingSummaryRow)
            );
        }

        if (userRole === 'driver') {
            const result = await db
                .select(baseSelect)
                .from(bookings)
                .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
                .leftJoin(trucks, eq(availabilitySlots.truckId, trucks.id))
                .leftJoin(orgs, eq(bookings.operatorOrgId, orgs.id))
                .where(eq(bookings.driverUserId, userId))
                .orderBy(desc(bookings.createdAt));

            return result.map((row) =>
                this.formatBookingSummary(row as BookingSummaryRow)
            );
        }

        return [];
    }

    /**
     * Get booking details by ID
     * Migrated from Next.js route: GET /api/v1/bookings/:id
     */
    async getBookingById(bookingId: string, userId: string, userRole: string): Promise<BookingDetails> {
        // Query booking with all related data using joins
        const result = await db
            .select({
                // Booking fields
                id: bookings.id,
                slotId: bookings.slotId,
                acceptedOfferId: bookings.acceptedOfferId,
                operatorOrgId: bookings.operatorOrgId,
                brokerUserId: bookings.brokerUserId,
                driverUserId: bookings.driverUserId,
                status: bookings.status,
                amountCents: bookings.amountCents,
                depositCents: bookings.depositCents,
                depositPaidAt: bookings.depositPaidAt,
                startedAt: bookings.startedAt,
                completedAt: bookings.completedAt,
                cancelledAt: bookings.cancelledAt,
                cancellationReason: bookings.cancellationReason,
                createdAt: bookings.createdAt,
                updatedAt: bookings.updatedAt,
                // Slot fields
                slotStartAt: availabilitySlots.startAt,
                slotEndAt: availabilitySlots.endAt,
                // Truck fields
                truckId: trucks.id,
                truckNickname: trucks.nickname,
                truckPlateNumber: trucks.plateNumber,
                // Operator org fields
                operatorOrgName: orgs.name,
                // Broker user fields
                brokerDisplayName: users.displayName,
            })
            .from(bookings)
            .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
            .leftJoin(trucks, eq(availabilitySlots.truckId, trucks.id))
            .leftJoin(orgs, eq(bookings.operatorOrgId, orgs.id))
            .leftJoin(users, eq(bookings.brokerUserId, users.id))
            .where(eq(bookings.id, bookingId))
            .limit(1);

        // Check if booking exists
        if (result.length === 0) {
            throw new NotFoundException('Booking not found');
        }

        const booking = result[0];

        // Authorization: broker who created the booking OR operator who is a member of the operator org
        const isBroker = userId === booking.brokerUserId;
        let isOperatorMember = false;
        const isAssignedDriver =
            userRole === 'driver' && booking.driverUserId === userId;

        if (!isBroker && userRole === 'operator' && booking.operatorOrgId) {
            // Check if the operator is a member of the operator org
            const [membership] = await db
                .select({
                    id: orgMembers.id,
                })
                .from(orgMembers)
                .where(
                    and(
                        eq(orgMembers.orgId, booking.operatorOrgId),
                        eq(orgMembers.userId, userId)
                    )
                )
                .limit(1);

            isOperatorMember = !!membership;
        }

        if (!isBroker && !isOperatorMember && !isAssignedDriver) {
            throw new ForbiddenException('You do not have permission to view this booking');
        }

        // Query driver separately (if exists)
        let driverData = null;
        if (booking.driverUserId) {
            const [driver] = await db
                .select({
                    id: users.id,
                    displayName: users.displayName,
                })
                .from(users)
                .where(eq(users.id, booking.driverUserId))
                .limit(1);

            if (driver) {
                driverData = {
                    id: driver.id,
                    displayName: driver.displayName,
                };
            }
        }

        // Return booking matching API contract response shape
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

    private formatBookingSummary(row: BookingSummaryRow): BookingSummary {
        return {
            id: row.id,
            status: row.status,
            amountCents: row.amountCents,
            depositCents: row.depositCents,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            slot:
                row.slotStartAt && row.slotEndAt && row.slotRegion
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
}
