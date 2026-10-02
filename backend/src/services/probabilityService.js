'use strict';

/**
 * Probabilidade preliminar de vitória (RF03).
 *
 * O documento pede "um algoritmo interno". Este é ele, e é deliberadamente
 * explicável: três fatores com peso declarado, somados numa força por time e
 * normalizados em três resultados.
 *
 *   forma recente  (50%) — pontos dos últimos jogos, 3/1/0, normalizado em 0..1
 *   confronto      (30%) — aproveitamento no histórico direto entre os dois
 *   fator casa     (20%) — vantagem fixa do mandante
 *
 * A "confiança do palpite" do RF21, com cinco fatores incluindo lesões e
 * clima, é da Sprint 2 e vai estender este módulo. O que existe aqui é a
 * probabilidade preliminar que a Home exibe.
 */

const WEIGHTS = Object.freeze({ form: 0.5, headToHead: 0.3, homeAdvantage: 0.2 });

/** Vantagem do mandante, em pontos da escala 0..1. */
const HOME_ADVANTAGE = 0.55;

/** Peso do empate na normalização. Calibrado para ~25% em jogos equilibrados. */
const DRAW_WEIGHT = 0.62;

/** Pontos de uma sequência de resultados, na escala 3/1/0. */
function formScore(results = []) {
  if (!results.length) return 0.5;
  const points = results.reduce((total, result) => {
    if (result === 'W') return total + 3;
    if (result === 'D') return total + 1;
    return total;
  }, 0);
  return points / (results.length * 3);
}

/**
 * Participação do mandante nos pontos do confronto direto.
 *
 * Divide-se pelos pontos SOMADOS dos dois lados, não pelo máximo teórico: um
 * empate dá 1 ponto a cada um, então um retrospecto parelho precisa devolver
 * exatamente 0.5. Normalizar por `jogos * 3` empurraria todo histórico com
 * empates para baixo de 0.5 e inverteria o favorito.
 */
function headToHeadScore({ homeWins = 0, draws = 0, awayWins = 0 } = {}) {
  const homePoints = homeWins * 3 + draws;
  const awayPoints = awayWins * 3 + draws;
  const total = homePoints + awayPoints;
  if (!total) return 0.5;
  return homePoints / total;
}

/**
 * @param {{homeForm: string[], awayForm: string[], headToHead: object}} input
 * @returns {{home: number, draw: number, away: number, confidence: number}}
 *          Percentuais inteiros que somam 100.
 */
function calculate({ homeForm = [], awayForm = [], headToHead = {} } = {}) {
  const homeFormScore = formScore(homeForm);
  const awayFormScore = formScore(awayForm);
  const h2h = headToHeadScore(headToHead);

  const homeStrength =
    homeFormScore * WEIGHTS.form + h2h * WEIGHTS.headToHead + HOME_ADVANTAGE * WEIGHTS.homeAdvantage;
  const awayStrength =
    awayFormScore * WEIGHTS.form +
    (1 - h2h) * WEIGHTS.headToHead +
    (1 - HOME_ADVANTAGE) * WEIGHTS.homeAdvantage;

  // O empate cresce quando as forças se aproximam.
  const balance = 1 - Math.abs(homeStrength - awayStrength);
  const drawStrength = balance * DRAW_WEIGHT * ((homeStrength + awayStrength) / 2);

  const total = homeStrength + awayStrength + drawStrength;
  const home = Math.round((homeStrength / total) * 100);
  const away = Math.round((awayStrength / total) * 100);
  // O empate recebe o resto, garantindo soma exata de 100.
  const draw = 100 - home - away;

  return {
    home,
    draw,
    away,
    /**
     * Confiança da própria previsão: quão destacado está o favorito. Um jogo
     * 60/25/15 é mais confiável que um 36/32/32.
     */
    confidence: Math.round(Math.min(100, Math.abs(home - away) * 1.6 + 40)),
  };
}

module.exports = { calculate, formScore, headToHeadScore, WEIGHTS, HOME_ADVANTAGE, DRAW_WEIGHT };
