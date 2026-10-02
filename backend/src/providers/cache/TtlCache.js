'use strict';

/**
 * Contrato de cache do motor de ingestão (B008).
 *
 * A implementação em memória atende a Sprint 1. O RNF02 (10.000 simultâneos)
 * é da Sprint 3 e troca isto por Redis: basta uma classe que honre os mesmos
 * quatro métodos, sem tocar em quem consome.
 */
class TtlCache {
  // eslint-disable-next-line no-unused-vars
  async get(key) {
    throw new Error('não implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async set(key, value, ttlSeconds) {
    throw new Error('não implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async delete(key) {
    throw new Error('não implementado');
  }

  async clear() {
    throw new Error('não implementado');
  }
}

class MemoryTtlCache extends TtlCache {
  constructor() {
    super();
    /** @type {Map<string, {value: unknown, expiresAt: number}>} */
    this.entries = new Map();
  }

  async get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds) {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return value;
  }

  async delete(key) {
    this.entries.delete(key);
  }

  async clear() {
    this.entries.clear();
  }

  /** Remove entradas vencidas. Chamado por um job periódico, não pelo caminho quente. */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}

module.exports = { TtlCache, MemoryTtlCache };
