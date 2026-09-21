import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  /** Fatia do mandante, em porcentagem. */
  left: number;
  /** Fatia do visitante, em porcentagem. O restante fica vazio. */
  right: number;
};

/** Barra de 6pt dividida em duas fatias, usada nas comparacoes de estatistica. */
export function SplitBar({ left, right }: Props) {
  return (
    <View style={styles.track}>
      <View style={[styles.fillLeft, { width: `${left}%` }]} />
      <View style={[styles.fillRight, { width: `${right}%` }]} />
    </View>
  );
}

/** Linha "valor · rotulo · valor" seguida da barra dividida. */
export function ComparisonRow({
  home,
  label,
  away,
  leftWidth,
  rightWidth,
}: {
  home: string;
  label: string;
  away: string;
  leftWidth: number;
  rightWidth: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.legend}>
        <Text style={styles.value}>{home}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{away}</Text>
      </View>
      <SplitBar left={leftWidth} right={rightWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sur2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fillLeft: { height: '100%', backgroundColor: colors.acc },
  fillRight: { height: '100%', backgroundColor: colors.bd2 },
  row: { gap: 6 },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { fontSize: 13, color: colors.ink },
  label: { fontSize: 13, color: colors.ink2 },
});
