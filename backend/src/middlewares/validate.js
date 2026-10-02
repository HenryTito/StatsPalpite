'use strict';

const AppError = require('../utils/AppError');

/**
 * Valida body, params e query contra schemas zod e substitui o conteúdo pelo
 * resultado tipado. Nada chega ao controller sem passar por aqui.
 */
function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      // req.query é somente-leitura no Express 5; guardamos o resultado à parte.
      if (query) req.validatedQuery = query.parse(req.query);
      return next();
    } catch (error) {
      if (error?.name === 'ZodError') {
        return next(
          AppError.unprocessable('Dados inválidos', {
            code: 'VALIDATION_ERROR',
            details: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          }),
        );
      }
      return next(error);
    }
  };
}

module.exports = { validate };
