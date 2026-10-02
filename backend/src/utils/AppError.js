'use strict';

/** Erro de negócio com status HTTP. O handler global o converte em resposta. */
class AppError extends Error {
  constructor(message, status = 400, { code = null, details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, options) {
    return new AppError(message, 400, options);
  }

  static unauthorized(message = 'Credenciais inválidas', options) {
    return new AppError(message, 401, options);
  }

  static forbidden(message = 'Acesso negado', options) {
    return new AppError(message, 403, options);
  }

  static notFound(message = 'Recurso não encontrado', options) {
    return new AppError(message, 404, options);
  }

  static conflict(message, options) {
    return new AppError(message, 409, options);
  }

  static unprocessable(message, options) {
    return new AppError(message, 422, options);
  }
}

module.exports = AppError;
