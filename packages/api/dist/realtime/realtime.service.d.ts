import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InternalEmitRequest, RealtimeEnvelope } from './realtime.types';
export declare class RealtimeService {
    private readonly stream$;
    emit(input: InternalEmitRequest & {
        source?: string;
    }): RealtimeEnvelope;
    streamForUser(userId: string): Observable<MessageEvent>;
    streamForChannel(channel: string): Observable<MessageEvent>;
}
//# sourceMappingURL=realtime.service.d.ts.map