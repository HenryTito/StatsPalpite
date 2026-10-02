'use strict';

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const env = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { createGlobalLimiter } = require('./middlewares/rateLimiters');
const routes = require('./routes');

function createApp() {
  const app = express();

  // Atrás de proxy (Railway, Render, nginx), req.ip precisa vir do X-Forwarded-For
  // para o rate limit não tratar todo o tráfego como um único cliente.
  app.set('trust proxy', 1);

  // RNF07: cabeçalhos de segurança. HSTS só faz sentido sob HTTPS real.
  app.use(
    helmet({
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  app.use(cors());

  // RNF03: compressão do payload, parte da meta de menos de 50 MB por mês.
  app.use(compression());

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Teto geral de requisições; as rotas de credencial têm o seu, mais estreito.
  app.use(createGlobalLimiter());

  app.use('/api/v1', routes);

  app.get('/', (req, res) => {
    res.json({ name: 'StatsPalpite API', version: '0.1.0', docs: '/api/v1/health' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
