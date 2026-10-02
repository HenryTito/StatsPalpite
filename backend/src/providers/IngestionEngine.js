'use strict';

const logger = require('../config/logger');
const { MemoryTtlCache } = require('./cache/TtlCache');

/**
 * Motor de ingestão (B008).
 *
 * Três responsabilidades, e só elas:
 *   1. cache com TTL por tipo de recurso, para não castigar a fonte externa;
 *   2. fallback para a fonte secundária quando a primária falha (RNF11);
 *   3. registro de qual fonte respondeu, para o relatório de disponibilidade.
 *
 * Não sabe nada sobre HTTP nem sobre o formato das fontes — isso é dos
 * adapters e dos tradutores. Também não sabe nada sobre o banco: quem
 * persiste é o IngestionService.
 */
class IngestionEngine {
  /**
   * @param {{primary: object, secondary?: object|null, cache?: object, ttl?: object}} deps
   */
  constructor({ primary, secondary = null, cache = new MemoryTtlCache(), ttl = {} }) {
    if (!primary) throw new Error('IngestionEngine exige um provedor primário');
    this.primary = primary;
    this.secondary = secondary;
    this.cache = cache;
    this.ttl = {
      matches: 300,
      statistics: 900,
      injuries: 3600,
      referees: 86400,
      catalog: 86400,
      ...ttl,
    };
    /** Contadores expostos em GET /health para evidenciar o RNF11. */
    this.stats = { hits: 0, misses: 0, primaryFailures: 0, fallbacks: 0 };
  }

  /** Executa `operation` na fonte primária e, se ela falhar, na secundária. */
  async withFallback(operation, method, args = []) {
    try {
      return await this.primary[method](...args);
    } catch (primaryError) {
      this.stats.primaryFailures += 1;
      logger.warn('fonte primária falhou', {
        operation,
        provider: this.primary.name,
        error: primaryError.message,
      });

      if (!this.secondary) throw primaryError;

      try {
        const result = await this.secondary[method](...args);
        this.stats.fallbacks += 1;
        logger.info('fallback atendeu a requisição', {
          operation,
          provider: this.secondary.name,
        });
        return result;
      } catch (secondaryError) {
        logger.error('fonte secundária também falhou', {
          operation,
          provider: this.secondary.name,
          error: secondaryError.message,
        });
        // A primária é a causa raiz; a secundária apenas não salvou a operação.
        throw primaryError;
      }
    }
  }

  /** Resolve pelo cache; em caso de falta, busca na fonte e grava. */
  async cached(key, ttlSeconds, resolver) {
    const hit = await this.cache.get(key);
    if (hit !== undefined) {
      this.stats.hits += 1;
      return hit;
    }
    this.stats.misses += 1;
    const value = await resolver();
    await this.cache.set(key, value, ttlSeconds);
    return value;
  }

  async getLeagues() {
    return this.cached('leagues', this.ttl.catalog, () =>
      this.withFallback('leagues', 'fetchLeagues'),
    );
  }

  async getVenues() {
    return this.cached('venues', this.ttl.catalog, () =>
      this.withFallback('venues', 'fetchVenues'),
    );
  }

  async getTeams() {
    return this.cached('teams', this.ttl.catalog, () => this.withFallback('teams', 'fetchTeams'));
  }

  async getPlayers() {
    return this.cached('players', this.ttl.catalog, () =>
      this.withFallback('players', 'fetchPlayers'),
    );
  }

  async getMatches({ from, to } = {}) {
    const key = `matches:${from ? from.toISOString() : 'all'}:${to ? to.toISOString() : 'all'}`;
    return this.cached(key, this.ttl.matches, () =>
      this.withFallback('matches', 'fetchMatches', [{ from, to }]),
    );
  }

  /**
   * @param {string[]|null} matchExternalIds null pede todas; uma lista pede
   * exatamente aquelas, e uma lista vazia pede nenhuma.
   */
  async getStatistics(matchExternalIds = null) {
    const key = `statistics:${matchExternalIds ? [...matchExternalIds].sort().join(',') : 'all'}`;
    return this.cached(key, this.ttl.statistics, () =>
      this.withFallback('statistics', 'fetchStatistics', [matchExternalIds]),
    );
  }

  async getInjuries() {
    return this.cached('injuries', this.ttl.injuries, () =>
      this.withFallback('injuries', 'fetchInjuries'),
    );
  }

  async getReferees() {
    return this.cached('referees', this.ttl.referees, () =>
      this.withFallback('referees', 'fetchReferees'),
    );
  }

  /**
   * Busca o catálogo inteiro de UMA única fonte.
   *
   * O fallback por operação serve bem às leituras avulsas, mas não a uma
   * sincronização: ligas vindas de uma fonte e times de outra não casam,
   * porque cada fonte usa o seu próprio identificador externo. O resultado é
   * um catálogo em que nenhuma partida encontra o seu time, e todas são
   * descartadas. Aqui a escolha é feita uma vez e vale para o lote.
   *
   * @param {{from?: Date, to?: Date}} range
   */
  async getCatalog({ from, to } = {}) {
    const fetchAll = async (provider) => {
      const [leagues, venues, teams, players, referees, matches, injuries] = [
        await provider.fetchLeagues(),
        await provider.fetchVenues(),
        await provider.fetchTeams(),
        await provider.fetchPlayers(),
        await provider.fetchReferees(),
        await provider.fetchMatches({ from, to }),
        await provider.fetchInjuries(),
      ];
      const statistics = await provider.fetchStatistics(matches.map((match) => match.externalId));
      return {
        source: provider.name,
        leagues,
        venues,
        teams,
        players,
        referees,
        matches,
        injuries,
        statistics,
      };
    };

    try {
      return await fetchAll(this.primary);
    } catch (primaryError) {
      this.stats.primaryFailures += 1;
      logger.warn('fonte primária falhou durante a sincronização', {
        provider: this.primary.name,
        error: primaryError.message,
      });

      if (!this.secondary) throw primaryError;

      const result = await fetchAll(this.secondary);
      this.stats.fallbacks += 1;
      logger.info('catálogo inteiro veio da fonte secundária', { provider: this.secondary.name });
      return result;
    }
  }

  /** Estado das fontes, consumido pelo endpoint de saúde. */
  async health() {
    const [primaryUp, secondaryUp] = await Promise.all([
      this.primary.healthCheck().catch(() => false),
      this.secondary ? this.secondary.healthCheck().catch(() => false) : Promise.resolve(null),
    ]);
    return {
      primary: { name: this.primary.name, healthy: primaryUp },
      secondary: this.secondary ? { name: this.secondary.name, healthy: secondaryUp } : null,
      cache: { ...this.stats },
    };
  }

  async invalidate() {
    await this.cache.clear();
  }
}

module.exports = IngestionEngine;
