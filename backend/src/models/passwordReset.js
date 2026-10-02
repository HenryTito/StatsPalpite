'use strict';

module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define(
    'PasswordReset',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
      /** RF02 exige validade de 15 minutos. */
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'password_resets' },
  );

  PasswordReset.associate = (db) => {
    PasswordReset.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
  };

  return PasswordReset;
};
