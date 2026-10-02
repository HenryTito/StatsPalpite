'use strict';

module.exports = (sequelize, DataTypes) => {
  const Referee = sequelize.define(
    'Referee',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      externalId: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(140), allowNull: false },
      country: { type: DataTypes.STRING(80), allowNull: true },
      /** Médias por partida que o RF62 expõe ao lado das estatísticas. */
      matchesOfficiated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      avgFouls: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      avgYellowCards: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      avgRedCards: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      avgPenalties: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    },
    { tableName: 'referees' },
  );

  Referee.associate = (db) => {
    Referee.hasMany(db.Match, { foreignKey: 'refereeId', as: 'matches' });
  };

  return Referee;
};
