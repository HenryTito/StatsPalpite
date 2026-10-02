'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const env = require('../config/env');
const { sequelize, User, PasswordReset } = require('../models');
const AppError = require('../utils/AppError');
const { calculateAge } = require('../utils/age');
const { validateUsername } = require('../utils/username');
const mailService = require('./mailService');
const tokenService = require('./tokenService');

const BCRYPT_ROUNDS = 10;

/**
 * Hash real de uma senha descartável, usado quando o e-mail não existe.
 *
 * Comparar contra uma string inventada não serve: o bcrypt rejeita o formato
 * e devolve em 0ms, enquanto uma conta real custa dezenas de milissegundos.
 * Essa diferença é mensurável e revela quais e-mails estão cadastrados. Com
 * um hash legítimo, o trabalho é o mesmo nos dois caminhos.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('senha-que-nunca-sera-usada', BCRYPT_ROUNDS);

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

/** Resposta padrão de sessão: usuário + par de tokens. */
async function buildSession(user) {
  const refresh = await tokenService.issueRefreshToken(user);
  return {
    user: user.toJSON(),
    accessToken: tokenService.signAccessToken(user),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
}

/**
 * Cadastro (RF01), com as validações do RF31 (idade) e do RF34 (nome de usuário).
 * Roda em transação: ou nasce o usuário com o refresh token, ou nada muda.
 */
async function register({ email, username, password, passwordConfirmation, birthDate }) {
  if (password !== passwordConfirmation) {
    throw AppError.unprocessable('A confirmação de senha não confere', {
      code: 'PASSWORD_MISMATCH',
    });
  }

  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    throw AppError.unprocessable(usernameCheck.reason, { code: 'INVALID_USERNAME' });
  }

  const age = calculateAge(birthDate);
  if (age < env.auth.minimumAge) {
    throw AppError.forbidden(
      `É necessário ter pelo menos ${env.auth.minimumAge} anos para usar o StatsPalpite`,
      { code: 'UNDERAGE', details: { age } },
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = String(username).trim().toLowerCase();

  const existing = await User.findOne({
    where: { [Op.or]: [{ email: normalizedEmail }, { username: normalizedUsername }] },
  });
  if (existing) {
    const field = existing.email === normalizedEmail ? 'e-mail' : 'nome de usuário';
    throw AppError.conflict(`Este ${field} já está em uso`, { code: 'ALREADY_TAKEN' });
  }

  const user = await sequelize.transaction(async (transaction) =>
    User.create(
      {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        birthDate,
      },
      { transaction },
    ),
  );

  return buildSession(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });

  // Compara mesmo sem usuário, para não revelar quais e-mails existem pelo
  // tempo de resposta. O hash de reserva é legítimo, então o custo é igual.
  const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_PASSWORD_HASH);

  if (!user || !matches) {
    throw AppError.unauthorized('E-mail ou senha incorretos', { code: 'INVALID_CREDENTIALS' });
  }

  return buildSession(user);
}

/** Troca o refresh token por um par novo (RF76). */
async function refresh({ refreshToken }) {
  const rotated = await tokenService.rotateRefreshToken(refreshToken);
  if (!rotated) {
    throw AppError.unauthorized('Refresh token inválido ou expirado', { code: 'INVALID_REFRESH' });
  }

  const user = await User.findByPk(rotated.record.userId);
  if (!user) {
    throw AppError.unauthorized('Usuário não encontrado', { code: 'INVALID_REFRESH' });
  }

  return {
    user: user.toJSON(),
    accessToken: tokenService.signAccessToken(user),
    refreshToken: rotated.token,
    refreshTokenExpiresAt: rotated.expiresAt,
  };
}

async function logout({ refreshToken }) {
  await tokenService.revokeRefreshToken(refreshToken);
  return { revoked: true };
}

/**
 * Início da recuperação de senha (RF02).
 *
 * Responde igual exista ou não a conta, para não funcionar como oráculo de
 * e-mails cadastrados.
 */
async function requestPasswordReset({ email }) {
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  const genericResponse = {
    message: 'Se houver uma conta com este e-mail, enviamos um link de redefinição',
  };

  if (!user) return genericResponse;

  // Invalida pedidos anteriores ainda abertos: um link ativo por vez.
  await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.auth.passwordResetMinutes * 60 * 1000);

  await PasswordReset.create({
    userId: user.id,
    tokenHash: tokenService.hashToken(token),
    expiresAt,
  });

  await mailService.sendPasswordResetEmail({
    to: user.email,
    username: user.username,
    resetUrl: `${env.appUrl}/redefinir-senha?token=${token}`,
    expiresInMinutes: env.auth.passwordResetMinutes,
  });

  // O token só volta na resposta quando isso é ligado de propósito
  // (EXPOSE_RESET_TOKEN), nunca por acaso: devolvê-lo entrega a redefinição
  // de senha de qualquer conta a quem souber o e-mail.
  return env.auth.exposeResetToken ? { ...genericResponse, token } : genericResponse;
}

/** Conclui a recuperação: valida o token, troca a senha e derruba as sessões. */
async function resetPassword({ token, password, passwordConfirmation }) {
  if (password !== passwordConfirmation) {
    throw AppError.unprocessable('A confirmação de senha não confere', {
      code: 'PASSWORD_MISMATCH',
    });
  }

  const record = await PasswordReset.findOne({
    where: { tokenHash: tokenService.hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw AppError.badRequest('Link de redefinição inválido ou expirado', {
      code: 'INVALID_RESET_TOKEN',
    });
  }

  const user = await User.findByPk(record.userId);
  if (!user) {
    throw AppError.badRequest('Link de redefinição inválido', { code: 'INVALID_RESET_TOKEN' });
  }

  await sequelize.transaction(async (transaction) => {
    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await user.save({ transaction });

    record.usedAt = new Date();
    await record.save({ transaction });
  });

  // Trocar a senha encerra sessões antigas, inclusive as de quem roubou a conta.
  await tokenService.revokeAllForUser(user.id);

  return { message: 'Senha alterada com sucesso' };
}

/** Disponibilidade de nome de usuário, consultada enquanto o usuário digita (RF34). */
async function checkUsernameAvailability(username) {
  const check = validateUsername(username);
  if (!check.valid) {
    return { available: false, reason: check.reason };
  }

  const taken = await User.findOne({ where: { username: String(username).trim().toLowerCase() } });
  return taken
    ? { available: false, reason: 'Este nome de usuário já está em uso' }
    : { available: true };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  requestPasswordReset,
  resetPassword,
  checkUsernameAvailability,
};
