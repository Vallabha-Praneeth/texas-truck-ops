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
exports.OffersService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
const bookings_service_1 = require("../bookings/bookings.service");
let OffersService = class OffersService {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createOffer(dto, userId, _userRole) {
        if (!dto.slotId && !dto.requestId) {
            throw new common_1.BadRequestException('Must provide either slotId or requestId');
        }
        if (dto.slotId) {
            const [slot] = await db_1.db
                .select()
                .from(db_1.availabilitySlots)
                .where((0, drizzle_orm_1.eq)(db_1.availabilitySlots.id, dto.slotId))
                .limit(1);
            if (!slot)
                throw new common_1.NotFoundException('Slot not found');
            if (slot.isBooked)
                throw new common_1.BadRequestException('Slot is already booked');
        }
        if (dto.requestId) {
            const [request] = await db_1.db
                .select()
                .from(db_1.requests)
                .where((0, drizzle_orm_1.eq)(db_1.requests.id, dto.requestId))
                .limit(1);
            if (!request)
                throw new common_1.NotFoundException('Request not found');
        }
        const [newOffer] = await db_1.db
            .insert(db_1.offers)
            .values({
            slotId: dto.slotId || null,
            requestId: dto.requestId || null,
            createdBy: userId,
            amountCents: dto.amountCents,
            currency: dto.currency || 'USD',
            terms: dto.terms || null,
            status: 'pending',
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        })
            .returning();
        return this.formatOffer(newOffer);
    }
    async listOffers(userId, userRole) {
        const result = userRole === 'broker'
            ? await db_1.db
                .select()
                .from(db_1.offers)
                .where((0, drizzle_orm_1.eq)(db_1.offers.createdBy, userId))
                .orderBy(db_1.offers.createdAt)
            : await db_1.db
                .select()
                .from(db_1.offers)
                .orderBy(db_1.offers.createdAt);
        return result.map(o => this.formatOffer(o));
    }
    async getOffer(offerId, userId, userRole) {
        const [offer] = await db_1.db
            .select()
            .from(db_1.offers)
            .where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId))
            .limit(1);
        if (!offer)
            throw new common_1.NotFoundException('Offer not found');
        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new common_1.ForbiddenException('You do not have permission to view offers');
        }
        if (userRole === 'broker' && offer.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only view your own offers');
        }
        return this.formatOffer(offer);
    }
    async updateOffer(offerId, dto, userId, userRole) {
        const [offer] = await db_1.db
            .select()
            .from(db_1.offers)
            .where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId))
            .limit(1);
        if (!offer)
            throw new common_1.NotFoundException('Offer not found');
        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new common_1.ForbiddenException('You do not have permission to update offers');
        }
        if (userRole === 'broker' && offer.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only update your own offers');
        }
        const isOperatorTransition = dto.status === 'accepted' || dto.status === 'rejected';
        if (isOperatorTransition && userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only operators can accept or reject offers');
        }
        if (userRole === 'operator') {
            if (dto.amountCents !== undefined || dto.terms !== undefined) {
                throw new common_1.ForbiddenException('Operators cannot edit offer amount or terms');
            }
            if (!isOperatorTransition) {
                throw new common_1.ForbiddenException('Operators can only set offer status to accepted or rejected');
            }
        }
        if (userRole === 'operator' && dto.status === 'accepted') {
            if (!this.bookingService) {
                throw new common_1.BadRequestException('Booking service unavailable');
            }
            try {
                await this.bookingService.acceptOffer(offerId, userId);
            }
            catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : 'Failed to accept offer';
                throw new common_1.BadRequestException(message);
            }
            const [acceptedOffer] = await db_1.db
                .select()
                .from(db_1.offers)
                .where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId))
                .limit(1);
            if (!acceptedOffer) {
                throw new common_1.NotFoundException('Offer not found');
            }
            return this.formatOffer(acceptedOffer);
        }
        const updateData = {};
        if (userRole === 'broker') {
            if (dto.amountCents !== undefined)
                updateData.amountCents = dto.amountCents;
            if (dto.terms !== undefined)
                updateData.terms = dto.terms;
            if (dto.status !== undefined &&
                dto.status !== 'accepted' &&
                dto.status !== 'rejected') {
                updateData.status = dto.status;
            }
        }
        else if (userRole === 'operator' && dto.status !== undefined) {
            updateData.status = dto.status;
        }
        if (Object.keys(updateData).length === 0) {
            throw new common_1.BadRequestException('No allowed fields provided for update');
        }
        updateData.updatedAt = new Date();
        const [updated] = await db_1.db
            .update(db_1.offers)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId))
            .returning();
        return this.formatOffer(updated);
    }
    async deleteOffer(offerId, userId) {
        const [offer] = await db_1.db
            .select()
            .from(db_1.offers)
            .where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId))
            .limit(1);
        if (!offer)
            throw new common_1.NotFoundException('Offer not found');
        if (offer.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own offers');
        }
        await db_1.db.delete(db_1.offers).where((0, drizzle_orm_1.eq)(db_1.offers.id, offerId));
    }
    formatOffer(offer) {
        return {
            id: offer.id,
            slotId: offer.slotId,
            requestId: offer.requestId,
            createdBy: offer.createdBy,
            amountCents: offer.amountCents,
            currency: offer.currency,
            terms: offer.terms,
            status: offer.status,
            expiresAt: offer.expiresAt?.toISOString() || null,
            createdAt: offer.createdAt.toISOString(),
            updatedAt: offer.updatedAt.toISOString(),
        };
    }
};
exports.OffersService = OffersService;
exports.OffersService = OffersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [bookings_service_1.BookingService])
], OffersService);
//# sourceMappingURL=offers.service.js.map