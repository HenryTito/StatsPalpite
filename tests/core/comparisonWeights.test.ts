/**
 * Replica a regra de repartição do ComparisonPanel.
 *
 * O que importa aqui é a invariante: as duas fatias precisam somar exatamente
 * 100, inclusive quando as duas caem em .5 — o caso que fazia a barra estourar
 * o contêiner.
 */
function weights(home: number | null, away: number | null, lowerIsBetter = false) {
  if (home === null || away === null) return { home: 50, away: 50 };

  const homeValue = lowerIsBetter ? away : home;
  const awayValue = lowerIsBetter ? home : away;
  const total = homeValue + awayValue;
  if (total <= 0) return { home: 50, away: 50 };

  const homeShare = Math.min(100, Math.max(0, Math.round((homeValue / total) * 100)));
  return { home: homeShare, away: 100 - homeShare };
}

describe('repartição da barra de comparação', () => {
  it('soma exatamente 100 em qualquer par', () => {
    const casos: [number, number][] = [
      [54.3, 45.7],
      [67, 133],
      [1, 1],
      [12, 8],
      [0.5, 1.5],
      [6.1, 4.3],
      [1, 999],
      [3, 1],
    ];

    casos.forEach(([home, away]) => {
      const resultado = weights(home, away);
      expect(resultado.home + resultado.away).toBe(100);
    });
  });

  it('não estoura no caso de borda que somava 101', () => {
    // 67/200 = 33,5 e 133/200 = 66,5: arredondar os dois dava 34 + 67.
    expect(weights(67, 133)).toEqual({ home: 34, away: 66 });
  });

  it('divide ao meio quando os dois lados são zero', () => {
    expect(weights(0, 0)).toEqual({ home: 50, away: 50 });
  });

  it('divide ao meio quando falta dado', () => {
    expect(weights(null, 10)).toEqual({ home: 50, away: 50 });
    expect(weights(10, null)).toEqual({ home: 50, away: 50 });
  });

  it('inverte a vantagem em métricas onde menos é melhor', () => {
    // Menos faltas é melhor: quem fez 6 recebe a fatia maior.
    const resultado = weights(6, 14, true);
    expect(resultado.home).toBeGreaterThan(resultado.away);
  });

  it('nunca produz fatia negativa, mesmo com dado corrompido', () => {
    const resultado = weights(-50, 10);
    expect(resultado.home).toBeGreaterThanOrEqual(0);
    expect(resultado.away).toBeGreaterThanOrEqual(0);
    expect(resultado.home + resultado.away).toBe(100);
  });
});
