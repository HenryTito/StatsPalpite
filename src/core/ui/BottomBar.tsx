import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';

/** Rodape fixo com separador, onde ficam as acoes primarias das telas. */
export function BottomBar({ children, row = false }: { children: ReactNode; row?: boolean }) {
  return <View style={[styles.bar, row && styles.row]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.sur,
    borderTopWidth: 1,
    borderTopColor: colors.bd,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
});
