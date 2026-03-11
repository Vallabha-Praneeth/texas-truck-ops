"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let OrganizationsService = class OrganizationsService {
    async createOrganization(dto) {
        const [newOrg] = await db_1.db
            .insert(db_1.orgs)
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
    async listOrganizations() {
        const allOrgs = await db_1.db
            .select()
            .from(db_1.orgs)
            .orderBy(db_1.orgs.name);
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
    async getOrganizationMembers(orgId) {
        const [org] = await db_1.db
            .select()
            .from(db_1.orgs)
            .where((0, drizzle_orm_1.eq)(db_1.orgs.id, orgId))
            .limit(1);
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const members = await db_1.db
            .select({
            userId: db_1.orgMembers.userId,
            role: db_1.orgMembers.role,
            createdAt: db_1.orgMembers.createdAt,
            displayName: db_1.users.displayName,
            phone: db_1.users.phone,
            email: db_1.users.email,
        })
            .from(db_1.orgMembers)
            .leftJoin(db_1.users, (0, drizzle_orm_1.eq)(db_1.orgMembers.userId, db_1.users.id))
            .where((0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, orgId));
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
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)()
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map