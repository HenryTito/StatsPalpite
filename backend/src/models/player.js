'use strict';

module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define(
    'Player',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      externalId: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(140), allowNull: false },
      position: { type: DataTypes.STRING(40), allowNull: true },
      teamId: { type: DataTypes.UUID, allowNull: true },
      /** Estatísticas da temporada corrente, consultadas pela busca de jogador (RF56). */
      goals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      assists: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      yellowCards: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      redCards: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      appearances: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'players' },
  );

  Player.associate = (db) => {
    Player.belongsTo(db.Team, { foreignKey: 'teamId', as: 'team' });
    Player.hasMany(db.Injury, { foreignKey: 'playerId', as: 'injuries' });
  };

  return Player;
};
