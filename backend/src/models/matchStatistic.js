'use strict';

module.exports = (sequelize, DataTypes) => {
  const MatchStatistic = sequelize.define(
    'MatchStatistic',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      matchId: { type: DataTypes.UUID, allowNull: false, unique: true },
      /** Os indicadores que o RF04 exige, um par por time. */
      homePossession: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayPossession: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homeShots: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayShots: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homeShotsOnTarget: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayShotsOnTarget: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homeFouls: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayFouls: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homeCorners: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayCorners: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homeOffsides: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayOffsides: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      homePassAccuracy: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      awayPassAccuracy: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    },
    { tableName: 'match_statistics' },
  );

  MatchStatistic.associate = (db) => {
    MatchStatistic.belongsTo(db.Match, { foreignKey: 'matchId', as: 'match' });
  };

  return MatchStatistic;
};
