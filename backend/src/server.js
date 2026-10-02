'use strict';

const { createApp } = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('banco conectado', { database: env.database.name });
  } catch (error) {
    logger.error('não foi possível conectar ao banco', { error: error.message });
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info('API no ar', { port: env.port, env: env.nodeEnv });
  });

  // Encerramento limpo: para de aceitar conexões antes de fechar o pool.
  const shutdown = (signal) => async () => {
    logger.info('encerrando', { signal });
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
}

if (require.main === module) {
  start();
}

module.exports = { start };
