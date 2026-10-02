'use strict';

const env = require('../config/env');
const logger = require('../config/logger');
const IngestionEngine = require('./IngestionEngine');
const { MemoryTtlCache } = require('./cache/TtlCache');
const ApiFootballProvider = require('./football/ApiFootballProvider');
const FootballDataProvider = require('./football/FootballDataProvider');
const LocalFootballProvider = require('./football/LocalFootballProvider');
const LocalWeatherProvider = require('./weather/LocalWeatherProvider');
const OpenWeatherProvider = require('./weather/OpenWeatherProvider');

/**
 * Monta os provedores a partir do ambiente. Sem chave configurada, a fonte
 * local assume — o app segue funcional e o RNF11 continua exercitado.
 */
function buildFootballProvider(kind) {
  switch (kind) {
    case 'api-football':
      if (!env.providers.apiFootballKey) {
        logger.warn('API_FOOTBALL_KEY ausente; usando a fonte local no lugar');
        return new LocalFootballProvider();
      }
      return new ApiFootballProvider({ apiKey: env.providers.apiFootballKey });

    case 'football-data':
      if (!env.providers.footballDataKey) {
        logger.warn('FOOTBALL_DATA_KEY ausente; usando a fonte local no lugar');
        return new LocalFootballProvider();
      }
      return new FootballDataProvider({ apiKey: env.providers.footballDataKey });

    case 'local':
    default:
      return new LocalFootballProvider();
  }
}

function buildWeatherProvider() {
  if (!env.providers.openWeatherKey) return new LocalWeatherProvider();
  return new OpenWeatherProvider({ apiKey: env.providers.openWeatherKey });
}

let engine = null;
let weatherProvider = null;

function getIngestionEngine() {
  if (!engine) {
    const primary = buildFootballProvider(env.providers.primary);
    const secondaryKind = env.providers.secondary;
    // Secundária igual à primária não é fallback; é o mesmo ponto de falha.
    const secondary =
      secondaryKind && secondaryKind !== env.providers.primary
        ? buildFootballProvider(secondaryKind)
        : new LocalFootballProvider();

    engine = new IngestionEngine({
      primary,
      secondary,
      cache: new MemoryTtlCache(),
      ttl: {
        matches: env.cache.matches,
        statistics: env.cache.statistics,
        injuries: env.cache.injuries,
        referees: env.cache.referee,
      },
    });
  }
  return engine;
}

function getWeatherProvider() {
  if (!weatherProvider) weatherProvider = buildWeatherProvider();
  return weatherProvider;
}

/** Usado pelos testes para injetar dublês. */
function resetProviders({ ingestion = null, weather = null } = {}) {
  engine = ingestion;
  weatherProvider = weather;
}

module.exports = {
  getIngestionEngine,
  getWeatherProvider,
  resetProviders,
  IngestionEngine,
  LocalFootballProvider,
  LocalWeatherProvider,
};
