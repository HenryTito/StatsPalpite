'use strict';

const { toPercentages } = require('../../src/utils/percentage');

describe('percentuais que fecham em 100', () => {
  it('fecha em 100 em qualquer combinação', () => {
    const casos = [
      { home: 1, draw: 1, away: 1 },
      { home: 2, draw: 3, away: 2 },
      { home: 1, draw: 1, away: 4 },
      { home: 7, draw: 0, away: 3 },
      { home: 1, draw: 0, away: 0 },
      { home: 99, draw: 1, away: 1 },
      { home: 33, draw: 33, away: 34 },
    ];

    casos.forEach((caso) => {
      const resultado = toPercentages(caso);
      expect(resultado.home + resultado.draw + resultado.away).toBe(100);
    });
  });

  it('devolve zeros quando não há nenhum voto, sem dividir por zero', () => {
    expect(toPercentages({ home: 0, draw: 0, away: 0 })).toEqual({ home: 0, draw: 0, away: 0 });
  });

  it('entrega a sobra a quem tem a maior fração', () => {
    // 1/1/1 dá 33,33 para cada; a unidade que falta vai para o primeiro.
    const resultado = toPercentages({ home: 1, draw: 1, away: 1 });
    expect(resultado.home).toBe(34);
    expect(resultado.draw).toBe(33);
    expect(resultado.away).toBe(33);
  });

  it('preserva a ordem de grandeza entre as fatias', () => {
    const resultado = toPercentages({ home: 1, draw: 1, away: 4 });
    expect(resultado.away).toBeGreaterThan(resultado.home);
    expect(resultado.away).toBeGreaterThan(resultado.draw);
  });

  it('funciona com qualquer conjunto de chaves', () => {
    const resultado = toPercentages({ a: 1, b: 2 });
    expect(resultado.a + resultado.b).toBe(100);
  });
});
