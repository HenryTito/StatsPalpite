'use strict';

const IngestionEngine = require('../../src/providers/IngestionEngine');
const LocalFootballProvider = require('../../src/providers/football/LocalFootballProvider');
const { MemoryTtlCache } = require('../../src/providers/cache/TtlCache');

/** Provedor que falha sempre, para exercitar o fallback. */
function brokenProvider(name = 'quebrada') {
  const fail = () => Promise.reject(new Error('503 Service Unavailable'));
  return {
    name,
    healthCheck: async () => false,
    fetchLeagues: fail,
    fetchVenues: fail,
    fetchTeams: fail,
    fetchPlayers: fail,
    fetchMatches: fail,
    fetchStatistics: fail,
    fetchInjuries: fail,
    fetchReferees: fail,
  };
}

describe('motor de ingestão (B008)', () => {
  it('exige um provedor primário', () => {
    expect(() => new IngestionEngine({})).toThrow(/primário/);
  });

  it('devolve DTOs do domínio, não o formato da fonte', async () => {
    const engine = new IngestionEngine({ primary: new LocalFootballProvider() });
    const [match] = await engine.getMatches();

    // Campos do domínio presentes...
    expect(match).toHaveProperty('externalId');
    expect(match).toHaveProperty('kickoffAt');
    expect(['scheduled', 'live', 'finished', 'postponed', 'cancelled']).toContain(match.status);
    // ...e nenhum vazamento do vocabulário da fonte.
    expect(match).not.toHaveProperty('fixture_id');
    expect(match).not.toHaveProperty('situacao');
    expect(match).not.toHaveProperty('placar');
  });

  it('converte posse de bola de "54.3%" para número', async () => {
    const engine = new IngestionEngine({ primary: new LocalFootballProvider() });
    const [stat] = await engine.getStatistics();
    expect(typeof stat.homePossession).toBe('number');
    expect(stat.homePossession).toBeGreaterThan(0);
  });

  it('serve do cache na segunda chamada', async () => {
    const engine = new IngestionEngine({ primary: new LocalFootballProvider() });
    await engine.getMatches();
    await engine.getMatches();
    expect(engine.stats.misses).toBe(1);
    expect(engine.stats.hits).toBe(1);
  });

  it('respeita o TTL e volta à fonte quando a entrada vence', async () => {
    const cache = new MemoryTtlCache();
    const engine = new IngestionEngine({
      primary: new LocalFootballProvider(),
      cache,
      ttl: { matches: 1 },
    });

    await engine.getMatches();
    // Força o vencimento sem esperar o relógio.
    cache.entries.forEach((entry) => {
      entry.expiresAt = Date.now() - 1;
    });
    await engine.getMatches();

    expect(engine.stats.misses).toBe(2);
  });

  it('cai para a fonte secundária quando a primária falha (RNF11)', async () => {
    const engine = new IngestionEngine({
      primary: brokenProvider(),
      secondary: new LocalFootballProvider(),
    });

    const matches = await engine.getMatches();

    expect(matches.length).toBeGreaterThan(0);
    expect(engine.stats.primaryFailures).toBe(1);
    expect(engine.stats.fallbacks).toBe(1);
  });

  it('propaga o erro da primária quando não há secundária', async () => {
    const engine = new IngestionEngine({ primary: brokenProvider() });
    await expect(engine.getMatches()).rejects.toThrow(/503/);
  });

  it('propaga o erro da primária quando a secundária também cai', async () => {
    const engine = new IngestionEngine({
      primary: brokenProvider('primaria'),
      secondary: brokenProvider('secundaria'),
    });
    // A causa raiz é a primária; a secundária apenas não salvou a operação.
    await expect(engine.getMatches()).rejects.toThrow(/503/);
    expect(engine.stats.fallbacks).toBe(0);
  });

  it('relata a saúde das duas fontes', async () => {
    const engine = new IngestionEngine({
      primary: brokenProvider(),
      secondary: new LocalFootballProvider(),
    });
    const health = await engine.health();

    expect(health.primary.healthy).toBe(false);
    expect(health.secondary.healthy).toBe(true);
  });
});

describe('cache com TTL', () => {
  it('devolve undefined depois do vencimento', async () => {
    const cache = new MemoryTtlCache();
    await cache.set('k', 'v', 60);
    expect(await cache.get('k')).toBe('v');

    cache.entries.get('k').expiresAt = Date.now() - 1;
    expect(await cache.get('k')).toBeUndefined();
  });

  it('remove as entradas vencidas na limpeza', async () => {
    const cache = new MemoryTtlCache();
    await cache.set('viva', 1, 60);
    await cache.set('morta', 2, 60);
    cache.entries.get('morta').expiresAt = Date.now() - 1;

    cache.prune();

    expect(cache.entries.has('viva')).toBe(true);
    expect(cache.entries.has('morta')).toBe(false);
  });
});
