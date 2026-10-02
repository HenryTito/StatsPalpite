import { ApiError } from './ApiError';
import { apiConfig } from './config';
import { tokenStorage } from './tokenStorage';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Rotas publicas nao anexam o token nem tentam renovar a sessao. */
  authenticated?: boolean;
  signal?: AbortSignal;
};

/** Chamado quando a sessao expira de vez, para a UI voltar ao login. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${apiConfig.baseUrl}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: { error?: { message?: string; code?: string; details?: unknown } } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return new ApiError(
    payload?.error?.message ?? `Erro ${response.status}`,
    response.status,
    payload?.error?.code ?? null,
    payload?.error?.details ?? null,
  );
}

/** Uma requisicao, sem a logica de renovacao de sessao. */
async function execute<T>(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  // Um abort externo tambem precisa cancelar esta requisicao.
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.offline();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Renovacao de sessao (RF76).
 *
 * A promessa fica guardada enquanto corre: se cinco telas receberem 401 ao
 * mesmo tempo, todas esperam a mesma renovacao em vez de dispararem cinco,
 * o que invalidaria os tokens umas das outras pela rotacao.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const stored = await tokenStorage.load();
    if (!stored) return null;

    try {
      const renewed = await execute<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { method: 'POST', body: { refreshToken: stored.refreshToken } },
        null,
      );
      await tokenStorage.save(renewed);
      return renewed.accessToken;
    } catch {
      await tokenStorage.clear();
      onSessionExpired?.();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Cliente HTTP da API, com renovacao automatica de sessao. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authenticated = options.authenticated ?? false;
  const stored = authenticated ? await tokenStorage.load() : null;

  try {
    return await execute<T>(path, options, stored?.accessToken ?? null);
  } catch (error) {
    const shouldRetry =
      authenticated && error instanceof ApiError && error.isUnauthorized && stored !== null;
    if (!shouldRetry) throw error;

    const freshToken = await refreshSession();
    if (!freshToken) throw error;
    return execute<T>(path, options, freshToken);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
};
