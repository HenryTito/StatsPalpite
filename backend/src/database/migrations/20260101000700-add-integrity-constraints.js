'use strict';

/**
 * Invariantes de negócio no próprio banco.
 *
 * A validação da API é a primeira linha de defesa, não a única: um script de
 * manutenção, um seed mal escrito ou um bug numa sprint futura escrevem
 * direto na tabela e passam por cima dela. O que está aqui vale sempre.
 *
 * Cada restrição corresponde a uma regra escrita no documento de requisitos.
 */
const CHECKS = [
  // RF08: a aposta simbólica varia de 1 a 10 pontos.
  {
    table: 'predictions',
    name: 'predictions_stake_range',
    expression: 'stake >= 1 AND stake <= 10',
  },
  // Pontuação creditada nunca é negativa.
  {
    table: 'predictions',
    name: 'predictions_points_non_negative',
    expression: 'points_awarded IS NULL OR points_awarded >= 0',
  },
  // Placar palpitado não pode ser negativo.
  {
    table: 'predictions',
    name: 'predictions_predicted_goals_non_negative',
    expression:
      '(predicted_home_goals IS NULL OR predicted_home_goals >= 0) AND ' +
      '(predicted_away_goals IS NULL OR predicted_away_goals >= 0)',
  },
  /**
   * Coerência entre situação e pontuação (RF09):
   *   pendente   — ainda não apurado, sem pontos e sem data de apuração
   *   ganho      — apurado, com pontos acima de zero
   *   perdido    — apurado, com zero ponto
   *   cancelado  — não pontua
   * Sem isto, um palpite perdido poderia carregar pontos e inflar o ranking.
   */
  {
    table: 'predictions',
    name: 'predictions_status_consistency',
    expression: `
      (status = 'pending'   AND points_awarded IS NULL AND settled_at IS NULL) OR
      (status = 'won'       AND points_awarded > 0     AND settled_at IS NOT NULL) OR
      (status = 'lost'      AND points_awarded = 0     AND settled_at IS NOT NULL) OR
      (status = 'cancelled' AND COALESCE(points_awarded, 0) = 0)
    `,
  },
  // Pontuação acumulada do usuário nunca fica negativa.
  { table: 'users', name: 'users_points_non_negative', expression: 'points >= 0' },
  // Placar real não pode ser negativo.
  {
    table: 'matches',
    name: 'matches_goals_non_negative',
    expression: '(home_goals IS NULL OR home_goals >= 0) AND (away_goals IS NULL OR away_goals >= 0)',
  },
  // Minuto corrente dentro de uma partida plausível, prorrogação incluída.
  {
    table: 'matches',
    name: 'matches_minute_range',
    expression: 'minute IS NULL OR (minute >= 0 AND minute <= 130)',
  },
  // Um time não joga contra si mesmo.
  {
    table: 'matches',
    name: 'matches_distinct_teams',
    expression: 'home_team_id <> away_team_id',
  },
  // Posição no ranking começa em 1.
  {
    table: 'ranking_snapshots',
    name: 'ranking_snapshots_valid',
    expression: 'position >= 1 AND points >= 0',
  },
];

/**
 * Impede palpite em partida que já começou (RF41, por simetria com o
 * cancelamento). É cruzamento entre tabelas, então não cabe num CHECK — e
 * um gatilho é o único jeito de garantir isso mesmo contra escrita direta.
 *
 * Confere DUAS coisas, porque uma só não basta: o horário de início e a
 * situação informada pela fonte. Uma partida marcada como ao vivo com
 * horário no futuro — relógio fora de sincronia, fonte adiantada — passaria
 * por uma checagem apenas de horário.
 */
const KICKOFF_GUARD = `
  CREATE OR REPLACE FUNCTION prevent_prediction_after_kickoff()
  RETURNS trigger
  LANGUAGE plpgsql AS $$
  DECLARE
    kickoff timestamptz;
    match_status text;
  BEGIN
    -- Só interessa o palpite ainda em aberto: a apuração de partidas
    -- passadas grava 'won' e 'lost' legitimamente.
    IF NEW.status <> 'pending' THEN
      RETURN NEW;
    END IF;

    SELECT kickoff_at, status::text INTO kickoff, match_status
    FROM matches WHERE id = NEW.match_id;

    IF match_status IS NOT NULL AND match_status NOT IN ('scheduled', 'postponed') THEN
      RAISE EXCEPTION 'Partida não está mais aberta a palpites (situação: %)', match_status
        USING ERRCODE = 'check_violation';
    END IF;

    IF kickoff IS NOT NULL AND kickoff <= now() THEN
      RAISE EXCEPTION 'Partida já começou: não é possível registrar ou manter palpite pendente'
        USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
  END;
  $$;
`;

module.exports = {
  async up(queryInterface) {
    for (const check of CHECKS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${check.table} ADD CONSTRAINT ${check.name} CHECK (${check.expression});`,
      );
    }

    await queryInterface.sequelize.query(KICKOFF_GUARD);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER predictions_kickoff_guard
      BEFORE INSERT OR UPDATE ON predictions
      FOR EACH ROW EXECUTE FUNCTION prevent_prediction_after_kickoff();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS predictions_kickoff_guard ON predictions;',
    );
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS prevent_prediction_after_kickoff();',
    );

    for (const check of CHECKS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${check.table} DROP CONSTRAINT IF EXISTS ${check.name};`,
      );
    }
  },
};
