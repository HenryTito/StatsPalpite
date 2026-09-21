import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  value: string;
  /** Telas de perfil usam 20pt no valor; a de detalhe, 16pt. */
  size?: 'md' | 'lg';
};

/** Tile de metrica sobre superficie elevada. */
export function StatTile({ label, value, size = 'md' }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, size === 'lg' && styles.valueLg]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.sur2, borderRadius: radius.lg, padding: spacing.md },
  label: { fontSize: 12, color: colors.ink3 },
  value: { fontSize: 16, fontWeight: '600', color: colors.ink, marginTop: 4 },
  valueLg: { fontSize: 20 },
});
