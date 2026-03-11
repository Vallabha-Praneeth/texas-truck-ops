'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RealtimeStreamMessage,
} from '@/lib/realtime/stream-client';
import { useRealtimeStream } from '@/lib/realtime/useRealtimeStream';

interface EventItem extends RealtimeStreamMessage {
  receivedAt: string;
}

interface RealtimeEventsPanelProps {
  onEvent?: (message: RealtimeStreamMessage) => void;
}

/**
 * Example-only panel that shows how the admin UI can subscribe to
 * `/realtime/stream` with a JWT from localStorage.
 */
export function RealtimeEventsPanel({ onEvent }: RealtimeEventsPanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const handleStreamOpen = useCallback(() => {
    setIsStreamReady(true);
    setError('');
  }, []);

  const handleStreamMessage = useCallback(
    (message: RealtimeStreamMessage) => {
      onEvent?.(message);
      setEvents((prev) => [
        {
          ...message,
          receivedAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20));
    },
    [onEvent]
  );

  const handleStreamError = useCallback((streamError: unknown) => {
    setIsStreamReady(false);
    const message =
      streamError instanceof Error
        ? streamError.message
        : 'Unknown realtime stream error';
    setError(message);
  }, []);

  useRealtimeStream({
    token,
    enabled: !!token,
    onOpen: handleStreamOpen,
    onMessage: handleStreamMessage,
    onError: handleStreamError,
  });

  const latest = useMemo(() => events[0], [events]);

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Realtime Events Example
        </h3>
        <span
          data-testid="realtime-connection-status"
          className="text-xs text-slate-500"
        >
          {token
            ? `Connected with JWT · ${
                isStreamReady ? 'stream ready' : 'stream connecting'
              }`
            : 'No token found'}
        </span>
      </div>

      {error ? (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {!latest ? (
        <p className="text-xs text-slate-500">
          Waiting for events on `/realtime/stream`...
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Latest event: <span className="font-mono">{latest.event}</span>
          </p>
          <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(events, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
