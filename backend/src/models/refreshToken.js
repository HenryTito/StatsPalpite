'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      /** Guardamos apenas o hash: vazar a tabela não concede sessões (RF76). */
      tokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      /** Preenchido na rotação, ligando o token antigo ao que o substituiu. */
      replacedByTokenHash: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'refresh_tokens' },
  );

  RefreshToken.associate = (db) => {
    RefreshToken.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
  };

  RefreshToken.prototype.isActive = function isActive() {
    return !this.revokedAt && this.expiresAt > new Date();
  };

  return RefreshToken;
};
