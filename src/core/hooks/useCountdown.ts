import { useEffect, useRef, useState } from 'react';

import { formatCountdown, type Countdown } from '../i18n/formatCountdown';

/**
 * Contador regressivo que atualiza a cada segundo (RF43).
 *
 * O intervalo é limpo no desmonte — sem isso, cada card da lista deixaria um
 * timer rodando e o app vazaria memória conforme o usuário navega, que é
 * exatamente o que o requisito pede para evitar.
 */
export function useCountdown(kickoffAt: string | Date | null | undefined): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(() =>
    kickoffAt ? formatCountdown(kickoffAt) : null,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!kickoffAt) {
      setCountdown(null);
      return undefined;
    }

    const tick = () => {
      const next = formatCountdown(kickoffAt);
      setCountdown(next);
      // Depois do apito inicial não há mais o que contar.
      if (next.started && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [kickoffAt]);

  return countdown;
}
