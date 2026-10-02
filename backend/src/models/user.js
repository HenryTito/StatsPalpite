'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      /** Nome exibido no ranking. Único, validado por regex e lista de bloqueio (RF34). */
      username: { type: DataTypes.STRING(24), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      birthDate: { type: DataTypes.DATEONLY, allowNull: false },
      role: { type: DataTypes.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      /** Pontuação acumulada que ordena o ranking global. */
      points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      locale: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'pt-BR' },
      lastDigestAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'users', paranoid: true },
  );

  User.associate = (db) => {
    User.hasMany(db.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    User.hasMany(db.PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
    User.hasMany(db.Prediction, { foreignKey: 'userId', as: 'predictions' });
    User.hasMany(db.RankingSnapshot, { foreignKey: 'userId', as: 'rankingSnapshots' });
  };

  /** Nunca serializa o hash de senha em respostas da API. */
  User.prototype.toJSON = function toJSON() {
    const { passwordHash, deletedAt, ...rest } = this.get({ plain: true });
    return rest;
  };

  return User;
};
