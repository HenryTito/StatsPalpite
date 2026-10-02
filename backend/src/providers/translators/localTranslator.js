'use strict';

const { MATCH_STATUS, INJURY_STATUS } = require('../contracts');

/**
 * Camada anticorrupção da fonte local.
 *
 * Toda a feiura da fonte — "situacao": "FT", posse de bola como string com
 * "%", placar aninhado, nomes de campo em português — morre aqui. Para fora
 * saem apenas os DTOs de contracts.js.
 */

/** Mapeia o vocabulário de status da fonte para o do domínio. */
const STATUS_MAP = {
  NS: 'scheduled',
  LIVE: 'live',
  HT: 'live',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  PST: 'postponed',
  CANC: 'cancelled',
};

const INJURY_STATUS_MAP = {
  OUT: 'out',
  DOUBTFUL: 'doubtful',
  SUSPENDED: 'suspended',
};

/** Converte "54.3%" ou 54.3 em 54.3. Devolve null quando não há valor. */
function toNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed =
    typeof value === 'string' ? Number.parseFloat(value.replace('%', '').trim()) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLeague(raw, season) {
  return {
    externalId: raw.id,
    name: raw.nome,
    country: raw.pais,
    season,
    logoUrl: null,
  };
}

function toVenue(raw) {
  return {
    externalId: raw.id,
    name: raw.nome,
    city: raw.cidade ?? null,
    capacity: raw.cap ?? null,
    latitude: raw.lat ?? null,
    longitude: raw.lon ?? null,
    openedYear: raw.ano ?? null,
  };
}

function toTeam(raw) {
  return {
    externalId: raw.id,
    name: raw.nome,
    shortName: raw.sigla ?? null,
    country: raw.pais ?? null,
    logoUrl: null,
    leagueExternalId: raw.liga ?? null,
    venueExternalId: raw.estadio ?? null,
  };
}

function toPlayer(raw) {
  const season = raw.temporada ?? {};
  return {
    externalId: raw.id,
    name: raw.nome_completo,
    position: raw.posicao ?? null,
    teamExternalId: raw.time_id ?? null,
    goals: season.gols ?? 0,
    assists: season.assistencias ?? 0,
    yellowCards: season.cartoes?.amarelo ?? 0,
    redCards: season.cartoes?.vermelho ?? 0,
    appearances: season.jogos ?? 0,
  };
}

function toMatch(raw) {
  const status = STATUS_MAP[raw.situacao] ?? 'scheduled';
  if (!MATCH_STATUS.includes(status)) {
    throw new Error(`Status de partida desconhecido vindo da fonte: ${raw.situacao}`);
  }
  return {
    externalId: raw.fixture_id,
    leagueExternalId: raw.competicao,
    homeTeamExternalId: raw.mandante,
    awayTeamExternalId: raw.visitante,
    venueExternalId: raw.local ?? null,
    refereeExternalId: raw.arbitro ?? null,
    kickoffAt: raw.data_hora_utc,
    status,
    minute: raw.minuto_atual ?? null,
    homeGoals: raw.placar?.casa ?? null,
    awayGoals: raw.placar?.fora ?? null,
    round: raw.rodada ?? null,
  };
}

function toStatistics(raw) {
  const home = raw.casa ?? {};
  const away = raw.fora ?? {};
  return {
    matchExternalId: raw.fixture_id,
    homePossession: toNumber(home.posse_bola),
    awayPossession: toNumber(away.posse_bola),
    homeShots: toNumber(home.finalizacoes),
    awayShots: toNumber(away.finalizacoes),
    homeShotsOnTarget: toNumber(home.finalizacoes_no_gol),
    awayShotsOnTarget: toNumber(away.finalizacoes_no_gol),
    homeFouls: toNumber(home.faltas),
    awayFouls: toNumber(away.faltas),
    homeCorners: toNumber(home.escanteios),
    awayCorners: toNumber(away.escanteios),
    homeOffsides: toNumber(home.impedimentos),
    awayOffsides: toNumber(away.impedimentos),
    homePassAccuracy: toNumber(home.precisao_passes),
    awayPassAccuracy: toNumber(away.precisao_passes),
  };
}

function toInjury(raw) {
  const status = INJURY_STATUS_MAP[raw.situacao] ?? 'out';
  if (!INJURY_STATUS.includes(status)) {
    throw new Error(`Status de desfalque desconhecido vindo da fonte: ${raw.situacao}`);
  }
  return {
    playerExternalId: raw.jogador_id,
    playerName: raw.jogador_nome,
    teamExternalId: raw.clube_id,
    reason: raw.motivo,
    status,
    reportedAt: raw.data_reporte,
  };
}

function toReferee(raw) {
  const averages = raw.medias ?? {};
  return {
    externalId: raw.arbitro_id,
    name: raw.nome,
    country: raw.pais ?? null,
    matchesOfficiated: raw.apitos ?? 0,
    avgFouls: toNumber(averages.faltas),
    avgYellowCards: toNumber(averages.amarelos),
    avgRedCards: toNumber(averages.vermelhos),
    avgPenalties: toNumber(averages.penaltis),
  };
}

module.exports = {
  STATUS_MAP,
  INJURY_STATUS_MAP,
  toNumber,
  toLeague,
  toVenue,
  toTeam,
  toPlayer,
  toMatch,
  toStatistics,
  toInjury,
  toReferee,
};
