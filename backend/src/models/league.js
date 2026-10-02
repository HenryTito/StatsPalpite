'use strict';

module.exports = (sequelize, DataTypes) => {
  const League = sequelize.define(
    'League',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      /** Identificador da liga na fonte externa, usado pela camada anticorrupção. */
      externalId: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      country: { type: DataTypes.STRING(80), allowNull: false },
      season: { type: DataTypes.INTEGER, allowNull: false },
      logoUrl: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'leagues' },
  );

  League.associate = (db) => {
    League.hasMany(db.Team, { foreignKey: 'leagueId', as: 'teams' });
    League.hasMany(db.Match, { foreignKey: 'leagueId', as: 'matches' });
  };

  return League;
};
