import { TextStyle } from 'react-native';

import { colors } from './colors';

/**
 * O design usa Inter. Em RN o carregamento e feito por expo-font quando as
 * fontes forem embarcadas; ate la a familia do sistema mantem as metricas.
 */
export const fontFamily = undefined;

export const typography = {
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  heading: { fontSize: 16, fontWeight: '600', color: colors.ink },
  body: { fontSize: 14, fontWeight: '400', color: colors.ink },
  bodyStrong: { fontSize: 14, fontWeight: '600', color: colors.ink },
  label: { fontSize: 12, fontWeight: '500', color: colors.ink2 },
  caption: { fontSize: 11, fontWeight: '400', color: colors.ink3 },
  numeric: { fontSize: 18, fontWeight: '700', color: colors.ink },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
