import { colors, radius, spacing } from '../../src/core/theme';

/** Guarda os tokens contra alteracoes acidentais fora do design. */
describe('tokens de tema', () => {
  it('mantem a paleta dark do design', () => {
    expect(colors.sur).toBe('#161C20');
    expect(colors.acc).toBe('#4A9EEA');
    expect(colors.ink).toBe('#E9EEF1');
  });

  it('expoe a escala de espacamento em multiplos de 4', () => {
    Object.values(spacing).forEach((value) => {
      expect(value % 4).toBe(0);
    });
  });

  it('usa raio de 12 como padrao dos controles', () => {
    expect(radius.lg).toBe(12);
  });
});
