'use strict';

const { Op, fn, col, literal } = require('sequelize');

const { Match, League, Team, Prediction, User } = require('../models');
const matchService = require('./matchService');
const rankingService = require('./rankingService');

/**
 * Resumo diário (RF53) e boletim da rodada anterior (RF77).
 *
 * O RF77 reaproveita a mesma montagem do RF53, como previsto no backlog —
 * muda a janela de tempo e o recorte, não a mecânica.
 */

/** Quantas partidas entram no destaque do dia. */
const HIGHLIGHT_LIMIT = 3;

/** Distribuição dos palpites da comunidade para uma partida (RF26). */
async function predictionBreakdown(matchIds) {
  if (!matchIds.length) return new Map();

  const rows = await Prediction.findAll({
    attributes: ['matchId', 'choice', [fn('COUNT', col('id')), 'total']],
    where: { matchId: { [Op.in]: matchIds }, status: { [Op.ne]: 'cancelled' } },
    group: ['matchId', 'choice'],
    raw: true,
  });

  const byMatch = new Map();
  rows.forEach((row) => {
    const entry = byMatch.get(row.matchId) ?? { home: 0, draw: 0, away: 0, total: 0 };
    const count = Number(row.total);
    entry[row.choice] = count;
    entry.total += count;
    byMatch.set(row.matchId, entry);
  });

  // Converte contagem em percentual, que é o que a tela mostra.
  byMatch.forEach((entry) => {
    if (!entry.total) return;
    entry.percentages = {
      home: Math.round((entry.home / entry.total) * 100),
      draw: Math.round((entry.draw / entry.total) * 100),
      away: Math.round((entry.away / entry.total) * 100),
    };
  });

  return byMatch;
}

/**
 * Escolhe as partidas mais relevantes do dia.
 *
 * Critério: mais palpites da comunidade primeiro; como desempate, o jogo mais
 * equilibrado, porque é o que gera mais dúvida e mais vale destacar.
 */
function pickHighlights(matches, breakdown, limit = HIGHLIGHT_LIMIT) {
  return [...matches]
    .sort((a, b) => {
      const volumeA = breakdown.get(a.id)?.total ?? 0;
      const volumeB = breakdown.get(b.id)?.total ?? 0;
      if (volumeB !== volumeA) return volumeB - volumeA;

      const balanceA = Math.abs(a.probability.home - a.probability.away);
      const balanceB = Math.abs(b.probability.home - b.probability.away);
      return balanceA - balanceB;
    })
    .slice(0, limit);
}

/**
 * Resumo diário exibido na primeira abertura do dia (RF53).
 * @param {{userId?: string, date?: Date}} options
 */
async function getDailyDigest({ userId = null, date = new Date() } = {}) {
  const { start, end } = matchService.dayRange(date);

  const matchRecords = await Match.findAll({
    where: { kickoffAt: { [Op.gte]: start, [Op.lt]: end } },
    include: [
      { model: League, as: 'league' },
      { model: Team, as: 'homeTeam' },
      { model: Team, as: 'awayTeam' },
    ],
    order: [['kickoffAt', 'ASC']],
  });

  const matches = await Promise.all(matchRecords.map(matchService.summarize));
  const breakdown = await predictionBreakdown(matches.map((match) => match.id));

  const highlights = pickHighlights(matches, breakdown).map((match) => ({
    ...match,
    community: breakdown.get(match.id) ?? null,
  }));

  // A posição no ranking só entra quando há um usuário autenticado.
  const ranking = userId ? await rankingService.getUserPosition(userId) : null;

  return {
    date: start.toISOString().slice(0, 10),
    totals: {
      matches: matches.length,
      live: matches.filter((match) => match.status === 'live').length,
      finished: matches.filter((match) => match.status === 'finished').length,
    },
    highlights,
    ranking,
  };
}

/**
 * Boletim da rodada anterior (RF77): resultados reais, os palpites que mais
 * pontuaram e os maiores erros da comunidade.
 */
async function getPreviousRoundBulletin({ days = 7 } = {}) {
  const until = new Date();
  until.setUTCHours(0, 0, 0, 0);
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (Number(days) || 7));

  const matches = await Match.findAll({
    where: { status: 'finished', kickoffAt: { [Op.gte]: since, [Op.lt]: until } },
    include: [
      { model: League, as: 'league' },
      { model: Team, as: 'homeTeam' },
      { model: Team, as: 'awayTeam' },
    ],
    order: [['kickoffAt', 'DESC']],
  });

  const matchIds = matches.map((match) => match.id);

  const settled = matchIds.length
    ? await Prediction.findAll({
        where: { matchId: { [Op.in]: matchIds }, status: { [Op.in]: ['won', 'lost'] } },
        include: [
          { model: User, as: 'user', attributes: ['id', 'username'] },
          { model: Match, as: 'match', include: [{ model: Team, as: 'homeTeam' }, { model: Team, as: 'awayTeam' }] },
        ],
        order: [[literal('COALESCE(points_awarded, 0)'), 'DESC']],
        limit: 100,
      })
    : [];

  const toEntry = (prediction) => ({
    username: prediction.user?.username ?? null,
    match: prediction.match
      ? `${prediction.match.homeTeam?.name} x ${prediction.match.awayTeam?.name}`
      : null,
    choice: prediction.choice,
    stake: prediction.stake,
    pointsAwarded: prediction.pointsAwarded ?? 0,
  });

  const winners = settled.filter((prediction) => prediction.status === 'won').slice(0, 5);
  // "Maiores erros" é quem apostou mais alto e perdeu.
  const misses = settled
    .filter((prediction) => prediction.status === 'lost')
    .sort((a, b) => b.stake - a.stake)
    .slice(0, 5);

  return {
    period: { from: since.toISOString().slice(0, 10), to: until.toISOString().slice(0, 10) },
    totals: { matches: matches.length, predictionsSettled: settled.length },
    results: matches.slice(0, 20).map((match) => ({
      id: match.id,
      league: match.league?.name ?? null,
      homeTeam: match.homeTeam?.name ?? null,
      awayTeam: match.awayTeam?.name ?? null,
      score: { home: match.homeGoals, away: match.awayGoals },
      kickoffAt: match.kickoffAt,
    })),
    topPredictions: winners.map(toEntry),
    biggestMisses: misses.map(toEntry),
  };
}

module.exports = {
  getDailyDigest,
  getPreviousRoundBulletin,
  predictionBreakdown,
  pickHighlights,
  HIGHLIGHT_LIMIT,
};
