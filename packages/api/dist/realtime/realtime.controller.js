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
exports.RealtimeController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const realtime_service_1 = require("./realtime.service");
let RealtimeController = class RealtimeController {
    constructor(realtimeService) {
        this.realtimeService = realtimeService;
    }
    stream(req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('Missing authenticated user context');
        }
        const events$ = this.realtimeService.streamForUser(userId);
        const connected$ = (0, rxjs_1.of)({
            type: 'realtime:connected',
            data: {
                userId,
                timestamp: new Date().toISOString(),
            },
        });
        const keepAlive$ = (0, rxjs_1.interval)(25000).pipe((0, operators_1.map)(() => ({
            type: 'realtime:keepalive',
            data: {
                timestamp: new Date().toISOString(),
            },
        })));
        return (0, rxjs_1.merge)(connected$, events$, keepAlive$);
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Sse)('stream'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], RealtimeController.prototype, "stream", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, common_1.Controller)('realtime'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService])
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map