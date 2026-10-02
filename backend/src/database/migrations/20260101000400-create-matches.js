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

/** Um par de colunas (casa, visitante) para cada indicador do RF04. */
const statColumns = (Sequelize) =>
  [
    'possession',
    'shots',
    'shots_on_target',
    'fouls',
    'corners',
    'offsides',
    'pass_accuracy',
  ].reduce((columns, metric) => {
    columns[`home_${metric}`] = { type: Sequelize.DECIMAL(5, 2), allowNull: true };
    columns[`away_${metric}`] = { type: Sequelize.DECIMAL(5, 2), allowNull: true };
    return columns;
  }, {});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matches', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true, unique: true },
      league_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'leagues', key: 'id' },
        onDelete: 'CASCADE',
      },
      home_team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      away_team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      venue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'venues', key: 'id' },
        onDelete: 'SET NULL',
      },
      referee_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'referees', key: 'id' },
        onDelete: 'SET NULL',
      },
      kickoff_at: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      minute: { type: Sequelize.INTEGER, allowNull: true },
      home_goals: { type: Sequelize.INTEGER, allowNull: true },
      away_goals: { type: Sequelize.INTEGER, allowNull: true },
      round: { type: Sequelize.STRING(40), allowNull: true },
      synced_at: { type: Sequelize.DATE, allowNull: true },
      ...timestamps(Sequelize),
    });

    await queryInterface.addIndex('matches', ['kickoff_at'], { name: 'matches_kickoff_idx' });
    await queryInterface.addIndex('matches', ['status'], { name: 'matches_status_idx' });
    await queryInterface.addIndex('matches', ['league_id'], { name: 'matches_league_idx' });
    // Acelera o confronto histórico do RF06 nos dois sentidos do par.
    await queryInterface.addIndex('matches', ['home_team_id', 'away_team_id'], {
      name: 'matches_head_to_head_idx',
    });

    await queryInterface.createTable('match_statistics', {
      id: uuid(Sequelize),
      match_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'matches', key: 'id' },
        onDelete: 'CASCADE',
      },
      ...statColumns(Sequelize),
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable('injuries', {
      id: uuid(Sequelize),
      player_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onDelete: 'CASCADE',
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      reason: { type: Sequelize.STRING(160), allowNull: false },
      status: {
        type: Sequelize.ENUM('out', 'doubtful', 'suspended'),
        allowNull: false,
        defaultValue: 'out',
      },
      reported_at: { type: Sequelize.DATE, allowNull: false },
      expected_return_at: { type: Sequelize.DATEONLY, allowNull: true },
      ...timestamps(Sequelize),
    });
    await queryInterface.addIndex('injuries', ['team_id'], { name: 'injuries_team_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('injuries');
    await queryInterface.dropTable('match_statistics');
    await queryInterface.dropTable('matches');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_matches_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_injuries_status";');
  },
};
