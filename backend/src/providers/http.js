'use strict';

/** Erro de fonte externa. O motor de ingestão o reconhece para acionar o fallback. */
class ProviderError extends Error {
  constructor(provider, message, { status = null, cause = null } = {}) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
    this.provider = provider;
    this.status = status;
    this.cause = cause;
  }
}

/**
 * GET em JSON com timeout. Sem dependência de cliente HTTP: o fetch global do
 * Node 22+ resolve, e um timeout explícito evita que uma fonte lenta segure a
 * requisição do usuário.
 */
async function getJson(url, { headers = {}, timeoutMs = 8000, provider = 'http' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      throw new ProviderError(provider, `resposta ${response.status} em ${url}`, {
        status: response.status,
      });
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    const reason = error.name === 'AbortError' ? `timeout de ${timeoutMs}ms` : error.message;
    throw new ProviderError(provider, `falha em ${url}: ${reason}`, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getJson, ProviderError };
