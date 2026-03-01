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
exports.SlotsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const slots_service_1 = require("./slots.service");
const shared_1 = require("@led-billboard/shared");
const zod_validation_1 = require("../common/zod-validation");
let SlotsController = class SlotsController {
    constructor(slotsService) {
        this.slotsService = slotsService;
    }
    async createSlot(body, req) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.createSlotSchema, body, 'Invalid slot payload');
        return this.slotsService.createSlot(dto, req.user.id, req.user.primaryRole);
    }
    async searchSlots(query) {
        const filters = (0, zod_validation_1.parseWithSchema)(shared_1.searchSlotsSchema, query, 'Invalid slot search filters');
        return this.slotsService.searchSlots(filters);
    }
    async getSlot(id, req) {
        return this.slotsService.getSlot(id, req.user.id, req.user.primaryRole);
    }
    async updateSlot(id, body, req) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.updateSlotSchema, body, 'Invalid slot update payload');
        return this.slotsService.updateSlot(id, dto, req.user.id, req.user.primaryRole);
    }
    async deleteSlot(id, req) {
        await this.slotsService.deleteSlot(id, req.user.id, req.user.primaryRole);
    }
};
exports.SlotsController = SlotsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SlotsController.prototype, "createSlot", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SlotsController.prototype, "searchSlots", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SlotsController.prototype, "getSlot", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SlotsController.prototype, "updateSlot", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SlotsController.prototype, "deleteSlot", null);
exports.SlotsController = SlotsController = __decorate([
    (0, common_1.Controller)('slots'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [slots_service_1.SlotsService])
], SlotsController);
//# sourceMappingURL=slots.controller.js.map