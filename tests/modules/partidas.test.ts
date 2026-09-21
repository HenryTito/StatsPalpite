import { estatisticasMedias, partidasDeHoje } from '../../src/infrastructure/fixtures/partidas';

describe('partidas', () => {
  it('descreve partidas ao vivo com placar e minuto', () => {
    partidasDeHoje
      .filter((partida) => partida.status === 'ao-vivo')
      .forEach((partida) => {
        expect(partida.placar).toBeDefined();
        expect(partida.minuto).toBeGreaterThan(0);
      });
  });

  it('mantem as barras de estatistica dentro de 100%', () => {
    estatisticasMedias.forEach((estatistica) => {
      expect(estatistica.pesoMandante + estatistica.pesoVisitante).toBeLessThanOrEqual(100);
    });
  });
});
