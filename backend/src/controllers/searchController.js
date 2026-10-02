'use strict';

const { z } = require('zod');

const searchService = require('../services/searchService');

const schemas = {
  global: z.object({
    q: z.string().min(2, 'A busca precisa de pelo menos 2 caracteres'),
    limit: z.coerce.number().int().positive().max(20).optional(),
    types: z.string().optional(),
  }),

  players: z.object({
    q: z.string().min(2, 'A busca precisa de pelo menos 2 caracteres'),
    limit: z.coerce.number().int().positive().max(50).optional(),
  }),
};

async function global(req, res, next) {
  try {
    const { q, limit, types } = req.validatedQuery;
    res.json(
      await searchService.searchAll({
        q,
        limit,
        types: types ? types.split(',').map((type) => type.trim()) : null,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function players(req, res, next) {
  try {
    res.json(await searchService.searchPlayers(req.validatedQuery));
  } catch (error) {
    next(error);
  }
}

async function venues(req, res, next) {
  try {
    res.json({ venues: await searchService.listVenues() });
  } catch (error) {
    next(error);
  }
}

module.exports = { schemas, global, players, venues };
