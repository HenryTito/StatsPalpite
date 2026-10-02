import { toPartida } from '../../src/app/screens/home/toPartida';
import type { MatchSummary } from '../../src/core/api/types';

/** Adaptador entre a resposta da API e o modelo de domínio do app. */
function buildMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    id: 'm1',
    externalId: 'M-1',
    league: { id: 'l1', name: 'Brasileirão', country: 'Brasil' },
    homeTeam: { id: 't1', name: 'Palmeiras', shortName: 'PAL' },
    awayTeam: { id: 't2', name: 'Santos', shortName: 'SAN' },
    venue: null,
    kickoffAt: new Date(Date.now() + 3600_000).toISOString(),
    status: 'scheduled',
    minute: null,
    score: { home: null, away: null },
    round: null,
    probability: { home: 58, draw: 18, away: 24, confidence: 72 },
    form: { home: [], away: [] },
    syncedAt: null,
    stale: false,
    ...overrides,
  };
}

describe('toPartida', () => {
  it('traduz o status da API para o vocabulário do app', () => {
    expect(toPartida(buildMatch({ status: 'live' })).status).toBe('ao-vivo');
    expect(toPartida(buildMatch({ status: 'finished' })).status).toBe('encerrada');
    expect(toPartida(buildMatch({ status: 'scheduled' })).status).toBe('agendada');
  });

  it('mostra o minuto corrente quando a partida está ao vivo', () => {
    const partida = toPartida(buildMatch({ status: 'live', minute: 34 }));
    expect(partida.horario).toBe("34'");
  });

  it('mostra a contagem regressiva para partida nas próximas 24 horas', () => {
    const partida = toPartida(
      buildMatch({ kickoffAt: new Date(Date.now() + 7200_000).toISOString() }),
    );
    expect(partida.horario).toMatch(/^em /);
  });

  it('mostra o horário quando falta mais de um dia', () => {
    const partida = toPartida(
      buildMatch({ kickoffAt: new Date(Date.now() + 3 * 86400_000).toISOString() }),
    );
    expect(partida.horario).not.toMatch(/^em /);
    expect(partida.horario).toMatch(/\d{2}:\d{2}/);
  });

  it('omite o placar enquanto a partida não começou', () => {
    expect(toPartida(buildMatch()).placar).toBeUndefined();
  });

  it('converte o placar quando existe', () => {
    const partida = toPartida(buildMatch({ status: 'finished', score: { home: 2, away: 1 } }));
    expect(partida.placar).toEqual({ mandante: 2, visitante: 1 });
  });

  it('usa travessão quando a liga ou o time vêm nulos', () => {
    const partida = toPartida(buildMatch({ league: null, homeTeam: null }));
    expect(partida.liga).toBe('—');
    expect(partida.mandante).toBe('—');
  });
});
