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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shared_1 = require("@led-billboard/shared");
const zod_1 = require("zod");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const zod_validation_1 = require("../common/zod-validation");
const users_service_1 = require("./users.service");
const internalRoleUpdateSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+1[0-9]{10}$/),
    primaryRole: zod_1.z.enum(['operator', 'broker', 'driver', 'admin']),
});
let UsersController = class UsersController {
    constructor(usersService, configService) {
        this.usersService = usersService;
        this.configService = configService;
    }
    async getMe(req) {
        const profile = await this.usersService.getProfile(req.user.id);
        if (!profile) {
            throw new common_1.NotFoundException('User not found');
        }
        return profile;
    }
    async updateMe(req, body) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.updateUserProfileSchema, body, 'Invalid user update payload');
        const profile = await this.usersService.updateProfile(req.user.id, dto);
        if (!profile) {
            throw new common_1.NotFoundException('User not found');
        }
        return profile;
    }
    async getMyOrganizations(req) {
        const memberships = await this.usersService.getMemberships(req.user.id);
        return { memberships };
    }
    async updateRoleInternal(internalKey, body) {
        const expectedKey = this.configService.get('INTERNAL_SERVICE_KEY');
        if (!expectedKey || internalKey !== expectedKey) {
            throw new common_1.ForbiddenException('Invalid internal key');
        }
        const dto = (0, zod_validation_1.parseWithSchema)(internalRoleUpdateSchema, body, 'Invalid role update payload');
        const updated = await this.usersService.updateRoleByPhone(dto.phone, dto.primaryRole);
        if (!updated) {
            throw new common_1.NotFoundException('User not found');
        }
        return updated;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)('me/organizations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyOrganizations", null);
__decorate([
    (0, common_1.Patch)('internal/role'),
    __param(0, (0, common_1.Headers)('x-internal-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRoleInternal", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], UsersController);
//# sourceMappingURL=users.controller.js.map