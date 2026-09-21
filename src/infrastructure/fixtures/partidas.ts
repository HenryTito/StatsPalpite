import type {
  EstatisticaComparada,
  EventoPartida,
  Partida,
  ResultadoRecente,
} from '../../modules/partidas/domain/Partida';

/**
 * Dados do protótipo. Ficam isolados aqui para que as telas dependam de
 * tipos do dominio, e nao de literais — a troca pela API nao toca a UI.
 */
export const partidasDeHoje: Partida[] = [
  {
    id: 'pal-san',
    liga: 'Brasileirão · Série A',
    mandante: 'Palmeiras',
    visitante: 'Santos',
    status: 'agendada',
    horario: '16:00',
    probabilidade: { mandante: 58, visitante: 24 },
    confianca: 72,
  },
  {
    id: 'rma-bet',
    liga: 'La Liga',
    mandante: 'Real Madrid',
    visitante: 'Betis',
    status: 'ao-vivo',
    horario: "34'",
    minuto: 34,
    placar: { mandante: 1, visitante: 0 },
  },
  {
    id: 'ars-che',
    liga: 'Premier League',
    mandante: 'Arsenal',
    visitante: 'Chelsea',
    status: 'agendada',
    horario: 'em 2h 14min',
    probabilidade: { mandante: 45, visitante: 31 },
  },
];

export const ligas = ['Brasileirão', 'Premier', 'La Liga', 'Libertadores'];

export const detalheResumo = [
  { rotulo: 'Clima', valor: '24°C' },
  { rotulo: 'Início', valor: '16:00' },
  { rotulo: 'Estádio', valor: 'Allianz' },
];

export const estatisticasMedias: EstatisticaComparada[] = [
  {
    rotulo: 'Posse de bola',
    mandante: '54%',
    visitante: '46%',
    pesoMandante: 54,
    pesoVisitante: 46,
  },
  { rotulo: 'Finalizações', mandante: '12', visitante: '8', pesoMandante: 60, pesoVisitante: 40 },
  { rotulo: 'Escanteios', mandante: '6,1', visitante: '4,3', pesoMandante: 59, pesoVisitante: 41 },
];

export const formaRecenteMandante: ResultadoRecente[] = ['V', 'V', 'E', 'D', 'V'];

export const comparacaoTimes: EstatisticaComparada[] = [
  {
    rotulo: 'Gols por jogo',
    mandante: '1,8',
    visitante: '1,4',
    pesoMandante: 56,
    pesoVisitante: 44,
  },
  { rotulo: 'Forma (0–100)', mandante: '78', visitante: '54', pesoMandante: 59, pesoVisitante: 41 },
];

export const retrospecto = [{ vitorias: 18, empates: 11, derrotas: 14 }];

export const confrontosRecentes: { resultado: ResultadoRecente; placar: string; data: string }[] = [
  { resultado: 'V', placar: '2 x 0', data: 'mai/25' },
  { resultado: 'E', placar: '1 x 1', data: 'fev/25' },
  { resultado: 'D', placar: '0 x 2', data: 'out/24' },
  { resultado: 'V', placar: '3 x 1', data: 'jul/24' },
];

export const eventosAoVivo: EventoPartida[] = [
  { minuto: 28, tipo: 'gol', descricao: 'Gol · Vinícius Jr' },
  { minuto: 21, tipo: 'cartao-amarelo', descricao: 'Amarelo · Ruiz' },
  { minuto: 14, tipo: 'substituicao', descricao: 'Substituição · Betis' },
  { minuto: 1, tipo: 'inicio', descricao: 'Início da partida' },
];
