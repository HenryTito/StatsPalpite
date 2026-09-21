/** Situacao de uma partida na listagem. */
export type StatusPartida = 'agendada' | 'ao-vivo' | 'encerrada';

export type Partida = {
  id: string;
  liga: string;
  mandante: string;
  visitante: string;
  status: StatusPartida;
  /** Horario formatado para exibicao ("16:00", "em 2h 14min"). */
  horario: string;
  /** Minuto corrente, apenas para partidas ao vivo. */
  minuto?: number;
  placar?: { mandante: number; visitante: number };
  /** Probabilidade de vitoria de cada lado, em pontos percentuais. */
  probabilidade?: { mandante: number; visitante: number };
  /** Indice de confianca do modelo, em pontos percentuais. */
  confianca?: number;
};

export type EstatisticaComparada = {
  rotulo: string;
  mandante: string;
  visitante: string;
  /** Participacao de cada lado na barra, em pontos percentuais. */
  pesoMandante: number;
  pesoVisitante: number;
};

export type ResultadoRecente = 'V' | 'E' | 'D';

export type EventoPartida = {
  minuto: number;
  tipo: 'gol' | 'cartao-amarelo' | 'substituicao' | 'inicio';
  descricao: string;
};
