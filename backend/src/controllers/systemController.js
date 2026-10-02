'use strict';

const { sequelize } = require('../models');
const { getIngestionEngine } = require('../providers');
const ingestionService = require('../services/ingestionService');
const rankingService = require('../services/rankingService');

/**
 * Saúde do serviço. Expõe o estado das fontes e os contadores de fallback,
 * que são a evidência prática do RNF11.
 */
async function health(req, res) {
  const database = await sequelize
    .authenticate()
    .then(() => ({ healthy: true }))
    .catch((error) => ({ healthy: false, error: error.message }));

  const providers = await getIngestionEngine().health();
  const healthy = database.healthy && providers.primary.healthy;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    database,
    providers,
  });
}

/** Dispara a sincronização com a fonte externa. Restrita a administradores. */
async function sync(req, res, next) {
  try {
    const days = Number(req.query.days) || 30;
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 7);

    res.json(await ingestionService.syncAll({ from, to }));
  } catch (error) {
    next(error);
  }
}

/** Grava o retrato diário do ranking, que alimenta o RF71. */
async function snapshotRanking(req, res, next) {
  try {
    res.json(await rankingService.captureDailySnapshot());
  } catch (error) {
    next(error);
  }
}

module.exports = { health, sync, snapshotRanking };
