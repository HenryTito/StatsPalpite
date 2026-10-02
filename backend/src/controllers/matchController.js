'use strict';

const { z } = require('zod');

const matchService = require('../services/matchService');
const { isoDate, offset } = require('../utils/validators');

const schemas = {
  list: z.object({
    date: isoDate.optional(),
    leagueId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: offset.optional(),
  }),

  detail: z.object({ id: z.string().uuid('Identificador de partida inválido') }),

  compare: z
    .object({
      homeTeamId: z.string().uuid(),
      awayTeamId: z.string().uuid(),
      limit: z.coerce.number().int().positive().max(50).optional(),
    })
    // Comparar um time consigo mesmo devolveria um retrospecto vazio e barras
    // em 50/50, o que parece dado real e não é.
    .refine((query) => query.homeTeamId !== query.awayTeamId, {
      message: 'Selecione dois times diferentes',
      path: ['awayTeamId'],
    }),
};

async function list(req, res, next) {
  try {
    res.json(await matchService.listMatches(req.validatedQuery));
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    res.json(await matchService.getMatchDetail(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function compare(req, res, next) {
  try {
    const { homeTeamId, awayTeamId, limit } = req.validatedQuery;
    res.json(await matchService.compareTeams(homeTeamId, awayTeamId, { limit }));
  } catch (error) {
    next(error);
  }
}

module.exports = { schemas, list, detail, compare };
