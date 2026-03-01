"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotsService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let SlotsService = class SlotsService {
    async createSlot(dto, userId, userRole) {
        if (userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only operators can create availability slots');
        }
        const [truck] = await db_1.db
            .select()
            .from(db_1.trucks)
            .where((0, drizzle_orm_1.eq)(db_1.trucks.id, dto.truckId))
            .limit(1);
        if (!truck) {
            throw new common_1.ForbiddenException('Truck not found');
        }
        const [membership] = await db_1.db
            .select()
            .from(db_1.orgMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, truck.orgId), (0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId)))
            .limit(1);
        if (!membership) {
            throw new common_1.ForbiddenException('You do not have permission to create slots for this truck');
        }
        const [newSlot] = await db_1.db
            .insert(db_1.availabilitySlots)
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
    async searchSlots(_filters) {
        const query = db_1.db
            .select()
            .from(db_1.availabilitySlots)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.isBooked, false));
        const slots = await query.orderBy(db_1.availabilitySlots.startAt);
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
    async getSlot(slotId, userId, userRole) {
        const [slot] = await db_1.db
            .select()
            .from(db_1.availabilitySlots)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, slotId))
            .limit(1);
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
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
    async updateSlot(slotId, dto, userId, userRole) {
        if (userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only operators can update slots');
        }
        const [slot] = await db_1.db
            .select()
            .from(db_1.availabilitySlots)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, slotId))
            .limit(1);
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        await this.verifyTruckOwnership(slot.truckId, userId);
        if (slot.isBooked) {
            throw new common_1.ForbiddenException('Cannot update a booked slot');
        }
        const updateData = {
            updatedAt: new Date(),
        };
        if (dto.startAt)
            updateData.startAt = new Date(dto.startAt);
        if (dto.endAt)
            updateData.endAt = new Date(dto.endAt);
        if (dto.region !== undefined)
            updateData.region = dto.region;
        if (dto.radiusMiles !== undefined)
            updateData.radiusMiles = dto.radiusMiles;
        if (dto.repositionAllowed !== undefined)
            updateData.repositionAllowed = dto.repositionAllowed;
        if (dto.maxRepositionMiles !== undefined)
            updateData.maxRepositionMiles = dto.maxRepositionMiles;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        const [updatedSlot] = await db_1.db
            .update(db_1.availabilitySlots)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, slotId))
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
    async deleteSlot(slotId, userId, userRole) {
        if (userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only operators can delete slots');
        }
        const [slot] = await db_1.db
            .select()
            .from(db_1.availabilitySlots)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, slotId))
            .limit(1);
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        await this.verifyTruckOwnership(slot.truckId, userId);
        if (slot.isBooked) {
            throw new common_1.ForbiddenException('Cannot delete a booked slot');
        }
        await db_1.db
            .delete(db_1.availabilitySlots)
            .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, slotId));
    }
    async verifyTruckOwnership(truckId, userId) {
        const [truck] = await db_1.db
            .select()
            .from(db_1.trucks)
            .where((0, drizzle_orm_1.eq)(db_1.trucks.id, truckId))
            .limit(1);
        if (!truck) {
            throw new common_1.NotFoundException('Truck not found');
        }
        const [membership] = await db_1.db
            .select()
            .from(db_1.orgMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, truck.orgId), (0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId)))
            .limit(1);
        if (!membership) {
            throw new common_1.ForbiddenException('You do not have permission to access this slot');
        }
    }
};
exports.SlotsService = SlotsService;
exports.SlotsService = SlotsService = __decorate([
    (0, common_1.Injectable)()
], SlotsService);
//# sourceMappingURL=slots.service.js.map