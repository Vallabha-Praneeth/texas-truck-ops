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
exports.OffersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const offers_service_1 = require("./offers.service");
const shared_1 = require("@led-billboard/shared");
const zod_validation_1 = require("../common/zod-validation");
let OffersController = class OffersController {
    constructor(offersService) {
        this.offersService = offersService;
    }
    async createOffer(body, req) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.createOfferSchema, body, 'Invalid offer payload');
        return this.offersService.createOffer(dto, req.user.id, req.user.primaryRole);
    }
    async listOffers(req) {
        return this.offersService.listOffers(req.user.id, req.user.primaryRole);
    }
    async getOffer(id, req) {
        return this.offersService.getOffer(id, req.user.id, req.user.primaryRole);
    }
    async updateOffer(id, body, req) {
        const dto = (0, zod_validation_1.parseWithSchema)(shared_1.updateOfferSchema, body, 'Invalid offer update payload');
        return this.offersService.updateOffer(id, dto, req.user.id, req.user.primaryRole);
    }
    async deleteOffer(id, req) {
        await this.offersService.deleteOffer(id, req.user.id);
    }
};
exports.OffersController = OffersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "listOffers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "getOffer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "updateOffer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OffersController.prototype, "deleteOffer", null);
exports.OffersController = OffersController = __decorate([
    (0, common_1.Controller)('offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [offers_service_1.OffersService])
], OffersController);
//# sourceMappingURL=offers.controller.js.map