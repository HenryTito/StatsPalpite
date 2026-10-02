'use strict';

const { toNumber } = require('./localTranslator');

/**
 * Camada anticorrupção da API-Football (v3).
 *
 * O formato dela difere do nosso em tudo que importa: status por sigla,
 * estatísticas como lista de pares {type, value} em inglês, timestamps em
 * segundos. Nada disso atravessa este arquivo.
 */

const STATUS_MAP = {
  TBD: 'scheduled',
  NS: 'scheduled',
  '1H': 'live',
  HT: 'live',
  '2H': 'live',
  ET: 'live',
  BT: 'live',
  P: 'live',
  LIVE: 'live',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'cancelled',
  AWD: 'finished',
  WO: 'finished',
};

/** A API devolve estatísticas como lista de pares; viramos um mapa por rótulo. */
function statsToMap(list = []) {
  return list.reduce((map, item) => {
    map[item.type] = item.value;
    return map;
  }, {});
}

function toLeague(raw) {
  return {
    externalId: String(raw.league.id),
    name: raw.league.name,
    country: raw.country?.name ?? raw.league.country ?? 'Desconhecido',
    season: raw.seasons?.find((season) => season.current)?.year ?? new Date().getFullYear(),
    logoUrl: raw.league.logo ?? null,
  };
}

function toVenue(raw) {
  return {
    externalId: String(raw.id),
    name: raw.name,
    city: raw.city ?? null,
    capacity: raw.capacity ?? null,
    latitude: null,
    longitude: null,
    openedYear: null,
  };
}

function toTeam(raw) {
  return {
    externalId: String(raw.team.id),
    name: raw.team.name,
    shortName: raw.team.code ?? null,
    country: raw.team.country ?? null,
    logoUrl: raw.team.logo ?? null,
    leagueExternalId: raw.leagueExternalId ? String(raw.leagueExternalId) : null,
    venueExternalId: raw.venue?.id ? String(raw.venue.id) : null,
  };
}

function toPlayer(raw) {
  const stats = raw.statistics?.[0] ?? {};
  return {
    externalId: String(raw.player.id),
    name: raw.player.name,
    position: stats.games?.position ?? null,
    teamExternalId: stats.team?.id ? String(stats.team.id) : null,
    goals: stats.goals?.total ?? 0,
    assists: stats.goals?.assists ?? 0,
    yellowCards: stats.cards?.yellow ?? 0,
    redCards: stats.cards?.red ?? 0,
    appearances: stats.games?.appearences ?? 0,
  };
}

function toMatch(raw) {
  return {
    externalId: String(raw.fixture.id),
    leagueExternalId: String(raw.league.id),
    homeTeamExternalId: String(raw.teams.home.id),
    awayTeamExternalId: String(raw.teams.away.id),
    venueExternalId: raw.fixture.venue?.id ? String(raw.fixture.venue.id) : null,
    refereeExternalId: raw.fixture.referee ?? null,
    kickoffAt: new Date(raw.fixture.timestamp * 1000).toISOString(),
    status: STATUS_MAP[raw.fixture.status?.short] ?? 'scheduled',
    minute: raw.fixture.status?.elapsed ?? null,
    homeGoals: raw.goals?.home ?? null,
    awayGoals: raw.goals?.away ?? null,
    round: raw.league?.round ?? null,
  };
}

function toStatistics(raw) {
  const home = statsToMap(raw.statistics?.[0]?.statistics);
  const away = statsToMap(raw.statistics?.[1]?.statistics);
  return {
    matchExternalId: String(raw.fixtureId),
    homePossession: toNumber(home['Ball Possession']),
    awayPossession: toNumber(away['Ball Possession']),
    homeShots: toNumber(home['Total Shots']),
    awayShots: toNumber(away['Total Shots']),
    homeShotsOnTarget: toNumber(home['Shots on Goal']),
    awayShotsOnTarget: toNumber(away['Shots on Goal']),
    homeFouls: toNumber(home.Fouls),
    awayFouls: toNumber(away.Fouls),
    homeCorners: toNumber(home['Corner Kicks']),
    awayCorners: toNumber(away['Corner Kicks']),
    homeOffsides: toNumber(home.Offsides),
    awayOffsides: toNumber(away.Offsides),
    homePassAccuracy: toNumber(home['Passes %']),
    awayPassAccuracy: toNumber(away['Passes %']),
  };
}

function toInjury(raw) {
  const type = (raw.player?.type ?? '').toLowerCase();
  const status = type.includes('question') || type.includes('doubt') ? 'doubtful' : 'out';
  return {
    playerExternalId: String(raw.player.id),
    playerName: raw.player.name,
    teamExternalId: String(raw.team.id),
    reason: raw.player.reason ?? 'Não informado',
    status,
    reportedAt: raw.fixture?.date ?? new Date().toISOString(),
  };
}

module.exports = {
  STATUS_MAP,
  statsToMap,
  toLeague,
  toVenue,
  toTeam,
  toPlayer,
  toMatch,
  toStatistics,
  toInjury,
};
