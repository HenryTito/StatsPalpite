'use strict';

module.exports = (sequelize, DataTypes) => {
  const Prediction = sequelize.define(
    'Prediction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      matchId: { type: DataTypes.UUID, allowNull: false },
      choice: { type: DataTypes.ENUM('home', 'draw', 'away'), allowNull: false },
      /** Aposta simbólica de 1 a 10 pontos. */
      stake: { type: DataTypes.INTEGER, allowNull: false },
      predictedHomeGoals: { type: DataTypes.INTEGER, allowNull: true },
      predictedAwayGoals: { type: DataTypes.INTEGER, allowNull: true },
      justification: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'won', 'lost', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      pointsAwarded: { type: DataTypes.INTEGER, allowNull: true },
      settledAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'predictions',
      indexes: [{ unique: true, fields: ['user_id', 'match_id'] }, { fields: ['match_id'] }],
    },
  );

  Prediction.associate = (db) => {
    Prediction.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
    Prediction.belongsTo(db.Match, { foreignKey: 'matchId', as: 'match' });
  };

  return Prediction;
};
