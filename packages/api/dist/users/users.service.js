"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let UsersService = class UsersService {
    async findByPhone(phone) {
        const [user] = await db_1.db
            .select()
            .from(db_1.users)
            .where((0, drizzle_orm_1.eq)(db_1.users.phone, phone))
            .limit(1);
        return user || null;
    }
    async findById(id) {
        const [user] = await db_1.db
            .select()
            .from(db_1.users)
            .where((0, drizzle_orm_1.eq)(db_1.users.id, id))
            .limit(1);
        return user || null;
    }
    async create(data) {
        const [user] = await db_1.db
            .insert(db_1.users)
            .values(data)
            .returning();
        return user;
    }
    async getProfile(userId) {
        const [user] = await db_1.db
            .select()
            .from(db_1.users)
            .where((0, drizzle_orm_1.eq)(db_1.users.id, userId))
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
    async updateProfile(userId, dto) {
        const updateData = {};
        if (dto.displayName !== undefined) {
            updateData.displayName = dto.displayName;
        }
        if (dto.email !== undefined) {
            updateData.email = dto.email;
        }
        const [user] = await db_1.db
            .update(db_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(db_1.users.id, userId))
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
    async updateRoleByPhone(phone, role) {
        const [user] = await db_1.db
            .update(db_1.users)
            .set({
            primaryRole: role,
        })
            .where((0, drizzle_orm_1.eq)(db_1.users.phone, phone))
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
    async getMemberships(userId) {
        const memberships = await db_1.db
            .select({
            id: db_1.orgMembers.id,
            orgId: db_1.orgMembers.orgId,
            userId: db_1.orgMembers.userId,
            role: db_1.orgMembers.role,
            createdAt: db_1.orgMembers.createdAt,
            orgName: db_1.orgs.name,
            orgType: db_1.orgs.type,
            orgContactPhone: db_1.orgs.contactPhone,
        })
            .from(db_1.orgMembers)
            .leftJoin(db_1.orgs, (0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, db_1.orgs.id))
            .where((0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId));
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map