'use strict';

/**
 * Índices de trigrama sobre o nome sem acento. É o que torna o RF27 e o RF56
 * viáveis com LIKE/similaridade, sem um motor de busca dedicado — a
 * simplificação registrada na aba Profundidade do backlog.
 *
 * unaccent não é IMMUTABLE por padrão, então um índice de expressão sobre ela
 * é recusado. A função abaixo encapsula a chamada e declara a imutabilidade.
 */
const IMMUTABLE_UNACCENT = `
  CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
  $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
`;

const TABLES = ['teams', 'players', 'leagues', 'venues'];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(IMMUTABLE_UNACCENT);

    for (const table of TABLES) {
      await queryInterface.sequelize.query(`
        CREATE INDEX ${table}_name_trgm_idx
        ON ${table}
        USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);
      `);
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${table}_name_trgm_idx;`);
    }
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS immutable_unaccent(text);');
  },
};
