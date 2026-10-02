'use strict';

const probabilityService = require('../../src/services/probabilityService');

describe('probabilidade preliminar (RF03)', () => {
  it('sempre soma exatamente 100', () => {
    const inputs = [
      {},
      { homeForm: ['W', 'W', 'W'], awayForm: ['L', 'L', 'L'] },
      { homeForm: ['L'], awayForm: ['W'], headToHead: { homeWins: 0, draws: 0, awayWins: 9 } },
      {
        homeForm: ['D', 'D'],
        awayForm: ['D', 'D'],
        headToHead: { homeWins: 1, draws: 1, awayWins: 1 },
      },
    ];

    inputs.forEach((input) => {
      const result = probabilityService.calculate(input);
      expect(result.home + result.draw + result.away).toBe(100);
    });
  });

  it('dá vantagem ao mandante quando tudo o mais é igual', () => {
    const result = probabilityService.calculate({
      homeForm: ['W', 'D', 'L'],
      awayForm: ['W', 'D', 'L'],
      headToHead: { homeWins: 2, draws: 2, awayWins: 2 },
    });
    expect(result.home).toBeGreaterThan(result.away);
  });

  it('trata retrospecto parelho como 0.5, mesmo cheio de empates', () => {
    expect(probabilityService.headToHeadScore({ homeWins: 2, draws: 2, awayWins: 2 })).toBe(0.5);
    expect(probabilityService.headToHeadScore({ homeWins: 0, draws: 6, awayWins: 0 })).toBe(0.5);
    expect(probabilityService.headToHeadScore({})).toBe(0.5);
  });

  it('favorece quem tem forma melhor', () => {
    const strongHome = probabilityService.calculate({
      homeForm: ['W', 'W', 'W', 'W', 'W'],
      awayForm: ['L', 'L', 'L', 'L', 'L'],
    });
    const strongAway = probabilityService.calculate({
      homeForm: ['L', 'L', 'L', 'L', 'L'],
      awayForm: ['W', 'W', 'W', 'W', 'W'],
    });
    expect(strongHome.home).toBeGreaterThan(60);
    expect(strongAway.away).toBeGreaterThan(60);
  });

  it('pontua a forma recente na escala 3/1/0', () => {
    expect(probabilityService.formScore(['W', 'W', 'W'])).toBe(1);
    expect(probabilityService.formScore(['L', 'L', 'L'])).toBe(0);
    expect(probabilityService.formScore([])).toBe(0.5);
  });

  it('confia mais quando há um favorito claro', () => {
    const clear = probabilityService.calculate({
      homeForm: ['W', 'W', 'W'],
      awayForm: ['L', 'L', 'L'],
    });
    const tight = probabilityService.calculate({
      homeForm: ['W', 'D', 'L'],
      awayForm: ['W', 'D', 'L'],
    });
    expect(clear.confidence).toBeGreaterThan(tight.confidence);
  });
});
