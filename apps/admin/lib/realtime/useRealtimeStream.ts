'use client';

import { useEffect } from 'react';
import {
  connectRealtimeStream,
  RealtimeStreamMessage,
} from './stream-client';

interface UseRealtimeStreamOptions {
  token: string | null;
  enabled?: boolean;
  apiBaseUrl?: string;
  onOpen?: () => void;
  onMessage: (message: RealtimeStreamMessage) => void;
  onError?: (error: unknown) => void;
}

export function useRealtimeStream({
  token,
  enabled = true,
  apiBaseUrl,
  onOpen,
  onMessage,
  onError,
}: UseRealtimeStreamOptions) {
  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    const disconnect = connectRealtimeStream({
      token,
      apiBaseUrl,
      onOpen,
      onMessage,
      onError,
    });

    return () => {
      disconnect();
    };
  }, [apiBaseUrl, enabled, onError, onMessage, onOpen, token]);
}
