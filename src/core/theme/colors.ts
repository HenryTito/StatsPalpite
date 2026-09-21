/**
 * Tokens de cor do design StatsPalpite (tema dark).
 * Espelham as CSS custom properties do protótipo Figma.
 */
export const colors = {
  /** Fundo da aplicacao, fora da superficie das telas. */
  bg: '#0B0F11',
  /** Superficie primaria das telas. */
  sur: '#161C20',
  /** Superficie elevada: cards, inputs, chips. */
  sur2: '#1E262B',

  /** Texto primario. */
  ink: '#E9EEF1',
  /** Texto secundario. */
  ink2: '#9AA8AF',
  /** Texto terciario e icones inativos. */
  ink3: '#6B7A82',

  /** Cor de acento (azul). */
  acc: '#4A9EEA',
  /** Acento em estado pressionado. */
  accStrong: '#2F7FD0',
  /** Fundo tonal do acento. */
  accBg: '#152A3E',
  /** Borda tonal do acento. */
  accLine: '#2C557F',

  /** Aviso. */
  warn: '#E0A54A',
  warnBg: '#332915',

  /** Erro / perigo. */
  dan: '#E87A72',
  danBg: '#341D1B',
  /** Acao destrutiva preenchida (botao "Salvar e recalcular"). */
  danStrong: '#A8433C',

  /** Selo de papel administrativo. */
  admin: '#A99BE8',
  adminBg: '#241F3D',

  /** Texto sobre superficies preenchidas de acento. */
  onAcc: '#FFFFFF',

  /** Borda padrao. */
  bd: '#2A343A',
  /** Borda de maior contraste. */
  bd2: '#3C484F',
} as const;

export type ColorToken = keyof typeof colors;
