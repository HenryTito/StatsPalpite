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

  /**
   * Confiar em X-Forwarded-For só quando há proxy de verdade na frente.
   *
   * Com `trust proxy` ligado sem proxy, qualquer cliente forja o cabeçalho,
   * ganha um IP novo a cada requisição e escapa do limite de tentativas de
   * login — força bruta sem teto. O valor vem de TRUST_PROXY_HOPS, que o
   * deploy define conforme a sua topologia (1 para Railway, Render ou nginx).
   */
  app.set('trust proxy', env.http.trustProxyHops);

  // RNF07: cabeçalhos de segurança. HSTS só faz sentido sob HTTPS real.
  app.use(
    helmet({
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  // Sem CORS_ORIGINS definido, libera geral — aceitável em desenvolvimento,
  // já que o consumidor é um app nativo, e restringível em produção.
  app.use(cors(env.http.corsOrigins.length ? { origin: env.http.corsOrigins } : undefined));

  // RNF03: compressão do payload, parte da meta de menos de 50 MB por mês.
  app.use(compression());

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  // Corpo malformado ou grande demais é erro do cliente, não do servidor:
  // sem isto o express.json propaga um SyntaxError e a API responde 500.
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({
        error: { message: 'Corpo da requisição não é um JSON válido', code: 'INVALID_JSON' },
      });
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({
        error: { message: 'Corpo da requisição grande demais', code: 'PAYLOAD_TOO_LARGE' },
      });
    }
    return next(error);
  });

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
