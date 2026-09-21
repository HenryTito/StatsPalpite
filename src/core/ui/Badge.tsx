import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

export type BadgeTone = 'accent' | 'warn' | 'danger' | 'neutral' | 'admin';

type Props = {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
};

/** Selo tonal usado em cards e cabecalhos (status, pontos, papel). */
export function Badge({ label, tone = 'accent', style }: Props) {
  return (
    <View style={[styles.badge, toneStyles[tone].container, style]}>
      <Text style={[styles.label, toneStyles[tone].label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  label: { fontSize: 12, fontWeight: '600' },
});

const toneStyles: Record<BadgeTone, { container: ViewStyle; label: { color: string } }> = {
  accent: { container: { backgroundColor: colors.accBg }, label: { color: colors.acc } },
  warn: { container: { backgroundColor: colors.warnBg }, label: { color: colors.warn } },
  danger: { container: { backgroundColor: colors.danBg }, label: { color: colors.dan } },
  neutral: { container: { backgroundColor: colors.sur2 }, label: { color: colors.ink2 } },
  admin: { container: { backgroundColor: colors.adminBg }, label: { color: colors.admin } },
};
