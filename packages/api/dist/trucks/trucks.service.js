"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrucksService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@led-billboard/db");
const drizzle_orm_1 = require("drizzle-orm");
let TrucksService = class TrucksService {
    async createTruck(dto, userId, userRole) {
        if (userRole !== 'operator') {
            throw new common_1.ForbiddenException('Only operators can create trucks');
        }
        const [membership] = await db_1.db
            .select()
            .from(db_1.orgMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.orgMembers.orgId, dto.orgId), (0, drizzle_orm_1.eq)(db_1.orgMembers.userId, userId)))
            .limit(1);
        if (!membership) {
            throw new common_1.ForbiddenException('You do not have permission to create trucks for this organization');
        }
        const [org] = await db_1.db
            .select()
            .from(db_1.orgs)
            .where((0, drizzle_orm_1.eq)(db_1.orgs.id, dto.orgId))
            .limit(1);
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        if (org.type !== 'operator') {
            throw new common_1.ForbiddenException('Only operator organizations can have trucks');
        }
        const [newTruck] = await db_1.db
            .insert(db_1.trucks)
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
    async listTrucks() {
        const allTrucks = await db_1.db
            .select()
            .from(db_1.trucks)
            .orderBy(db_1.trucks.createdAt);
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
};
exports.TrucksService = TrucksService;
exports.TrucksService = TrucksService = __decorate([
    (0, common_1.Injectable)()
], TrucksService);
//# sourceMappingURL=trucks.service.js.map