'use strict';

module.exports = (sequelize, DataTypes) => {
  const RankingSnapshot = sequelize.define(
    'RankingSnapshot',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      /** Uma linha por usuário por dia: é o histórico que o RF71 plota em 30 dias. */
      capturedOn: { type: DataTypes.DATEONLY, allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
      points: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'ranking_snapshots',
      indexes: [{ unique: true, fields: ['user_id', 'captured_on'] }, { fields: ['captured_on'] }],
    },
  );

  RankingSnapshot.associate = (db) => {
    RankingSnapshot.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
  };

  return RankingSnapshot;
};
