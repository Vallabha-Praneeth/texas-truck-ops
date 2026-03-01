import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeInternalController } from './realtime.internal.controller';
import { RealtimeService } from './realtime.service';

@Module({
    controllers: [RealtimeController, RealtimeInternalController],
    providers: [RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule {}
