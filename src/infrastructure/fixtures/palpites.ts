import type { Palpite } from '../../modules/palpites/domain/Palpite';

export const palpitesPendentes: Palpite[] = [
  {
    id: 'p1',
    partida: 'Palmeiras x Santos',
    quando: 'Hoje, 16:00',
    escolhaRotulo: 'Palmeiras',
    pontosApostados: 7,
    status: 'aguardando',
  },
];

export const palpitesEncerrados: Palpite[] = [
  {
    id: 'p2',
    partida: 'Flamengo 2 x 1 Vasco',
    quando: 'Ontem',
    escolhaRotulo: 'Flamengo',
    pontosApostados: 8,
    status: 'acertou',
    pontosGanhos: 16,
    placarFinal: '2 x 1',
  },
  {
    id: 'p3',
    partida: 'Grêmio 0 x 2 Inter',
    quando: 'Ontem',
    escolhaRotulo: 'Grêmio',
    pontosApostados: 5,
    status: 'errou',
    pontosGanhos: 0,
    placarFinal: '0 x 2',
  },
];
