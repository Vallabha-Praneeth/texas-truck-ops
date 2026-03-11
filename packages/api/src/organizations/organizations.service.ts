import { Injectable, NotFoundException } from '@nestjs/common';
import { db, orgs, orgMembers, users } from '@led-billboard/db';
import { eq } from 'drizzle-orm';
import { CreateOrganizationDto } from '@led-billboard/shared';

@Injectable()
export class OrganizationsService {
    /**
     * Create a new organization
     */
    async createOrganization(dto: CreateOrganizationDto) {
        const [newOrg] = await db
            .insert(orgs)
            .values({
                name: dto.name,
                type: dto.type,
                contactPhone: dto.contactPhone,
                contactEmail: dto.contactEmail ?? null,
                taxId: dto.taxId ?? null,
            })
            .returning();

        return {
            id: newOrg.id,
            name: newOrg.name,
            type: newOrg.type,
            contactPhone: newOrg.contactPhone,
            contactEmail: newOrg.contactEmail,
            taxId: newOrg.taxId,
            createdAt: newOrg.createdAt.toISOString(),
        };
    }

    /**
     * List all organizations
     */
    async listOrganizations() {
        const allOrgs = await db
            .select()
            .from(orgs)
            .orderBy(orgs.name);

        return allOrgs.map(org => ({
            id: org.id,
            name: org.name,
            type: org.type,
            contactPhone: org.contactPhone,
            contactEmail: org.contactEmail,
            taxId: org.taxId,
            createdAt: org.createdAt.toISOString(),
        }));
    }

    /**
     * Get organization members
     */
    async getOrganizationMembers(orgId: string) {
        // Verify org exists
        const [org] = await db
            .select()
            .from(orgs)
            .where(eq(orgs.id, orgId))
            .limit(1);

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        // Get members with user details
        const members = await db
            .select({
                userId: orgMembers.userId,
                role: orgMembers.role,
                createdAt: orgMembers.createdAt,
                displayName: users.displayName,
                phone: users.phone,
                email: users.email,
            })
            .from(orgMembers)
            .leftJoin(users, eq(orgMembers.userId, users.id))
            .where(eq(orgMembers.orgId, orgId));

        return members.map(member => ({
            userId: member.userId,
            role: member.role,
            joinedAt: member.createdAt.toISOString(),
            user: {
                displayName: member.displayName,
                phone: member.phone,
                email: member.email,
            },
        }));
    }
}
