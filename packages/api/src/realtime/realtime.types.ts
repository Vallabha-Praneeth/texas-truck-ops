export interface RealtimeEnvelope {
    id: string;
    channel: string;
    event: string;
    payload: Record<string, unknown>;
    source: string;
    timestamp: string;
}

export interface InternalEmitRequest {
    channel: string;
    event: string;
    payload?: Record<string, unknown>;
}
