'use strict';

const { ValidationError, UniqueConstraintError, DatabaseError } = require('sequelize');

const env = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const { ProviderError } = require('../providers/http');

/** Rota inexistente: 404 em JSON, no mesmo formato dos demais erros. */
function notFound(req, res) {
  res.status(404).json({
    error: { message: `Rota não encontrada: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' },
  });
}

/**
 * Handler global. Traduz cada família de erro em uma resposta previsível e
 * nunca deixa vazar stack trace nem detalhe interno do banco para o cliente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: { message: error.message, code: error.code, details: error.details },
    });
  }

  if (error instanceof UniqueConstraintError) {
    const field = error.errors?.[0]?.path ?? 'campo';
    return res.status(409).json({
      error: { message: `Já existe um registro com este ${field}`, code: 'ALREADY_TAKEN' },
    });
  }

  if (error instanceof ValidationError) {
    return res.status(422).json({
      error: {
        message: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((item) => ({ field: item.path, message: item.message })),
      },
    });
  }

  if (error instanceof ProviderError) {
    // A fonte externa caiu e nem o fallback salvou: é indisponibilidade, não erro do cliente.
    logger.error('todas as fontes falharam', { provider: error.provider, message: error.message });
    return res.status(503).json({
      error: { message: 'Fonte de dados indisponível no momento', code: 'PROVIDER_UNAVAILABLE' },
    });
  }

  if (error instanceof DatabaseError) {
    logger.error('erro de banco', { message: error.message });
    return res.status(500).json({
      error: { message: 'Erro ao consultar o banco de dados', code: 'DATABASE_ERROR' },
    });
  }

  logger.error('erro não tratado', { message: error.message, stack: error.stack });
  return res.status(500).json({
    error: {
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      ...(env.isProduction ? {} : { debug: error.message }),
    },
  });
}

module.exports = { errorHandler, notFound };
