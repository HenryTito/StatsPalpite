'use strict';

const { z } = require('zod');

const matchService = require('../services/matchService');

const schemas = {
  list: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    leagueId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),

  detail: z.object({ id: z.string().uuid('Identificador de partida inválido') }),

  compare: z.object({
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    limit: z.coerce.number().int().positive().max(50).optional(),
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
