import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { InternalEmitRequest } from './realtime.types';
export declare class RealtimeInternalController {
    private readonly configService;
    private readonly realtimeService;
    constructor(configService: ConfigService, realtimeService: RealtimeService);
    emit(internalKey: string | undefined, body: InternalEmitRequest): {
        success: boolean;
        id: string;
        channel: string;
        event: string;
        timestamp: string;
    };
    private validateEmitBody;
}
//# sourceMappingURL=realtime.internal.controller.d.ts.map