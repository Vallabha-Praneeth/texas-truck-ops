"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let RealtimeService = class RealtimeService {
    constructor() {
        this.stream$ = new rxjs_1.Subject();
    }
    emit(input) {
        const envelope = {
            id: (0, crypto_1.randomUUID)(),
            channel: input.channel,
            event: input.event,
            payload: input.payload ?? {},
            source: input.source ?? 'internal',
            timestamp: new Date().toISOString(),
        };
        this.stream$.next(envelope);
        return envelope;
    }
    streamForUser(userId) {
        const channel = `user:${userId}`;
        return this.streamForChannel(channel);
    }
    streamForChannel(channel) {
        return this.stream$.pipe((0, operators_1.filter)((message) => message.channel === channel), (0, operators_1.map)((message) => ({
            type: message.event,
            data: {
                id: message.id,
                channel: message.channel,
                event: message.event,
                payload: message.payload,
                source: message.source,
                timestamp: message.timestamp,
            },
        })));
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)()
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map