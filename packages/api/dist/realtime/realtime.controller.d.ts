import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RealtimeService } from './realtime.service';
export declare class RealtimeController {
    private readonly realtimeService;
    constructor(realtimeService: RealtimeService);
    stream(req: any): Observable<MessageEvent>;
}
//# sourceMappingURL=realtime.controller.d.ts.map