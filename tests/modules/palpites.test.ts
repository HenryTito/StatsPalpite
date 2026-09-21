import { palpitesEncerrados, palpitesPendentes } from '../../src/infrastructure/fixtures/palpites';
import { ORCAMENTO_DIARIO } from '../../src/modules/palpites/domain/Palpite';

describe('palpites', () => {
  it('nao permite apostar acima do orcamento diario', () => {
    const total = palpitesPendentes.reduce((soma, p) => soma + p.pontosApostados, 0);
    expect(total).toBeLessThanOrEqual(ORCAMENTO_DIARIO);
  });

  it('credita pontos apenas em palpites certos', () => {
    palpitesEncerrados.forEach((palpite) => {
      if (palpite.status === 'errou') {
        expect(palpite.pontosGanhos).toBe(0);
      }
      if (palpite.status === 'acertou') {
        expect(palpite.pontosGanhos ?? 0).toBeGreaterThan(0);
      }
    });
  });
});
