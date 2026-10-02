import * as Sentry from '@sentry/react-native';

/**
 * Monitoramento de erros (RNF08), que sustenta a meta de menos de 1% de crash.
 *
 * Sem DSN configurado o Sentry fica inerte: em desenvolvimento não faz sentido
 * mandar ruído para o painel, e o app precisa rodar sem a variável.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const sentryEnabled = dsn.length > 0;

export function initSentry(): void {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn,
    // Amostragem de performance baixa: o que interessa aqui é crash, não traço.
    tracesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    environment: __DEV__ ? 'development' : 'production',
  });
}

/** Associa os erros ao usuário, sem enviar e-mail nem dado pessoal. */
export function identifyUser(user: { id: string; username: string } | null): void {
  if (!sentryEnabled) return;
  Sentry.setUser(user ? { id: user.id, username: user.username } : null);
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryEnabled) {
    if (__DEV__) console.warn('[erro]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!sentryEnabled) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}
