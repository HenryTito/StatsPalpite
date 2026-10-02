'use strict';

const { calculateAge, isAtLeast } = require('../../src/utils/age');

describe('cálculo de idade (RF31)', () => {
  const reference = new Date('2026-10-01T12:00:00.000Z');

  it('conta anos completos', () => {
    expect(calculateAge('2000-10-01', reference)).toBe(26);
    expect(calculateAge('1990-01-15', reference)).toBe(36);
  });

  it('não conta o ano quando o aniversário ainda não chegou', () => {
    expect(calculateAge('2008-10-02', reference)).toBe(17);
    expect(calculateAge('2008-12-31', reference)).toBe(17);
  });

  it('conta o ano no próprio dia do aniversário', () => {
    expect(calculateAge('2008-10-01', reference)).toBe(18);
  });

  it('bloqueia menores de 18 e libera quem completou', () => {
    expect(isAtLeast('2008-10-02', 18, reference)).toBe(false);
    expect(isAtLeast('2008-10-01', 18, reference)).toBe(true);
  });

  it('não escorrega por fuso horário perto da virada do dia', () => {
    // 23:30 UTC e 00:30 UTC do dia seguinte não podem dar idades diferentes
    // para quem faz aniversário no dia seguinte.
    const lateNight = new Date('2026-09-30T23:30:00.000Z');
    const afterMidnight = new Date('2026-10-01T00:30:00.000Z');
    expect(calculateAge('2008-10-01', lateNight)).toBe(17);
    expect(calculateAge('2008-10-01', afterMidnight)).toBe(18);
  });

  it('rejeita data inválida', () => {
    expect(() => calculateAge('nao-e-data')).toThrow(TypeError);
  });
});
