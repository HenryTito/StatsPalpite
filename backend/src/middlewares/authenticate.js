'use strict';

const { User } = require('../models');
const AppError = require('../utils/AppError');
const tokenService = require('../services/tokenService');

/** Extrai o token de `Authorization: Bearer <token>`. */
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/** Exige um access token válido e carrega req.user. */
async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized('Token de acesso ausente', { code: 'MISSING_TOKEN' });
    }

    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch (error) {
      const expired = error.name === 'TokenExpiredError';
      throw AppError.unauthorized(expired ? 'Token expirado' : 'Token inválido', {
        code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      throw AppError.unauthorized('Usuário não encontrado', { code: 'INVALID_TOKEN' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Carrega req.user quando há token, mas deixa passar sem ele.
 * Usado no resumo diário, que é mais rico para quem está logado (RF53).
 */
async function optionalAuthenticate(req, res, next) {
  if (!extractToken(req)) return next();
  return authenticate(req, res, (error) => (error ? next() : next()));
}

/** Restringe a rota a administradores (RF14). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Autenticação obrigatória', { code: 'MISSING_TOKEN' }));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Permissão insuficiente', { code: 'FORBIDDEN_ROLE' }));
    }
    return next();
  };
}

module.exports = { authenticate, optionalAuthenticate, requireRole, extractToken };
