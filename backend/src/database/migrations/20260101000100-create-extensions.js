'use strict';

/**
 * pg_trgm e unaccent sustentam a busca textual parcial do RF27 e do RF56:
 * digitar "sao paulo" precisa encontrar "São Paulo".
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pg_trgm;');
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS unaccent;');
  },
};
