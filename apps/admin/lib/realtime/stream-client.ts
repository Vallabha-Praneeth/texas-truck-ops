'use client';

export interface RealtimeStreamMessage {
  event: string;
  data: unknown;
}

export interface ConnectRealtimeStreamOptions {
  token: string;
  apiBaseUrl?: string;
  onOpen?: () => void;
  onMessage: (message: RealtimeStreamMessage) => void;
  onError?: (error: unknown) => void;
}

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

export function connectRealtimeStream({
  token,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  onOpen,
  onMessage,
  onError,
}: ConnectRealtimeStreamOptions): () => void {
  const controller = new AbortController();
  let active = true;

  const start = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/realtime/stream`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok || !response.body) {
        throw new Error(`Realtime stream failed with status ${response.status}`);
      }

      onOpen?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let eventName = 'message';
      let dataLines: string[] = [];

      const flushEvent = () => {
        if (dataLines.length === 0) {
          eventName = 'message';
          return;
        }

        const rawData = dataLines.join('\n');
        let parsedData: unknown = rawData;

        try {
          parsedData = JSON.parse(rawData);
        } catch {
          parsedData = rawData;
        }

        onMessage({
          event: eventName,
          data: parsedData,
        });

        eventName = 'message';
        dataLines = [];
      };

      while (active) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');

          if (line === '') {
            flushEvent();
            continue;
          }

          if (line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }
      }

      flushEvent();
    } catch (error) {
      if (active && !isAbortError(error)) {
        onError?.(error);
      }
    }
  };

  void start();

  return () => {
    active = false;
    controller.abort();
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
