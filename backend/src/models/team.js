'use strict';

module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define(
    'Team',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      externalId: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      shortName: { type: DataTypes.STRING(32), allowNull: true },
      country: { type: DataTypes.STRING(80), allowNull: true },
      logoUrl: { type: DataTypes.STRING, allowNull: true },
      leagueId: { type: DataTypes.UUID, allowNull: true },
      venueId: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'teams' },
  );

  Team.associate = (db) => {
    Team.belongsTo(db.League, { foreignKey: 'leagueId', as: 'league' });
    Team.belongsTo(db.Venue, { foreignKey: 'venueId', as: 'venue' });
    Team.hasMany(db.Player, { foreignKey: 'teamId', as: 'players' });
  };

  return Team;
};
