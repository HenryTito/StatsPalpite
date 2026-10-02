'use strict';

const { z } = require('zod');

const rankingService = require('../services/rankingService');

const schemas = {
  list: z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
  history: z.object({ days: z.coerce.number().int().positive().max(365).optional() }),
};

async function list(req, res, next) {
  try {
    res.json(await rankingService.listRanking(req.validatedQuery));
  } catch (error) {
    next(error);
  }
}

async function myPosition(req, res, next) {
  try {
    res.json(await rankingService.getUserPosition(req.user.id));
  } catch (error) {
    next(error);
  }
}

async function myHistory(req, res, next) {
  try {
    res.json(await rankingService.getRankingHistory(req.user.id, req.validatedQuery));
  } catch (error) {
    next(error);
  }
}

module.exports = { schemas, list, myPosition, myHistory };
