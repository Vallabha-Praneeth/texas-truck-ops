import {
    Controller,
    MessageEvent,
    Request,
    Sse,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { merge, Observable, interval, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
    constructor(private readonly realtimeService: RealtimeService) {}

    @Sse('stream')
    stream(@Request() req): Observable<MessageEvent> {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException(
                'Missing authenticated user context'
            );
        }

        const events$ = this.realtimeService.streamForUser(userId);
        const connected$ = of({
            type: 'realtime:connected',
            data: {
                userId,
                timestamp: new Date().toISOString(),
            },
        });
        const keepAlive$ = interval(25000).pipe(
            map(() => ({
                type: 'realtime:keepalive',
                data: {
                    timestamp: new Date().toISOString(),
                },
            }))
        );

        return merge(connected$, events$, keepAlive$);
    }
}
