'use strict';

module.exports = (sequelize, DataTypes) => {
  const Venue = sequelize.define(
    'Venue',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      externalId: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(140), allowNull: false },
      city: { type: DataTypes.STRING(120), allowNull: true },
      capacity: { type: DataTypes.INTEGER, allowNull: true },
      /** Coordenadas alimentam o mapa de estádios (RF49) e a previsão do tempo (RF15). */
      latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      openedYear: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'venues' },
  );

  Venue.associate = (db) => {
    Venue.hasMany(db.Team, { foreignKey: 'venueId', as: 'teams' });
    Venue.hasMany(db.Match, { foreignKey: 'venueId', as: 'matches' });
  };

  return Venue;
};
