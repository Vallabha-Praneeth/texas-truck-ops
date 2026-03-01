import { Injectable } from '@nestjs/common';
import { db, users, orgMembers, orgs } from '@led-billboard/db';
import { eq } from 'drizzle-orm';
import { UpdateUserProfileDto } from '@led-billboard/shared';

export interface CreateUserDto {
    phone: string;
    displayName: string;
    primaryRole: 'operator' | 'broker' | 'driver' | 'admin';
    email?: string;
}

type UserRole = 'operator' | 'broker' | 'driver' | 'admin';

@Injectable()
export class UsersService {
    async findByPhone(phone: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.phone, phone))
            .limit(1);

        return user || null;
    }

    async findById(id: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        return user || null;
    }

    async create(data: CreateUserDto) {
        const [user] = await db
            .insert(users)
            .values(data)
            .returning();

        return user;
    }

    async getProfile(userId: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            displayName: user.displayName,
            primaryRole: user.primaryRole,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async updateProfile(userId: string, dto: UpdateUserProfileDto) {
        const updateData: {
            displayName?: string;
            email?: string | null;
        } = {};

        if (dto.displayName !== undefined) {
            updateData.displayName = dto.displayName;
        }

        if (dto.email !== undefined) {
            updateData.email = dto.email;
        }

        const [user] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            displayName: user.displayName,
            primaryRole: user.primaryRole,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async updateRoleByPhone(phone: string, role: UserRole) {
        const [user] = await db
            .update(users)
            .set({
                primaryRole: role,
            })
            .where(eq(users.phone, phone))
            .returning();

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            displayName: user.displayName,
            primaryRole: user.primaryRole,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async getMemberships(userId: string) {
        const memberships = await db
            .select({
                id: orgMembers.id,
                orgId: orgMembers.orgId,
                userId: orgMembers.userId,
                role: orgMembers.role,
                createdAt: orgMembers.createdAt,
                orgName: orgs.name,
                orgType: orgs.type,
                orgContactPhone: orgs.contactPhone,
            })
            .from(orgMembers)
            .leftJoin(orgs, eq(orgMembers.orgId, orgs.id))
            .where(eq(orgMembers.userId, userId));

        return memberships.map((membership) => ({
            id: membership.id,
            orgId: membership.orgId,
            userId: membership.userId,
            role: membership.role,
            org: membership.orgName
                ? {
                      id: membership.orgId,
                      name: membership.orgName,
                      type: membership.orgType,
                      contactPhone: membership.orgContactPhone,
                  }
                : null,
            createdAt: membership.createdAt.toISOString(),
        }));
    }
}
