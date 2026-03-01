import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { db, availabilitySlots, trucks, orgMembers } from '@led-billboard/db';
import { eq, and } from 'drizzle-orm';
import {
    CreateSlotDto,
    UpdateSlotDto,
    SearchSlotsDto,
} from '@led-billboard/shared';

@Injectable()
export class SlotsService {
    /**
     * Create a new availability slot
     * Only operators can create slots for their trucks
     */
    async createSlot(dto: CreateSlotDto, userId: string, userRole: string) {
        // Authorization: only operators can create slots
        if (userRole !== 'operator') {
            throw new ForbiddenException('Only operators can create availability slots');
        }

        // Get truck and verify ownership
        const [truck] = await db
            .select()
            .from(trucks)
            .where(eq(trucks.id, dto.truckId))
            .limit(1);

        if (!truck) {
            throw new ForbiddenException('Truck not found');
        }

        // Verify user is member of the truck's organization
        const [membership] = await db
            .select()
            .from(orgMembers)
            .where(
                and(
                    eq(orgMembers.orgId, truck.orgId),
                    eq(orgMembers.userId, userId)
                )
            )
            .limit(1);

        if (!membership) {
            throw new ForbiddenException('You do not have permission to create slots for this truck');
        }

        // Create slot
        const [newSlot] = await db
            .insert(availabilitySlots)
            .values({
                truckId: dto.truckId,
                startAt: new Date(dto.startAt),
                endAt: new Date(dto.endAt),
                region: dto.region,
                radiusMiles: dto.radiusMiles,
                repositionAllowed: dto.repositionAllowed ?? false,
                maxRepositionMiles: dto.maxRepositionMiles ?? 0,
                notes: dto.notes ?? null,
                isBooked: false,
            })
            .returning();

        return {
            id: newSlot.id,
            truckId: newSlot.truckId,
            startAt: newSlot.startAt.toISOString(),
            endAt: newSlot.endAt.toISOString(),
            region: newSlot.region,
            radiusMiles: newSlot.radiusMiles,
            repositionAllowed: newSlot.repositionAllowed,
            maxRepositionMiles: newSlot.maxRepositionMiles,
            notes: newSlot.notes,
            isBooked: newSlot.isBooked,
            createdAt: newSlot.createdAt.toISOString(),
        };
    }

    /**
     * Search for available slots
     * TODO: Add geo-based search with PostGIS
     */
    async searchSlots(_filters: SearchSlotsDto) {
        const query = db
            .select()
            .from(availabilitySlots)
            .where(eq(availabilitySlots.isBooked, false));

        // Apply filters
        // TODO: Add more sophisticated filtering

        const slots = await query.orderBy(availabilitySlots.startAt);

        return slots.map(slot => ({
            id: slot.id,
            truckId: slot.truckId,
            startAt: slot.startAt.toISOString(),
            endAt: slot.endAt.toISOString(),
            region: slot.region,
            radiusMiles: slot.radiusMiles,
            repositionAllowed: slot.repositionAllowed,
            maxRepositionMiles: slot.maxRepositionMiles,
            notes: slot.notes,
            isBooked: slot.isBooked,
            createdAt: slot.createdAt.toISOString(),
        }));
    }

    /**
     * Get a single slot by ID
     */
    async getSlot(slotId: string, userId: string, userRole: string) {
        const [slot] = await db
            .select()
            .from(availabilitySlots)
            .where(eq(availabilitySlots.id, slotId))
            .limit(1);

        if (!slot) {
            throw new NotFoundException('Slot not found');
        }

        // If operator, verify they own the truck
        if (userRole === 'operator') {
            await this.verifyTruckOwnership(slot.truckId, userId);
        }

        return {
            id: slot.id,
            truckId: slot.truckId,
            startAt: slot.startAt.toISOString(),
            endAt: slot.endAt.toISOString(),
            region: slot.region,
            radiusMiles: slot.radiusMiles,
            repositionAllowed: slot.repositionAllowed,
            maxRepositionMiles: slot.maxRepositionMiles,
            notes: slot.notes,
            isBooked: slot.isBooked,
            createdAt: slot.createdAt.toISOString(),
            updatedAt: slot.updatedAt.toISOString(),
        };
    }

    /**
     * Update a slot
     */
    async updateSlot(slotId: string, dto: UpdateSlotDto, userId: string, userRole: string) {
        // Only operators can update slots
        if (userRole !== 'operator') {
            throw new ForbiddenException('Only operators can update slots');
        }

        // Get slot and verify existence
        const [slot] = await db
            .select()
            .from(availabilitySlots)
            .where(eq(availabilitySlots.id, slotId))
            .limit(1);

        if (!slot) {
            throw new NotFoundException('Slot not found');
        }

        // Verify truck ownership
        await this.verifyTruckOwnership(slot.truckId, userId);

        // Cannot update booked slots
        if (slot.isBooked) {
            throw new ForbiddenException('Cannot update a booked slot');
        }

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (dto.startAt) updateData.startAt = new Date(dto.startAt);
        if (dto.endAt) updateData.endAt = new Date(dto.endAt);
        if (dto.region !== undefined) updateData.region = dto.region;
        if (dto.radiusMiles !== undefined) updateData.radiusMiles = dto.radiusMiles;
        if (dto.repositionAllowed !== undefined) updateData.repositionAllowed = dto.repositionAllowed;
        if (dto.maxRepositionMiles !== undefined) updateData.maxRepositionMiles = dto.maxRepositionMiles;
        if (dto.notes !== undefined) updateData.notes = dto.notes;

        // Update slot
        const [updatedSlot] = await db
            .update(availabilitySlots)
            .set(updateData)
            .where(eq(availabilitySlots.id, slotId))
            .returning();

        return {
            id: updatedSlot.id,
            truckId: updatedSlot.truckId,
            startAt: updatedSlot.startAt.toISOString(),
            endAt: updatedSlot.endAt.toISOString(),
            region: updatedSlot.region,
            radiusMiles: updatedSlot.radiusMiles,
            repositionAllowed: updatedSlot.repositionAllowed,
            maxRepositionMiles: updatedSlot.maxRepositionMiles,
            notes: updatedSlot.notes,
            isBooked: updatedSlot.isBooked,
            updatedAt: updatedSlot.updatedAt.toISOString(),
        };
    }

    /**
     * Delete a slot
     */
    async deleteSlot(slotId: string, userId: string, userRole: string) {
        // Only operators can delete slots
        if (userRole !== 'operator') {
            throw new ForbiddenException('Only operators can delete slots');
        }

        // Get slot
        const [slot] = await db
            .select()
            .from(availabilitySlots)
            .where(eq(availabilitySlots.id, slotId))
            .limit(1);

        if (!slot) {
            throw new NotFoundException('Slot not found');
        }

        // Verify truck ownership
        await this.verifyTruckOwnership(slot.truckId, userId);

        // Cannot delete booked slots
        if (slot.isBooked) {
            throw new ForbiddenException('Cannot delete a booked slot');
        }

        // Delete slot
        await db
            .delete(availabilitySlots)
            .where(eq(availabilitySlots.id, slotId));
    }

    /**
     * Helper: Verify user owns the truck's organization
     */
    private async verifyTruckOwnership(truckId: string, userId: string) {
        const [truck] = await db
            .select()
            .from(trucks)
            .where(eq(trucks.id, truckId))
            .limit(1);

        if (!truck) {
            throw new NotFoundException('Truck not found');
        }

        const [membership] = await db
            .select()
            .from(orgMembers)
            .where(
                and(
                    eq(orgMembers.orgId, truck.orgId),
                    eq(orgMembers.userId, userId)
                )
            )
            .limit(1);

        if (!membership) {
            throw new ForbiddenException('You do not have permission to access this slot');
        }
    }
}
