'use strict';

const rateLimit = require('express-rate-limit');

const env = require('../config/env');

/**
 * Limites de requisição.
 *
 * Em teste os dois são desligados: a suíte faz dezenas de chamadas de
 * autenticação em segundos e bateria no teto, transformando falhas de
 * negócio em 429 e escondendo o que o teste realmente verifica. O limite
 * em si é coberto por `tests/integration/rateLimit.test.js`, que monta um
 * app com ele explicitamente ligado.
 */
const skipInTests = () => env.isTest;

/** Teto estreito nas rotas de credencial, alvo de força bruta e enumeração. */
function createAuthLimiter({ enabled = !env.isTest } = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: enabled ? () => false : () => true,
    message: {
      error: {
        message: 'Muitas tentativas. Tente novamente em alguns minutos',
        code: 'RATE_LIMITED',
      },
    },
  });
}

/** Teto geral da API. */
function createGlobalLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
  });
}

module.exports = { createAuthLimiter, createGlobalLimiter };
