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
    await queryInterface.createTable('leagues', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      country: { type: Sequelize.STRING(80), allowNull: false },
      season: { type: Sequelize.INTEGER, allowNull: false },
      logo_url: { type: Sequelize.STRING, allowNull: true },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable('venues', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true },
      name: { type: Sequelize.STRING(140), allowNull: false },
      city: { type: Sequelize.STRING(120), allowNull: true },
      capacity: { type: Sequelize.INTEGER, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(9, 6), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(9, 6), allowNull: true },
      opened_year: { type: Sequelize.INTEGER, allowNull: true },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable('teams', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      short_name: { type: Sequelize.STRING(32), allowNull: true },
      country: { type: Sequelize.STRING(80), allowNull: true },
      logo_url: { type: Sequelize.STRING, allowNull: true },
      league_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'leagues', key: 'id' },
        onDelete: 'SET NULL',
      },
      venue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'venues', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable('players', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true },
      name: { type: Sequelize.STRING(140), allowNull: false },
      position: { type: Sequelize.STRING(40), allowNull: true },
      team_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      goals: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      assists: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      yellow_cards: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      red_cards: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      appearances: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable('referees', {
      id: uuid(Sequelize),
      external_id: { type: Sequelize.STRING(64), allowNull: true },
      name: { type: Sequelize.STRING(140), allowNull: false },
      country: { type: Sequelize.STRING(80), allowNull: true },
      matches_officiated: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      avg_fouls: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      avg_yellow_cards: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      avg_red_cards: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      avg_penalties: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      ...timestamps(Sequelize),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('referees');
    await queryInterface.dropTable('players');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('venues');
    await queryInterface.dropTable('leagues');
  },
};
