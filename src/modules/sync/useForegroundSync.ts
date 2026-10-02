import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** Intervalo exigido pelo RF48. */
export const SYNC_INTERVAL_MS = 5 * 60 * 1000;

type Options = {
  /** Desliga a sincronização sem desmontar a tela. */
  enabled?: boolean;
  intervalMs?: number;
};

/**
 * Sincroniza a lista de partidas a cada 5 minutos enquanto o app está em
 * primeiro plano (RF48).
 *
 * O timer é desarmado quando o app vai para segundo plano e rearmado na
 * volta — essa é a parte de "não consumir bateria excessivamente". Rodar em
 * background exigiria um serviço do sistema, que o requisito não pede.
 */
export function useForegroundSync(
  onSync: () => void | Promise<void>,
  { enabled = true, intervalMs = SYNC_INTERVAL_MS }: Options = {},
) {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(onSync);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Mantém o callback atual sem rearmar o intervalo a cada render.
  useEffect(() => {
    callbackRef.current = onSync;
  }, [onSync]);

  const runSync = useCallback(async () => {
    await callbackRef.current();
    setLastSyncedAt(new Date());
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    intervalRef.current = setInterval(() => {
      runSync().catch(() => undefined);
    }, intervalMs);
  }, [intervalMs, runSync, stop]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return undefined;
    }

    start();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const cameToForeground =
        appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;

      if (cameToForeground) {
        // Volta do segundo plano: sincroniza na hora, sem esperar o ciclo.
        runSync().catch(() => undefined);
        start();
      } else if (nextState !== 'active') {
        stop();
      }
    });

    return () => {
      subscription.remove();
      stop();
    };
  }, [enabled, runSync, start, stop]);

  return { lastSyncedAt, syncNow: runSync };
}
