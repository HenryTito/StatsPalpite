'use strict';

const uuid = (Sequelize) => ({
  type: Sequelize.UUID,
  primaryKey: true,
  defaultValue: Sequelize.literal('gen_random_uuid()'),
});

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false },
  updated_at: { type: Sequelize.DATE, allowNull: false },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('predictions', {
      id: uuid(Sequelize),
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      match_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onDelete: 'CASCADE',
      },
      choice: { type: Sequelize.ENUM('home', 'draw', 'away'), allowNull: false },
      stake: { type: Sequelize.INTEGER, allowNull: false },
      predicted_home_goals: { type: Sequelize.INTEGER, allowNull: true },
      predicted_away_goals: { type: Sequelize.INTEGER, allowNull: true },
      justification: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'won', 'lost', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      points_awarded: { type: Sequelize.INTEGER, allowNull: true },
      settled_at: { type: Sequelize.DATE, allowNull: true },
      ...timestamps(Sequelize),
    });

    // Um palpite por usuário por partida.
    await queryInterface.addIndex('predictions', ['user_id', 'match_id'], {
      unique: true,
      name: 'predictions_user_match_unique',
    });
    await queryInterface.addIndex('predictions', ['match_id'], { name: 'predictions_match_idx' });

    await queryInterface.createTable('ranking_snapshots', {
      id: uuid(Sequelize),
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      captured_on: { type: Sequelize.DATEONLY, allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false },
      points: { type: Sequelize.INTEGER, allowNull: false },
      ...timestamps(Sequelize),
    });
    await queryInterface.addIndex('ranking_snapshots', ['user_id', 'captured_on'], {
      unique: true,
      name: 'ranking_snapshots_user_day_unique',
    });
    await queryInterface.addIndex('ranking_snapshots', ['captured_on'], {
      name: 'ranking_snapshots_day_idx',
    });

    await queryInterface.createTable('audit_logs', {
      id: uuid(Sequelize),
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: { type: Sequelize.STRING(60), allowNull: false },
      resource: { type: Sequelize.STRING(120), allowNull: true },
      ip_address: { type: Sequelize.STRING(64), allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('audit_logs', ['user_id'], { name: 'audit_logs_user_idx' });
    await queryInterface.addIndex('audit_logs', ['action'], { name: 'audit_logs_action_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('ranking_snapshots');
    await queryInterface.dropTable('predictions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_predictions_choice";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_predictions_status";');
  },
};
