'use strict';

const { QueryTypes } = require('sequelize');

const { sequelize, Player, Team, League, Venue } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Busca textual global (RF27) e busca de jogador (RF56).
 *
 * Simplificação registrada na aba Profundidade do backlog: correspondência
 * parcial com similaridade de trigrama e ILIKE, apoiada em índice GIN, sem um
 * motor de busca dedicado. `immutable_unaccent` (criada na migration de
 * índices) faz "sao paulo" encontrar "São Paulo".
 */

const MIN_QUERY_LENGTH = 2;
const SIMILARITY_THRESHOLD = 0.2;

/**
 * Consulta uma tabela por nome, ordenando por similaridade.
 *
 * O nome da tabela vem de uma lista fechada no próprio módulo — nunca da
 * requisição — e os valores vão por bind, então não há injeção possível.
 */
async function searchTable(table, term, limit) {
  /**
   * A nota combina três sinais, em ordem de importância:
   *
   *   +2  o nome COMEÇA com o termo
   *   +1  o nome CONTÉM o termo
   *   0–1 similaridade por trigrama
   *
   * Só a similaridade não basta. Buscando "corint", o trigrama dava 0,250 a
   * "Coritiba FBC" e 0,240 a "SC Corinthians Paulista" — ou seja, colocava na
   * frente justamente o time que NÃO contém o que foi digitado, porque nomes
   * longos diluem a medida. A correspondência literal precisa pesar mais.
   */
  return sequelize.query(
    `
      WITH needle AS (SELECT immutable_unaccent(lower(:term)) AS term)
      SELECT
        id,
        name,
        CASE WHEN immutable_unaccent(lower(name)) LIKE (SELECT term FROM needle) || '%'
             THEN 2 ELSE 0 END
        + CASE WHEN immutable_unaccent(lower(name)) LIKE '%' || (SELECT term FROM needle) || '%'
             THEN 1 ELSE 0 END
        + similarity(immutable_unaccent(lower(name)), (SELECT term FROM needle)) AS score
      FROM ${table}
      WHERE immutable_unaccent(lower(name)) ILIKE '%' || (SELECT term FROM needle) || '%'
         OR similarity(immutable_unaccent(lower(name)), (SELECT term FROM needle)) > :threshold
      ORDER BY score DESC, length(name) ASC, name ASC
      LIMIT :limit
    `,
    {
      replacements: { term, threshold: SIMILARITY_THRESHOLD, limit },
      type: QueryTypes.SELECT,
    },
  );
}

/** Tabelas pesquisáveis e o tipo que cada uma devolve na resposta. */
const SEARCHABLE = [
  { table: 'teams', type: 'team' },
  { table: 'players', type: 'player' },
  { table: 'leagues', type: 'league' },
  { table: 'venues', type: 'venue' },
];

/**
 * Busca global com sugestões.
 * @param {{q: string, limit?: number, types?: string[]}} query
 */
async function searchAll({ q, limit = 5, types = null }) {
  const term = String(q ?? '').trim();
  if (term.length < MIN_QUERY_LENGTH) {
    throw AppError.badRequest(`A busca precisa de pelo menos ${MIN_QUERY_LENGTH} caracteres`, {
      code: 'QUERY_TOO_SHORT',
    });
  }

  const perType = Math.min(Number(limit) || 5, 20);
  const targets = types ? SEARCHABLE.filter((entry) => types.includes(entry.type)) : SEARCHABLE;

  const results = await Promise.all(
    targets.map(async ({ table, type }) => {
      const rows = await searchTable(table, term, perType);
      return rows.map((row) => ({
        type,
        id: row.id,
        name: row.name,
        score: Number(row.score),
      }));
    }),
  );

  const flat = results.flat().sort((a, b) => b.score - a.score);

  return {
    query: term,
    total: flat.length,
    // As sugestões do autocomplete são o topo da lista já ordenada.
    suggestions: flat.slice(0, perType).map((item) => item.name),
    results: flat,
  };
}

/**
 * Busca de jogador com estatísticas individuais (RF56). Reaproveita a mesma
 * consulta por similaridade e enriquece com os dados do atleta e do clube.
 */
async function searchPlayers({ q, limit = 10 }) {
  const term = String(q ?? '').trim();
  if (term.length < MIN_QUERY_LENGTH) {
    throw AppError.badRequest(`A busca precisa de pelo menos ${MIN_QUERY_LENGTH} caracteres`, {
      code: 'QUERY_TOO_SHORT',
    });
  }

  const capped = Math.min(Number(limit) || 10, 50);
  const matches = await searchTable('players', term, capped);
  if (!matches.length) return { query: term, total: 0, results: [] };

  const scoreById = new Map(matches.map((row) => [row.id, Number(row.score)]));

  const players = await Player.findAll({
    where: { id: [...scoreById.keys()] },
    include: [{ model: Team, as: 'team', include: [{ model: League, as: 'league' }] }],
  });

  const results = players
    .map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team
        ? {
            id: player.team.id,
            name: player.team.name,
            league: player.team.league ? player.team.league.name : null,
          }
        : null,
      statistics: {
        appearances: player.appearances,
        goals: player.goals,
        assists: player.assists,
        yellowCards: player.yellowCards,
        redCards: player.redCards,
      },
      score: scoreById.get(player.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return { query: term, total: results.length, results };
}

/** Ligas disponíveis, usadas no filtro da lista de partidas (RF16). */
async function listLeagues() {
  const leagues = await League.findAll({ order: [['name', 'ASC']] });

  return leagues.map((league) => ({
    id: league.id,
    name: league.name,
    country: league.country,
    season: league.season,
  }));
}

/** Estádios com coordenadas, base do mapa do RF49. */
async function listVenues({ limit = 100 } = {}) {
  const venues = await Venue.findAll({
    order: [['name', 'ASC']],
    limit: Math.min(Number(limit) || 100, 200),
  });

  return venues.map((venue) => ({
    id: venue.id,
    name: venue.name,
    city: venue.city,
    capacity: venue.capacity,
    openedYear: venue.openedYear,
    coordinates:
      venue.latitude === null || venue.latitude === undefined
        ? null
        : { latitude: Number(venue.latitude), longitude: Number(venue.longitude) },
  }));
}

module.exports = {
  searchAll,
  searchPlayers,
  listVenues,
  listLeagues,
  MIN_QUERY_LENGTH,
  SIMILARITY_THRESHOLD,
};
