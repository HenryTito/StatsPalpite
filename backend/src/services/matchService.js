'use strict';

const { Op } = require('sequelize');

const {
  Match,
  League,
  Team,
  Venue,
  Referee,
  MatchStatistic,
  Injury,
  Player,
} = require('../models');
const AppError = require('../utils/AppError');
const probabilityService = require('./probabilityService');
const { getWeatherProvider } = require('../providers');

/** Quantos jogos entram no cálculo de forma recente. */
const FORM_WINDOW = 6;

/** Partida sem sincronizar há mais que isto dispara o aviso do RF72. */
const STALE_AFTER_HOURS = 48;

const MATCH_INCLUDES = [
  { model: League, as: 'league' },
  { model: Team, as: 'homeTeam', include: [{ model: Venue, as: 'venue' }] },
  { model: Team, as: 'awayTeam' },
  { model: Venue, as: 'venue' },
  { model: Referee, as: 'referee' },
];

/** Intervalo [00:00, 24:00) do dia informado, em UTC. */
function dayRange(date = new Date()) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** Últimos resultados de um time, do mais recente para o mais antigo. */
async function recentForm(teamId, { before = new Date(), limit = FORM_WINDOW } = {}) {
  const matches = await Match.findAll({
    where: {
      status: 'finished',
      kickoffAt: { [Op.lt]: before },
      [Op.or]: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    order: [['kickoffAt', 'DESC']],
    limit,
  });

  return matches.map((match) => {
    const isHome = match.homeTeamId === teamId;
    const scored = isHome ? match.homeGoals : match.awayGoals;
    const conceded = isHome ? match.awayGoals : match.homeGoals;
    if (scored > conceded) return 'W';
    if (scored < conceded) return 'L';
    return 'D';
  });
}

/**
 * Retrospecto do confronto direto, nos dois sentidos de mando (RF06).
 *
 * O `limit` recorta apenas a LISTA devolvida, nunca a contagem: truncar o
 * retrospecto faria a tela anunciar "10 confrontos" para um par que se
 * enfrentou 20 vezes, e o número exibido estaria errado.
 */
async function headToHead(homeTeamId, awayTeamId, { before = new Date(), limit = null } = {}) {
  const matches = await Match.findAll({
    where: {
      status: 'finished',
      kickoffAt: { [Op.lt]: before },
      [Op.or]: [
        { homeTeamId, awayTeamId },
        { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
      ],
    },
    include: MATCH_INCLUDES,
    order: [['kickoffAt', 'DESC']],
  });

  const tally = { homeWins: 0, draws: 0, awayWins: 0, played: matches.length };
  let homeGoalsFor = 0;
  let homeGoalsAgainst = 0;

  matches.forEach((match) => {
    // Normaliza para a perspectiva do time tratado como mandante na consulta.
    const perspectiveIsHome = match.homeTeamId === homeTeamId;
    const forGoals = perspectiveIsHome ? match.homeGoals : match.awayGoals;
    const againstGoals = perspectiveIsHome ? match.awayGoals : match.homeGoals;

    homeGoalsFor += forGoals ?? 0;
    homeGoalsAgainst += againstGoals ?? 0;

    if (forGoals > againstGoals) tally.homeWins += 1;
    else if (forGoals < againstGoals) tally.awayWins += 1;
    else tally.draws += 1;
  });

  return {
    tally,
    goals: { for: homeGoalsFor, against: homeGoalsAgainst },
    // A contagem acima considera todos os confrontos; a lista é a recortada.
    matches: limit ? matches.slice(0, limit) : matches,
  };
}

/** Resumo de uma partida, com a probabilidade preliminar do RF03. */
async function summarize(match) {
  const [homeForm, awayForm, h2h] = await Promise.all([
    recentForm(match.homeTeamId, { before: match.kickoffAt }),
    recentForm(match.awayTeamId, { before: match.kickoffAt }),
    headToHead(match.homeTeamId, match.awayTeamId, { before: match.kickoffAt }),
  ]);

  const probability = probabilityService.calculate({
    homeForm,
    awayForm,
    headToHead: h2h.tally,
  });

  const syncedAt = match.syncedAt ? new Date(match.syncedAt) : null;
  const staleHours = syncedAt ? (Date.now() - syncedAt.getTime()) / 3600000 : null;

  return {
    id: match.id,
    externalId: match.externalId,
    league: match.league
      ? { id: match.league.id, name: match.league.name, country: match.league.country }
      : null,
    homeTeam: match.homeTeam
      ? { id: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName }
      : null,
    awayTeam: match.awayTeam
      ? { id: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName }
      : null,
    venue: match.venue
      ? { id: match.venue.id, name: match.venue.name, city: match.venue.city }
      : null,
    kickoffAt: match.kickoffAt,
    status: match.status,
    minute: match.minute,
    score: { home: match.homeGoals, away: match.awayGoals },
    round: match.round,
    probability,
    form: { home: homeForm, away: awayForm },
    syncedAt: match.syncedAt,
    /** RF72: avisa que os dados podem estar velhos antes de o usuário palpitar. */
    stale: staleHours !== null && staleHours > STALE_AFTER_HOURS,
  };
}

/** Partidas do dia, com filtros do RF17 (liga, data, time, status). */
async function listMatches({ date, leagueId, teamId, status, limit = 50, offset = 0 } = {}) {
  const { start, end } = dayRange(date ? new Date(date) : new Date());

  const where = { kickoffAt: { [Op.gte]: start, [Op.lt]: end } };
  if (leagueId) where.leagueId = leagueId;
  if (status) where.status = status;
  if (teamId) where[Op.or] = [{ homeTeamId: teamId }, { awayTeamId: teamId }];

  const { rows, count } = await Match.findAndCountAll({
    where,
    include: MATCH_INCLUDES,
    order: [['kickoffAt', 'ASC']],
    limit: Math.min(Number(limit) || 50, 100),
    offset: Number(offset) || 0,
    distinct: true,
  });

  const matches = await Promise.all(rows.map(summarize));
  return { total: count, date: start.toISOString().slice(0, 10), matches };
}

/** Detalhe da partida (RF04), com estatísticas, desfalques, árbitro e clima. */
async function getMatchDetail(matchId) {
  const match = await Match.findByPk(matchId, {
    include: [...MATCH_INCLUDES, { model: MatchStatistic, as: 'statistics' }],
  });

  if (!match) throw AppError.notFound('Partida não encontrada');

  const summary = await summarize(match);

  const injuries = await Injury.findAll({
    where: { teamId: { [Op.in]: [match.homeTeamId, match.awayTeamId] } },
    include: [{ model: Player, as: 'player' }],
  });

  // RF15: o clima depende das coordenadas do estádio; sem elas, devolve null.
  let weather = null;
  if (match.venue?.latitude !== null && match.venue?.latitude !== undefined) {
    weather = await getWeatherProvider()
      .fetchForecast({
        latitude: Number(match.venue.latitude),
        longitude: Number(match.venue.longitude),
        at: match.kickoffAt,
      })
      .catch(() => null);
  }

  return {
    ...summary,
    statistics: match.statistics ? match.statistics.toJSON() : null,
    referee: match.referee
      ? {
          id: match.referee.id,
          name: match.referee.name,
          matchesOfficiated: match.referee.matchesOfficiated,
          averages: {
            fouls: match.referee.avgFouls,
            yellowCards: match.referee.avgYellowCards,
            redCards: match.referee.avgRedCards,
            penalties: match.referee.avgPenalties,
          },
        }
      : null,
    injuries: injuries.map((injury) => ({
      id: injury.id,
      teamId: injury.teamId,
      player: injury.player ? { id: injury.player.id, name: injury.player.name } : null,
      reason: injury.reason,
      status: injury.status,
      reportedAt: injury.reportedAt,
    })),
    weather,
  };
}

/** Comparação entre dois times (RF06, RF37, RF46). */
async function compareTeams(homeTeamId, awayTeamId, { limit = 10 } = {}) {
  const [home, away] = await Promise.all([Team.findByPk(homeTeamId), Team.findByPk(awayTeamId)]);
  if (!home) throw AppError.notFound('Time mandante não encontrado');
  if (!away) throw AppError.notFound('Time visitante não encontrado');

  const h2h = await headToHead(homeTeamId, awayTeamId, { limit });
  const [homeForm, awayForm] = await Promise.all([recentForm(homeTeamId), recentForm(awayTeamId)]);

  return {
    homeTeam: { id: home.id, name: home.name, shortName: home.shortName },
    awayTeam: { id: away.id, name: away.name, shortName: away.shortName },
    record: h2h.tally,
    goals: h2h.goals,
    form: {
      home: { results: homeForm, score: Math.round(probabilityService.formScore(homeForm) * 100) },
      away: { results: awayForm, score: Math.round(probabilityService.formScore(awayForm) * 100) },
    },
    probability: probabilityService.calculate({ homeForm, awayForm, headToHead: h2h.tally }),
    history: h2h.matches.map((match) => ({
      id: match.id,
      kickoffAt: match.kickoffAt,
      homeTeam: match.homeTeam?.name,
      awayTeam: match.awayTeam?.name,
      score: { home: match.homeGoals, away: match.awayGoals },
      league: match.league?.name,
    })),
  };
}

module.exports = {
  listMatches,
  getMatchDetail,
  compareTeams,
  recentForm,
  headToHead,
  summarize,
  dayRange,
  FORM_WINDOW,
  STALE_AFTER_HOURS,
};
