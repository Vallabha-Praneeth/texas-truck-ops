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
exports.RealtimeInternalController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const realtime_service_1 = require("./realtime.service");
let RealtimeInternalController = class RealtimeInternalController {
    constructor(configService, realtimeService) {
        this.configService = configService;
        this.realtimeService = realtimeService;
    }
    emit(internalKey, body) {
        const expectedInternalKey = this.configService.get('INTERNAL_SERVICE_KEY');
        if (!expectedInternalKey) {
            throw new common_1.InternalServerErrorException('INTERNAL_SERVICE_KEY is not configured');
        }
        if (!internalKey || internalKey !== expectedInternalKey) {
            throw new common_1.ForbiddenException('Invalid internal key');
        }
        this.validateEmitBody(body);
        const envelope = this.realtimeService.emit({
            channel: body.channel,
            event: body.event,
            payload: body.payload ?? {},
            source: 'internal',
        });
        return {
            success: true,
            id: envelope.id,
            channel: envelope.channel,
            event: envelope.event,
            timestamp: envelope.timestamp,
        };
    }
    validateEmitBody(body) {
        if (!body || typeof body !== 'object') {
            throw new common_1.BadRequestException('Invalid request body');
        }
        const channelRegex = /^(user|org|booking|slot|offer|system):[a-zA-Z0-9_-]+$/;
        const eventRegex = /^[a-zA-Z0-9:_-]{3,64}$/;
        if (!body.channel || !channelRegex.test(body.channel)) {
            throw new common_1.BadRequestException('Invalid channel. Use format namespace:identifier');
        }
        if (!body.event || !eventRegex.test(body.event)) {
            throw new common_1.BadRequestException('Invalid event. Use 3-64 chars: letters, numbers, :, _, -');
        }
        if (body.payload && typeof body.payload !== 'object') {
            throw new common_1.BadRequestException('Invalid payload. Expected JSON object');
        }
    }
};
exports.RealtimeInternalController = RealtimeInternalController;
__decorate([
    (0, common_1.Post)('emit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Headers)('x-internal-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealtimeInternalController.prototype, "emit", null);
exports.RealtimeInternalController = RealtimeInternalController = __decorate([
    (0, common_1.Controller)('realtime/internal'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        realtime_service_1.RealtimeService])
], RealtimeInternalController);
//# sourceMappingURL=realtime.internal.controller.js.map