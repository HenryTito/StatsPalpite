export type Jogador = {
  posicao: number;
  usuario: string;
  /** Pontuacao ja formatada com separador de milhar. */
  pontos: string;
};

export type PosicaoUsuario = {
  posicao: number;
  pontos: number;
  /** Pontos que faltam para subir uma posicao. */
  paraSubir: number;
};
