import { formatCountdown, IMMINENT_THRESHOLD_SECONDS } from '../../src/core/i18n/formatCountdown';

/** Contador regressivo do RF43. */
describe('formatCountdown', () => {
  const agora = new Date('2026-10-01T12:00:00.000Z');
  const daqui = (segundos: number) => new Date(agora.getTime() + segundos * 1000);

  it('marca como iniciada quando o horário já passou', () => {
    const resultado = formatCountdown(daqui(-1), agora);
    expect(resultado.started).toBe(true);
    expect(resultado.totalSeconds).toBe(0);
  });

  it('usa dias e horas quando falta muito', () => {
    expect(formatCountdown(daqui(2 * 86400 + 4 * 3600), agora).label).toBe('2d 4h');
  });

  it('usa horas e minutos na faixa intermediária', () => {
    expect(formatCountdown(daqui(2 * 3600 + 14 * 60), agora).label).toBe('2h 14min');
  });

  it('usa minutos e segundos quando está perto', () => {
    expect(formatCountdown(daqui(5 * 60 + 7), agora).label).toBe('5min 07s');
  });

  it('usa só segundos no último minuto', () => {
    expect(formatCountdown(daqui(42), agora).label).toBe('42s');
  });

  it('sinaliza iminente exatamente na janela de 5 minutos', () => {
    expect(formatCountdown(daqui(IMMINENT_THRESHOLD_SECONDS), agora).imminent).toBe(true);
    expect(formatCountdown(daqui(IMMINENT_THRESHOLD_SECONDS + 1), agora).imminent).toBe(false);
  });

  it('aceita string ISO além de Date', () => {
    expect(formatCountdown(daqui(60).toISOString(), agora).label).toBe('1min 00s');
  });
});
