'use strict';

const translator = require('../../src/providers/translators/localTranslator');
const apiFootball = require('../../src/providers/translators/apiFootballTranslator');

describe('camada anticorrupção', () => {
  it('traduz o status da fonte local para o vocabulário do domínio', () => {
    expect(translator.toMatch({ situacao: 'FT', fixture_id: 'x' }).status).toBe('finished');
    expect(translator.toMatch({ situacao: 'NS', fixture_id: 'x' }).status).toBe('scheduled');
    expect(translator.toMatch({ situacao: 'LIVE', fixture_id: 'x' }).status).toBe('live');
    expect(translator.toMatch({ situacao: 'PST', fixture_id: 'x' }).status).toBe('postponed');
  });

  it('trata status desconhecido como agendado em vez de quebrar', () => {
    expect(translator.toMatch({ situacao: 'ALGO_NOVO', fixture_id: 'x' }).status).toBe('scheduled');
  });

  it('desaninha o placar da fonte', () => {
    const dto = translator.toMatch({
      fixture_id: 'x',
      situacao: 'FT',
      placar: { casa: 3, fora: 1 },
    });
    expect(dto.homeGoals).toBe(3);
    expect(dto.awayGoals).toBe(1);
  });

  it('devolve placar nulo quando a partida não começou', () => {
    const dto = translator.toMatch({ fixture_id: 'x', situacao: 'NS', placar: null });
    expect(dto.homeGoals).toBeNull();
    expect(dto.awayGoals).toBeNull();
  });

  it('converte números em formatos variados', () => {
    expect(translator.toNumber('54.3%')).toBe(54.3);
    expect(translator.toNumber('12')).toBe(12);
    expect(translator.toNumber(7)).toBe(7);
    expect(translator.toNumber(null)).toBeNull();
    expect(translator.toNumber('sem valor')).toBeNull();
  });

  it('traduz o vocabulário de desfalque', () => {
    expect(translator.toInjury({ situacao: 'OUT', jogador_id: 'p' }).status).toBe('out');
    expect(translator.toInjury({ situacao: 'DOUBTFUL', jogador_id: 'p' }).status).toBe('doubtful');
    expect(translator.toInjury({ situacao: 'SUSPENDED', jogador_id: 'p' }).status).toBe(
      'suspended',
    );
  });

  it('converte a lista de pares da API-Football em mapa', () => {
    const map = apiFootball.statsToMap([
      { type: 'Ball Possession', value: '54%' },
      { type: 'Total Shots', value: 12 },
    ]);
    expect(map['Ball Possession']).toBe('54%');
    expect(map['Total Shots']).toBe(12);
  });

  it('produz o mesmo contrato a partir de fontes diferentes', () => {
    const local = translator.toMatch({
      fixture_id: 'M-1',
      competicao: 'L-1',
      mandante: 'T-1',
      visitante: 'T-2',
      data_hora_utc: '2026-10-01T19:00:00.000Z',
      situacao: 'FT',
      placar: { casa: 2, fora: 1 },
    });

    const external = apiFootball.toMatch({
      fixture: {
        id: 99,
        timestamp: Date.parse('2026-10-01T19:00:00.000Z') / 1000,
        status: { short: 'FT' },
      },
      league: { id: 7 },
      teams: { home: { id: 1 }, away: { id: 2 } },
      goals: { home: 2, away: 1 },
    });

    // Chaves idênticas: é isso que permite trocar de fonte sem tocar no resto.
    expect(Object.keys(local).sort()).toEqual(Object.keys(external).sort());
    expect(external.status).toBe('finished');
    expect(external.homeGoals).toBe(2);
  });
});
