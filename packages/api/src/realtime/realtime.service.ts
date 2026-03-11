import { Injectable, MessageEvent } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { InternalEmitRequest, RealtimeEnvelope } from './realtime.types';

@Injectable()
export class RealtimeService {
    private readonly stream$ = new Subject<RealtimeEnvelope>();

    emit(
        input: InternalEmitRequest & { source?: string }
    ): RealtimeEnvelope {
        const envelope: RealtimeEnvelope = {
            id: randomUUID(),
            channel: input.channel,
            event: input.event,
            payload: input.payload ?? {},
            source: input.source ?? 'internal',
            timestamp: new Date().toISOString(),
        };

        this.stream$.next(envelope);
        return envelope;
    }

    streamForUser(userId: string): Observable<MessageEvent> {
        const channel = `user:${userId}`;
        return this.streamForChannel(channel);
    }

    streamForChannel(channel: string): Observable<MessageEvent> {
        return this.stream$.pipe(
            filter((message) => message.channel === channel),
            map((message) => ({
                type: message.event,
                data: {
                    id: message.id,
                    channel: message.channel,
                    event: message.event,
                    payload: message.payload,
                    source: message.source,
                    timestamp: message.timestamp,
                },
            }))
        );
    }
}
