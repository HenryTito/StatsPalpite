'use strict';

const { z } = require('zod');

const digestService = require('../services/digestService');
const { isoDate } = require('../utils/validators');

const schemas = {
  daily: z.object({ date: isoDate.optional() }),
  bulletin: z.object({ days: z.coerce.number().int().positive().max(30).optional() }),
};

async function daily(req, res, next) {
  try {
    const { date } = req.validatedQuery;
    res.json(
      await digestService.getDailyDigest({
        userId: req.user?.id ?? null,
        date: date ? new Date(`${date}T00:00:00.000Z`) : new Date(),
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function bulletin(req, res, next) {
  try {
    res.json(await digestService.getPreviousRoundBulletin(req.validatedQuery));
  } catch (error) {
    next(error);
  }
}

module.exports = { schemas, daily, bulletin };
