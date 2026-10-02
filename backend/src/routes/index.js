'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const digestController = require('../controllers/digestController');
const matchController = require('../controllers/matchController');
const rankingController = require('../controllers/rankingController');
const searchController = require('../controllers/searchController');
const systemController = require('../controllers/systemController');
const { authenticate, optionalAuthenticate, requireRole } = require('../middlewares/authenticate');
const { audit } = require('../middlewares/auditLog');
const { validate } = require('../middlewares/validate');

const router = Router();

/**
 * Limite estreito nas rotas de credencial: elas são o alvo de força bruta e de
 * enumeração de e-mail. As rotas de leitura usam o limite geral do app.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas. Tente novamente em alguns minutos', code: 'RATE_LIMITED' } },
});

// Saúde e operação
router.get('/health', systemController.health);

// Autenticação — RF01, RF02, RF31, RF34, RF76
router.post(
  '/auth/register',
  authLimiter,
  validate({ body: authController.schemas.register }),
  audit('auth.register'),
  authController.register,
);
router.post(
  '/auth/login',
  authLimiter,
  validate({ body: authController.schemas.login }),
  audit('auth.login'),
  authController.login,
);
router.post('/auth/refresh', validate({ body: authController.schemas.refresh }), authController.refresh);
router.post(
  '/auth/logout',
  validate({ body: authController.schemas.refresh }),
  audit('auth.logout'),
  authController.logout,
);
router.post(
  '/auth/forgot-password',
  authLimiter,
  validate({ body: authController.schemas.forgotPassword }),
  audit('auth.forgot_password'),
  authController.forgotPassword,
);
router.post(
  '/auth/reset-password',
  authLimiter,
  validate({ body: authController.schemas.resetPassword }),
  audit('auth.reset_password'),
  authController.resetPassword,
);
router.get(
  '/auth/username-available',
  validate({ query: authController.schemas.usernameQuery }),
  authController.checkUsername,
);
router.get('/auth/me', authenticate, authController.me);

// Partidas — RF03, RF04, RF06, RF17, RF48
router.get('/matches', validate({ query: matchController.schemas.list }), matchController.list);
router.get(
  '/matches/:id',
  validate({ params: matchController.schemas.detail }),
  audit('match.view_statistics', (req) => `match:${req.params.id}`),
  matchController.detail,
);
router.get('/compare', validate({ query: matchController.schemas.compare }), matchController.compare);

// Busca — RF27, RF56, RF49
router.get('/search', validate({ query: searchController.schemas.global }), searchController.global);
router.get(
  '/search/players',
  validate({ query: searchController.schemas.players }),
  searchController.players,
);
router.get('/venues', searchController.venues);

// Ranking — RF11, RF71, RF86
router.get('/ranking', validate({ query: rankingController.schemas.list }), rankingController.list);
router.get('/ranking/me', authenticate, rankingController.myPosition);
router.get(
  '/ranking/me/history',
  authenticate,
  validate({ query: rankingController.schemas.history }),
  rankingController.myHistory,
);

// Resumos — RF53, RF77
router.get(
  '/digest/daily',
  optionalAuthenticate,
  validate({ query: digestController.schemas.daily }),
  digestController.daily,
);
router.get(
  '/digest/previous-round',
  validate({ query: digestController.schemas.bulletin }),
  digestController.bulletin,
);

// Operação restrita a administradores
router.post('/admin/sync', authenticate, requireRole('admin'), audit('admin.sync'), systemController.sync);
router.post(
  '/admin/ranking/snapshot',
  authenticate,
  requireRole('admin'),
  audit('admin.ranking_snapshot'),
  systemController.snapshotRanking,
);

module.exports = router;
