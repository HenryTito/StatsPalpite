'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const { RefreshToken } = require('../models');

/**
 * Emissão e rotação de tokens (RF76).
 *
 * O access token é um JWT curto. O refresh token é opaco e aleatório, e o
 * banco guarda apenas o seu hash SHA-256: um vazamento da tabela não concede
 * sessão a ninguém.
 */

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    env.auth.jwtSecret,
    { expiresIn: env.auth.jwtExpiresIn },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueRefreshToken(user, { transaction } = {}) {
  const token = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.auth.refreshTokenDays);

  await RefreshToken.create(
    { userId: user.id, tokenHash: hashToken(token), expiresAt },
    { transaction },
  );

  return { token, expiresAt };
}

/**
 * Troca um refresh token por um novo par, invalidando o anterior.
 * @returns {Promise<{record: object, token: string, expiresAt: Date}>}
 */
async function rotateRefreshToken(oldToken) {
  const oldHash = hashToken(oldToken);
  const record = await RefreshToken.findOne({ where: { tokenHash: oldHash } });

  if (!record || !record.isActive()) {
    return null;
  }

  const next = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.auth.refreshTokenDays);

  const created = await RefreshToken.create({
    userId: record.userId,
    tokenHash: hashToken(next),
    expiresAt,
  });

  record.revokedAt = new Date();
  record.replacedByTokenHash = created.tokenHash;
  await record.save();

  return { record: created, token: next, expiresAt };
}

async function revokeRefreshToken(token) {
  const record = await RefreshToken.findOne({ where: { tokenHash: hashToken(token) } });
  if (!record || record.revokedAt) return false;
  record.revokedAt = new Date();
  await record.save();
  return true;
}

/** Encerra todas as sessões do usuário. Usado após troca de senha. */
async function revokeAllForUser(userId) {
  const [count] = await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
  return count;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
};
