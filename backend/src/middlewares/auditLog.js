'use strict';

const { AuditLog } = require('../models');
const logger = require('../config/logger');

/**
 * Registra a ação no log de auditoria (RF28).
 *
 * Grava depois de a resposta sair e só em caso de sucesso: auditoria não pode
 * atrasar nem derrubar a requisição do usuário. Falha ao gravar vira log, não
 * erro de API.
 */
function audit(action, resourceResolver = null) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      AuditLog.create({
        userId: req.user?.id ?? null,
        action,
        resource: resourceResolver ? resourceResolver(req) : req.originalUrl,
        ipAddress: req.ip,
        metadata: { method: req.method, status: res.statusCode },
      }).catch((error) =>
        logger.warn('falha ao gravar auditoria', { action, error: error.message }),
      );
    });

    next();
  };
}

module.exports = { audit };
