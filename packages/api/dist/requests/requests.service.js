"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let RequestsService = class RequestsService {
    async createRequest(dto, userId) {
        const [newRequest] = await db_1.db
            .insert(db_1.requests)
            .values({
            createdBy: userId,
            region: dto.region,
            title: dto.title,
            description: dto.description,
            preferredStartAt: new Date(dto.preferredStartAt),
            preferredEndAt: new Date(dto.preferredEndAt),
            budgetCents: dto.budgetCents || null,
            minScreenWidthFt: dto.minScreenWidthFt || null,
            status: 'open',
        })
            .returning();
        return this.formatRequest(newRequest);
    }
    async listRequests(filters) {
        const conditions = [];
        if (filters?.region) {
            conditions.push((0, drizzle_orm_1.eq)(db_1.requests.region, filters.region));
        }
        if (filters?.status) {
            conditions.push((0, drizzle_orm_1.eq)(db_1.requests.status, filters.status));
        }
        const result = conditions.length > 0
            ? await db_1.db
                .select()
                .from(db_1.requests)
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy(db_1.requests.createdAt)
            : await db_1.db.select().from(db_1.requests).orderBy(db_1.requests.createdAt);
        return result.map(r => this.formatRequest(r));
    }
    async getRequest(requestId, userId, userRole) {
        const [request] = await db_1.db
            .select()
            .from(db_1.requests)
            .where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId))
            .limit(1);
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (userRole === 'broker' && request.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only view your own requests');
        }
        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only brokers and operators can view request details');
        }
        return this.formatRequest(request);
    }
    async updateRequest(requestId, dto, userId) {
        const [request] = await db_1.db
            .select()
            .from(db_1.requests)
            .where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId))
            .limit(1);
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only update your own requests');
        }
        const updateData = {};
        if (dto.region !== undefined)
            updateData.region = dto.region;
        if (dto.title !== undefined)
            updateData.title = dto.title;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.preferredStartAt !== undefined) {
            updateData.preferredStartAt = new Date(dto.preferredStartAt);
        }
        if (dto.preferredEndAt !== undefined) {
            updateData.preferredEndAt = new Date(dto.preferredEndAt);
        }
        if (dto.budgetCents !== undefined)
            updateData.budgetCents = dto.budgetCents;
        if (dto.minScreenWidthFt !== undefined) {
            updateData.minScreenWidthFt = dto.minScreenWidthFt;
        }
        if (Object.keys(updateData).length === 0) {
            return this.formatRequest(request);
        }
        const [updated] = await db_1.db
            .update(db_1.requests)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId))
            .returning();
        return this.formatRequest(updated);
    }
    async deleteRequest(requestId, userId) {
        const [request] = await db_1.db
            .select()
            .from(db_1.requests)
            .where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId))
            .limit(1);
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own requests');
        }
        await db_1.db.delete(db_1.requests).where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId));
    }
    async getRequestOffers(requestId, userId, userRole) {
        const [request] = await db_1.db
            .select()
            .from(db_1.requests)
            .where((0, drizzle_orm_1.eq)(db_1.requests.id, requestId))
            .limit(1);
        if (!request) {
            throw new common_1.NotFoundException('Request not found');
        }
        if (userRole === 'broker' && request.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only view offers for your own requests');
        }
        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only brokers and operators can view request offers');
        }
        const result = await db_1.db
            .select({
            offer: db_1.offers,
            slot: db_1.availabilitySlots,
            truck: db_1.trucks,
        })
            .from(db_1.offers)
            .leftJoin(db_1.availabilitySlots, (0, drizzle_orm_1.eq)(db_1.offers.slotId, db_1.availabilitySlots.id))
            .leftJoin(db_1.trucks, (0, drizzle_orm_1.eq)(db_1.availabilitySlots.truckId, db_1.trucks.id))
            .where((0, drizzle_orm_1.eq)(db_1.offers.requestId, requestId))
            .orderBy((0, drizzle_orm_1.desc)(db_1.offers.createdAt));
        return {
            offers: result.map(({ offer, slot, truck }) => ({
                ...this.formatOffer(offer),
                slot: slot
                    ? {
                        id: slot.id,
                        startAt: slot.startAt.toISOString(),
                        endAt: slot.endAt.toISOString(),
                        truck: truck ? { nickname: truck.nickname } : null,
                    }
                    : null,
            })),
            total: result.length,
        };
    }
    formatOffer(offer) {
        return {
            id: offer.id,
            requestId: offer.requestId,
            slotId: offer.slotId,
            createdBy: offer.createdBy,
            amountCents: offer.amountCents,
            currency: offer.currency,
            terms: offer.terms,
            status: offer.status,
            expiresAt: offer.expiresAt?.toISOString() || null,
            createdAt: offer.createdAt.toISOString(),
        };
    }
    formatRequest(request) {
        return {
            id: request.id,
            createdBy: request.createdBy,
            region: request.region,
            title: request.title,
            description: request.description,
            preferredStartAt: request.preferredStartAt.toISOString(),
            preferredEndAt: request.preferredEndAt.toISOString(),
            budgetCents: request.budgetCents,
            minScreenWidthFt: request.minScreenWidthFt,
            status: request.status,
            createdAt: request.createdAt.toISOString(),
        };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)()
], RequestsService);
//# sourceMappingURL=requests.service.js.map