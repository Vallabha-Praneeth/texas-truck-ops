import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db, requests, offers, trucks, availabilitySlots } from '@led-billboard/db';
import { eq, desc, and } from 'drizzle-orm';
import { CreateRequestDto, UpdateRequestDto } from '@led-billboard/shared';

@Injectable()
export class RequestsService {
    async createRequest(dto: CreateRequestDto, userId: string) {
        const [newRequest] = await db
            .insert(requests)
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

    async listRequests(filters?: { region?: string; status?: string }) {
        const conditions = [];

        if (filters?.region) {
            conditions.push(eq(requests.region, filters.region));
        }

        if (filters?.status) {
            conditions.push(eq(requests.status, filters.status));
        }

        const result =
            conditions.length > 0
                ? await db
                    .select()
                    .from(requests)
                    .where(and(...conditions))
                    .orderBy(requests.createdAt)
                : await db.select().from(requests).orderBy(requests.createdAt);

        return result.map(r => this.formatRequest(r));
    }

    async getRequest(requestId: string, userId: string, userRole: string) {
        const [request] = await db
            .select()
            .from(requests)
            .where(eq(requests.id, requestId))
            .limit(1);

        if (!request) throw new NotFoundException('Request not found');

        if (userRole === 'broker' && request.createdBy !== userId) {
            throw new ForbiddenException('You can only view your own requests');
        }

        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new ForbiddenException(
                'Only brokers and operators can view request details'
            );
        }

        return this.formatRequest(request);
    }

    async updateRequest(requestId: string, dto: UpdateRequestDto, userId: string) {
        const [request] = await db
            .select()
            .from(requests)
            .where(eq(requests.id, requestId))
            .limit(1);

        if (!request) throw new NotFoundException('Request not found');
        if (request.createdBy !== userId) {
            throw new ForbiddenException('You can only update your own requests');
        }

        const updateData: Record<string, unknown> = {};

        if (dto.region !== undefined) updateData.region = dto.region;
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.preferredStartAt !== undefined) {
            updateData.preferredStartAt = new Date(dto.preferredStartAt);
        }
        if (dto.preferredEndAt !== undefined) {
            updateData.preferredEndAt = new Date(dto.preferredEndAt);
        }
        if (dto.budgetCents !== undefined) updateData.budgetCents = dto.budgetCents;
        if (dto.minScreenWidthFt !== undefined) {
            updateData.minScreenWidthFt = dto.minScreenWidthFt;
        }

        if (Object.keys(updateData).length === 0) {
            return this.formatRequest(request);
        }

        const [updated] = await db
            .update(requests)
            .set(updateData)
            .where(eq(requests.id, requestId))
            .returning();

        return this.formatRequest(updated);
    }

    async deleteRequest(requestId: string, userId: string) {
        const [request] = await db
            .select()
            .from(requests)
            .where(eq(requests.id, requestId))
            .limit(1);

        if (!request) throw new NotFoundException('Request not found');
        if (request.createdBy !== userId) {
            throw new ForbiddenException('You can only delete your own requests');
        }

        await db.delete(requests).where(eq(requests.id, requestId));
    }

    async getRequestOffers(requestId: string, userId: string, userRole: string) {
        const [request] = await db
            .select()
            .from(requests)
            .where(eq(requests.id, requestId))
            .limit(1);

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (userRole === 'broker' && request.createdBy !== userId) {
            throw new ForbiddenException('You can only view offers for your own requests');
        }

        if (userRole !== 'broker' && userRole !== 'operator') {
            throw new ForbiddenException(
                'Only brokers and operators can view request offers'
            );
        }

        const result = await db
            .select({
                offer: offers,
                slot: availabilitySlots,
                truck: trucks,
            })
            .from(offers)
            .leftJoin(availabilitySlots, eq(offers.slotId, availabilitySlots.id))
            .leftJoin(trucks, eq(availabilitySlots.truckId, trucks.id))
            .where(eq(offers.requestId, requestId))
            .orderBy(desc(offers.createdAt));

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

    private formatOffer(offer: any) {
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

    private formatRequest(request: any) {
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
}
