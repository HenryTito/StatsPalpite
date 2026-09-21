import type { Jogador, PosicaoUsuario } from '../../modules/ranking/domain/Jogador';

export const rankingGlobal: Jogador[] = [
  { posicao: 1, usuario: 'marcosbet', pontos: '1.204' },
  { posicao: 2, usuario: 'ana_stats', pontos: '1.150' },
  { posicao: 3, usuario: 'jp_futebol', pontos: '1.098' },
  { posicao: 4, usuario: 'tatica10', pontos: '1.041' },
  { posicao: 5, usuario: 'gol_de_placa', pontos: '987' },
  { posicao: 6, usuario: 'bia_palpites', pontos: '940' },
  { posicao: 7, usuario: 'zagueiro77', pontos: '902' },
];

export const posicaoDoUsuario: PosicaoUsuario = { posicao: 42, pontos: 328, paraSubir: 12 };

export const perfilUsuario = {
  iniciais: 'HT',
  usuario: 'henrytito',
  taxaAcerto: '61%',
  palpites: '87',
  sequencia: '4',
  /** Altura relativa das barras dos ultimos 7 dias, em porcentagem. */
  ultimosSeteDias: [32, 54, 41, 72, 60, 86, 97],
};
