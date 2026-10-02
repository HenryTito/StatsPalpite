import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/ApiError';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Recarrega mantendo os dados atuais na tela. */
  reload: () => void;
};

/**
 * Executa uma chamada assincrona e acompanha carregamento e erro.
 *
 * Guarda se o componente ainda esta montado: sem isso, uma resposta que chega
 * depois de o usuario sair da tela tenta atualizar estado desmontado.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // O fetcher muda de identidade a cada render; as deps declaradas mandam.
  const run = useCallback(fetcher, deps);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    run()
      .then((result) => {
        if (cancelled || !mounted.current) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (cancelled || !mounted.current) return;
        setError(caught instanceof ApiError ? caught : ApiError.offline());
      })
      .finally(() => {
        if (cancelled || !mounted.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  return { data, loading, error, reload };
}
