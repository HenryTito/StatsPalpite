/** Resultado apontado pelo usuario. */
export type Escolha = 'mandante' | 'empate' | 'visitante';

export type StatusPalpite = 'aguardando' | 'acertou' | 'errou' | 'pendente-envio';

export type Palpite = {
  id: string;
  partida: string;
  /** Quando o palpite foi feito, ja formatado ("Hoje, 16:00", "Ontem"). */
  quando: string;
  escolhaRotulo: string;
  pontosApostados: number;
  status: StatusPalpite;
  /** Pontos creditados apos o encerramento. */
  pontosGanhos?: number;
  /** Placar final, quando a partida ja terminou. */
  placarFinal?: string;
};

/** Teto diario de pontos que o usuario pode apostar. */
export const ORCAMENTO_DIARIO = 30;
