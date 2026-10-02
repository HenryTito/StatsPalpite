import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setSessionExpiredHandler } from '../../core/api/client';
import { tokenStorage } from '../../core/api/tokenStorage';
import type { AuthUser } from '../../core/api/types';
import { identifyUser } from '../../core/observability/sentry';
import { authRepository } from '../../infrastructure/repositories/apiRepositories';

type SessionContextValue = {
  user: AuthUser | null;
  /** true enquanto restauramos a sessão guardada, no arranque. */
  restoring: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    username: string;
    password: string;
    passwordConfirmation: string;
    birthDate: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Sessão persistente (RF76).
 *
 * No arranque, se houver token guardado, valida contra /auth/me. O cliente
 * HTTP renova sozinho quando o access token venceu; só caímos para o login se
 * o refresh também falhar.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await tokenStorage.load();
      if (!stored) {
        if (!cancelled) setRestoring(false);
        return;
      }

      try {
        const { user: restored } = await authRepository.me();
        if (cancelled) return;
        setUser(restored);
        identifyUser(restored);
      } catch {
        await tokenStorage.clear();
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // O cliente HTTP avisa quando a renovação falhou de vez.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      identifyUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const session = await authRepository.login(input);
    setUser(session.user);
    identifyUser(session.user);
  }, []);

  const signUp = useCallback<SessionContextValue['signUp']>(async (input) => {
    const session = await authRepository.register(input);
    setUser(session.user);
    identifyUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
    identifyUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, restoring, signIn, signUp, signOut }),
    [user, restoring, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider');
  return context;
}
