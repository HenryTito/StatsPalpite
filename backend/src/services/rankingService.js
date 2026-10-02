'use strict';

const { Op, QueryTypes } = require('sequelize');

const { sequelize, User, RankingSnapshot } = require('../models');
const AppError = require('../utils/AppError');

/** Janela do gráfico de evolução do RF71. */
const HISTORY_DAYS = 30;

/** Ranking global paginado, ordenado por pontos. */
async function listRanking({ limit = 50, offset = 0 } = {}) {
  const { rows, count } = await User.findAndCountAll({
    attributes: ['id', 'username', 'points'],
    order: [
      ['points', 'DESC'],
      // Desempate estável: sem isto, usuários empatados trocam de lugar entre páginas.
      ['createdAt', 'ASC'],
    ],
    limit: Math.min(Number(limit) || 50, 100),
    offset: Number(offset) || 0,
  });

  const start = Number(offset) || 0;
  return {
    total: count,
    entries: rows.map((user, index) => ({
      position: start + index + 1,
      userId: user.id,
      username: user.username,
      points: user.points,
    })),
  };
}

/** Posição de um usuário e a distância para subir (RF86). */
async function getUserPosition(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound('Usuário não encontrado');

  const [{ position }] = await sequelize.query(
    `
      SELECT COUNT(*) + 1 AS position
      FROM users
      WHERE deleted_at IS NULL
        AND (points > :points OR (points = :points AND created_at < :createdAt))
    `,
    {
      replacements: { points: user.points, createdAt: user.createdAt },
      type: QueryTypes.SELECT,
    },
  );

  // Quem está imediatamente acima define quantos pontos faltam.
  const [above] = await User.findAll({
    attributes: ['points'],
    where: { points: { [Op.gt]: user.points } },
    order: [['points', 'ASC']],
    limit: 1,
  });

  const [leader] = await User.findAll({
    attributes: ['points'],
    order: [['points', 'DESC']],
    limit: 1,
  });

  return {
    userId: user.id,
    username: user.username,
    position: Number(position),
    points: user.points,
    pointsToClimb: above ? above.points - user.points + 1 : 0,
    leaderPoints: leader ? leader.points : user.points,
  };
}

/**
 * Evolução da posição nos últimos 30 dias (RF71).
 *
 * Lê os retratos diários gravados por captureDailySnapshot. Dias sem registro
 * ficam de fora em vez de virarem zero — uma posição 0 no gráfico seria
 * mentira, e o app sabe lidar com série esparsa.
 */
async function getRankingHistory(userId, { days = HISTORY_DAYS } = {}) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound('Usuário não encontrado');

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (Number(days) || HISTORY_DAYS));

  const snapshots = await RankingSnapshot.findAll({
    where: { userId, capturedOn: { [Op.gte]: since.toISOString().slice(0, 10) } },
    order: [['capturedOn', 'ASC']],
  });

  const points = snapshots.map((snapshot) => ({
    date: snapshot.capturedOn,
    position: snapshot.position,
    points: snapshot.points,
  }));

  const first = points[0];
  const last = points[points.length - 1];

  return {
    userId,
    days: Number(days) || HISTORY_DAYS,
    points,
    // Posição menor é melhor, então subir no ranking é uma variação negativa.
    change: first && last ? first.position - last.position : 0,
    best: points.length ? Math.min(...points.map((point) => point.position)) : null,
    worst: points.length ? Math.max(...points.map((point) => point.position)) : null,
  };
}

/**
 * Grava o retrato do ranking do dia. Idempotente: rodar duas vezes no mesmo
 * dia atualiza a linha em vez de duplicar.
 */
async function captureDailySnapshot({ date = new Date() } = {}) {
  const capturedOn = date.toISOString().slice(0, 10);

  const users = await User.findAll({
    attributes: ['id', 'points'],
    order: [
      ['points', 'DESC'],
      ['createdAt', 'ASC'],
    ],
  });

  await sequelize.transaction(async (transaction) => {
    for (const [index, user] of users.entries()) {
      const payload = { userId: user.id, capturedOn, position: index + 1, points: user.points };
      await RankingSnapshot.findOrCreate({
        where: { userId: user.id, capturedOn },
        defaults: payload,
        transaction,
      }).then(([snapshot, created]) =>
        created ? snapshot : snapshot.update(payload, { transaction }),
      );
    }
  });

  return { capturedOn, users: users.length };
}

module.exports = {
  listRanking,
  getUserPosition,
  getRankingHistory,
  captureDailySnapshot,
  HISTORY_DAYS,
};
