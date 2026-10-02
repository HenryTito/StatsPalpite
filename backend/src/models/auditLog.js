'use strict';

module.exports = (sequelize, DataTypes) => {
  /**
   * O documento de requisitos fala em "coleção separada", vocabulário de banco
   * de documentos. Como o RNF05 obriga Sequelize, o registro vive numa tabela
   * dedicada, sem relação obrigatória com as demais.
   */
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING(60), allowNull: false },
      resource: { type: DataTypes.STRING(120), allowNull: true },
      ipAddress: { type: DataTypes.STRING(64), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      tableName: 'audit_logs',
      updatedAt: false,
      indexes: [{ fields: ['user_id'] }, { fields: ['action'] }],
    },
  );

  return AuditLog;
};
