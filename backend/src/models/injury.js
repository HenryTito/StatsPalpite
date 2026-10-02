'use strict';

module.exports = (sequelize, DataTypes) => {
  const Injury = sequelize.define(
    'Injury',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      playerId: { type: DataTypes.UUID, allowNull: false },
      teamId: { type: DataTypes.UUID, allowNull: false },
      /** Texto da fonte externa, normalizado pela camada anticorrupção. */
      reason: { type: DataTypes.STRING(160), allowNull: false },
      status: {
        type: DataTypes.ENUM('out', 'doubtful', 'suspended'),
        allowNull: false,
        defaultValue: 'out',
      },
      reportedAt: { type: DataTypes.DATE, allowNull: false },
      expectedReturnAt: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: 'injuries' },
  );

  Injury.associate = (db) => {
    Injury.belongsTo(db.Player, { foreignKey: 'playerId', as: 'player' });
    Injury.belongsTo(db.Team, { foreignKey: 'teamId', as: 'team' });
  };

  return Injury;
};
