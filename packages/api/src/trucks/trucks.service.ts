import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { db, trucks, orgs, orgMembers } from '@led-billboard/db';
import { eq, and } from 'drizzle-orm';
import { CreateTruckDto } from '@led-billboard/shared';

@Injectable()
export class TrucksService {
    /**
     * Create a new truck
     * Only operators can create trucks for their organization
     */
    async createTruck(dto: CreateTruckDto, userId: string, userRole: string) {
        // Authorization: only operators can create trucks
        if (userRole !== 'operator') {
            throw new ForbiddenException('Only operators can create trucks');
        }

        // Verify user is member of the organization
        const [membership] = await db
            .select()
            .from(orgMembers)
            .where(
                and(
                    eq(orgMembers.orgId, dto.orgId),
                    eq(orgMembers.userId, userId)
                )
            )
            .limit(1);

        if (!membership) {
            throw new ForbiddenException('You do not have permission to create trucks for this organization');
        }

        // Verify organization exists and is an operator
        const [org] = await db
            .select()
            .from(orgs)
            .where(eq(orgs.id, dto.orgId))
            .limit(1);

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        if (org.type !== 'operator') {
            throw new ForbiddenException('Only operator organizations can have trucks');
        }

        // Create truck
        const [newTruck] = await db
            .insert(trucks)
            .values({
                orgId: dto.orgId,
                nickname: dto.nickname,
                plateNumber: dto.plateNumber,
                screenSizeFt: dto.screenSizeFt,
                baseRegion: dto.baseRegion,
            })
            .returning();

        return {
            id: newTruck.id,
            orgId: newTruck.orgId,
            nickname: newTruck.nickname,
            plateNumber: newTruck.plateNumber,
            screenSizeFt: newTruck.screenSizeFt,
            baseRegion: newTruck.baseRegion,
            createdAt: newTruck.createdAt.toISOString(),
        };
    }

    /**
     * List all trucks
     * TODO: Add filtering by organization, region, etc.
     */
    async listTrucks() {
        const allTrucks = await db
            .select()
            .from(trucks)
            .orderBy(trucks.createdAt);

        return allTrucks.map(truck => ({
            id: truck.id,
            orgId: truck.orgId,
            nickname: truck.nickname,
            plateNumber: truck.plateNumber,
            screenSizeFt: truck.screenSizeFt,
            baseRegion: truck.baseRegion,
            createdAt: truck.createdAt.toISOString(),
        }));
    }
}
