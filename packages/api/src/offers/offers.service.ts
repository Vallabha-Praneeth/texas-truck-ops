import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Optional,
} from '@nestjs/common';
import { db, offers, availabilitySlots, requests } from '@led-billboard/db';
import { eq } from 'drizzle-orm';
import { CreateOfferDto, UpdateOfferDto } from '@led-billboard/shared';
import { BookingService } from '../bookings/bookings.service';

@Injectable()
export class OffersService {
    constructor(
        @Optional()
        private readonly bookingService?: BookingService
    ) {}

    async createOffer(dto: CreateOfferDto, userId: string, _userRole: string) {
        if (!dto.slotId && !dto.requestId) {
            throw new BadRequestException('Must provide either slotId or requestId');
        }

        if (dto.slotId) {
            const [slot] = await db
                .select()
                .from(availabilitySlots)
                .where(eq(availabilitySlots.id, dto.slotId))
                .limit(1);

            if (!slot) throw new NotFoundException('Slot not found');
            if (slot.isBooked) throw new BadRequestException('Slot is already booked');
        }

        if (dto.requestId) {
            const [request] = await db
                .select()
                .from(requests)
                .where(eq(requests.id, dto.requestId))
                .limit(1);

            if (!request) throw new NotFoundException('Request not found');
        }

        const [newOffer] = await db
            .insert(offers)
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

    async listOffers(userId: string, userRole: string) {
        const result =
            userRole === 'broker'
                ? await db
                    .select()
                    .from(offers)
                    .where(eq(offers.createdBy, userId))
                    .orderBy(offers.createdAt)
                : await db
                    .select()
                    .from(offers)
                    .orderBy(offers.createdAt);
        return result.map(o => this.formatOffer(o));
    }

    async getOffer(offerId: string, userId: string, userRole: string) {
        const [offer] = await db
            .select()
            .from(offers)
            .where(eq(offers.id, offerId))
            .limit(1);

        if (!offer) throw new NotFoundException('Offer not found');

        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new ForbiddenException('You do not have permission to view offers');
        }

        if (userRole === 'broker' && offer.createdBy !== userId) {
            throw new ForbiddenException('You can only view your own offers');
        }

        return this.formatOffer(offer);
    }

    async updateOffer(offerId: string, dto: UpdateOfferDto, userId: string, userRole: string) {
        const [offer] = await db
            .select()
            .from(offers)
            .where(eq(offers.id, offerId))
            .limit(1);

        if (!offer) throw new NotFoundException('Offer not found');

        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new ForbiddenException('You do not have permission to update offers');
        }

        if (userRole === 'broker' && offer.createdBy !== userId) {
            throw new ForbiddenException('You can only update your own offers');
        }

        const isOperatorTransition =
            dto.status === 'accepted' || dto.status === 'rejected';

        if (isOperatorTransition && userRole !== 'operator') {
            throw new ForbiddenException('Only operators can accept or reject offers');
        }

        if (userRole === 'operator') {
            if (dto.amountCents !== undefined || dto.terms !== undefined) {
                throw new ForbiddenException('Operators cannot edit offer amount or terms');
            }

            if (!isOperatorTransition) {
                throw new ForbiddenException(
                    'Operators can only set offer status to accepted or rejected'
                );
            }
        }

        if (userRole === 'operator' && dto.status === 'accepted') {
            if (!this.bookingService) {
                throw new BadRequestException('Booking service unavailable');
            }

            try {
                await this.bookingService.acceptOffer(offerId, userId);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Failed to accept offer';
                throw new BadRequestException(message);
            }

            const [acceptedOffer] = await db
                .select()
                .from(offers)
                .where(eq(offers.id, offerId))
                .limit(1);

            if (!acceptedOffer) {
                throw new NotFoundException('Offer not found');
            }

            return this.formatOffer(acceptedOffer);
        }

        const updateData: Record<string, unknown> = {};

        if (userRole === 'broker') {
            if (dto.amountCents !== undefined) updateData.amountCents = dto.amountCents;
            if (dto.terms !== undefined) updateData.terms = dto.terms;

            if (
                dto.status !== undefined &&
                dto.status !== 'accepted' &&
                dto.status !== 'rejected'
            ) {
                updateData.status = dto.status;
            }
        } else if (userRole === 'operator' && dto.status !== undefined) {
            updateData.status = dto.status;
        }

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No allowed fields provided for update');
        }

        updateData.updatedAt = new Date();

        const [updated] = await db
            .update(offers)
            .set(updateData)
            .where(eq(offers.id, offerId))
            .returning();

        return this.formatOffer(updated);
    }

    async deleteOffer(offerId: string, userId: string) {
        const [offer] = await db
            .select()
            .from(offers)
            .where(eq(offers.id, offerId))
            .limit(1);

        if (!offer) throw new NotFoundException('Offer not found');
        if (offer.createdBy !== userId) {
            throw new ForbiddenException('You can only delete your own offers');
        }

        await db.delete(offers).where(eq(offers.id, offerId));
    }

    private formatOffer(offer: any) {
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
}
