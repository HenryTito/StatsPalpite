'use strict';

module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define(
    'Match',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      externalId: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      leagueId: { type: DataTypes.UUID, allowNull: false },
      homeTeamId: { type: DataTypes.UUID, allowNull: false },
      awayTeamId: { type: DataTypes.UUID, allowNull: false },
      venueId: { type: DataTypes.UUID, allowNull: true },
      refereeId: { type: DataTypes.UUID, allowNull: true },
      kickoffAt: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      /** Minuto corrente, preenchido apenas enquanto a partida está ao vivo. */
      minute: { type: DataTypes.INTEGER, allowNull: true },
      homeGoals: { type: DataTypes.INTEGER, allowNull: true },
      awayGoals: { type: DataTypes.INTEGER, allowNull: true },
      round: { type: DataTypes.STRING(40), allowNull: true },
      /** Momento da última ingestão, base para o aviso de dados velhos (RF68). */
      syncedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'matches',
      indexes: [{ fields: ['kickoff_at'] }, { fields: ['status'] }, { fields: ['league_id'] }],
    },
  );

  Match.associate = (db) => {
    Match.belongsTo(db.League, { foreignKey: 'leagueId', as: 'league' });
    Match.belongsTo(db.Team, { foreignKey: 'homeTeamId', as: 'homeTeam' });
    Match.belongsTo(db.Team, { foreignKey: 'awayTeamId', as: 'awayTeam' });
    Match.belongsTo(db.Venue, { foreignKey: 'venueId', as: 'venue' });
    Match.belongsTo(db.Referee, { foreignKey: 'refereeId', as: 'referee' });
    Match.hasOne(db.MatchStatistic, { foreignKey: 'matchId', as: 'statistics' });
    Match.hasMany(db.Prediction, { foreignKey: 'matchId', as: 'predictions' });
  };

  /** Vencedor real da partida, ou null enquanto ela não termina. */
  Match.prototype.outcome = function outcome() {
    if (this.status !== 'finished' || this.homeGoals === null || this.awayGoals === null)
      return null;
    if (this.homeGoals > this.awayGoals) return 'home';
    if (this.homeGoals < this.awayGoals) return 'away';
    return 'draw';
  };

  return Match;
};
