import { StyleSheet, Text, TextStyle } from 'react-native';

import { colors } from '../theme';

/** Titulo de secao de 14pt usado dentro do corpo das telas. */
export function SectionTitle({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

/** Rotulo de 13pt que antecede grupos de controles. */
export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '600', color: colors.ink },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
});
