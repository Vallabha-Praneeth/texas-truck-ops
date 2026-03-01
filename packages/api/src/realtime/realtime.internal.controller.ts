import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Headers,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { InternalEmitRequest } from './realtime.types';

@Controller('realtime/internal')
export class RealtimeInternalController {
    constructor(
        private readonly configService: ConfigService,
        private readonly realtimeService: RealtimeService
    ) {}

    @Post('emit')
    @HttpCode(HttpStatus.ACCEPTED)
    emit(
        @Headers('x-internal-key') internalKey: string | undefined,
        @Body() body: InternalEmitRequest
    ) {
        const expectedInternalKey =
            this.configService.get<string>('INTERNAL_SERVICE_KEY');

        if (!expectedInternalKey) {
            throw new InternalServerErrorException(
                'INTERNAL_SERVICE_KEY is not configured'
            );
        }

        if (!internalKey || internalKey !== expectedInternalKey) {
            throw new ForbiddenException('Invalid internal key');
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

    private validateEmitBody(body: InternalEmitRequest): void {
        if (!body || typeof body !== 'object') {
            throw new BadRequestException('Invalid request body');
        }

        const channelRegex =
            /^(user|org|booking|slot|offer|system):[a-zA-Z0-9_-]+$/;
        const eventRegex = /^[a-zA-Z0-9:_-]{3,64}$/;

        if (!body.channel || !channelRegex.test(body.channel)) {
            throw new BadRequestException(
                'Invalid channel. Use format namespace:identifier'
            );
        }

        if (!body.event || !eventRegex.test(body.event)) {
            throw new BadRequestException(
                'Invalid event. Use 3-64 chars: letters, numbers, :, _, -'
            );
        }

        if (body.payload && typeof body.payload !== 'object') {
            throw new BadRequestException(
                'Invalid payload. Expected JSON object'
            );
        }
    }
}
