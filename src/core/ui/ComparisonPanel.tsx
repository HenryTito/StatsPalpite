import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { SplitBar } from './SplitBar';
import { colors, spacing } from '../theme';

/** Uma métrica comparada entre dois lados. */
export type ComparisonMetric = {
  label: string;
  home: string | number | null;
  away: string | number | null;
  /** Peso da barra. Quando ausente, é derivado dos valores numéricos. */
  homeWeight?: number;
  awayWeight?: number;
  /** Para métricas em que o menor é melhor, como faltas. */
  lowerIsBetter?: boolean;
};

type Props = {
  metrics: ComparisonMetric[];
  /** Cabeçalho opcional com o nome dos dois lados. */
  homeLabel?: string;
  awayLabel?: string;
  style?: ViewStyle;
};

const EM_DASH = '—';

/** Converte "54.30" ou 54.3 em número; devolve null para o que não for numérico. */
function toNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Remove zeros à direita que o DECIMAL do Postgres traz ("54.30" → "54.3"). */
function display(value: string | number | null): string {
  const parsed = toNumber(value);
  if (parsed === null) return EM_DASH;
  return String(Math.round(parsed * 10) / 10);
}

/**
 * Reparte 100% entre os dois lados conforme os valores.
 *
 * Quando os dois são zero, divide ao meio: uma barra vazia some da tela e o
 * usuário não distingue "empatado em zero" de "sem dado".
 */
function weights(metric: ComparisonMetric): { home: number; away: number } {
  if (metric.homeWeight !== undefined && metric.awayWeight !== undefined) {
    return { home: metric.homeWeight, away: metric.awayWeight };
  }

  const home = toNumber(metric.home);
  const away = toNumber(metric.away);
  if (home === null || away === null) return { home: 50, away: 50 };

  // Em métricas onde menos é melhor, inverte quem recebe a fatia maior.
  const homeValue = metric.lowerIsBetter ? away : home;
  const awayValue = metric.lowerIsBetter ? home : away;

  const total = homeValue + awayValue;
  if (total <= 0) return { home: 50, away: 50 };

  return {
    home: Math.round((homeValue / total) * 100),
    away: Math.round((awayValue / total) * 100),
  };
}

/**
 * Painel genérico de comparação lado a lado (B016).
 *
 * É usado pelo detalhe da partida (RF04), pelo comparador de times (RF37) e
 * pelo confronto histórico (RF06). Qualquer lista de métricas serve; ele não
 * sabe nada sobre futebol.
 */
export function ComparisonPanel({ metrics, homeLabel, awayLabel, style }: Props) {
  return (
    <View style={[styles.panel, style]}>
      {homeLabel || awayLabel ? (
        <View style={styles.header}>
          <Text style={styles.teamName} numberOfLines={1}>
            {homeLabel}
          </Text>
          <Text style={styles.versus}>x</Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
            {awayLabel}
          </Text>
        </View>
      ) : null}

      {metrics.map((metric) => {
        const bar = weights(metric);
        return (
          <View key={metric.label} style={styles.row}>
            <View style={styles.legend}>
              <Text style={styles.value}>{display(metric.home)}</Text>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{display(metric.away)}</Text>
            </View>
            <SplitBar left={bar.home} right={bar.away} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teamName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  teamNameRight: { textAlign: 'right' },
  versus: { fontSize: 12, color: colors.ink3 },
  row: { gap: 6 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontSize: 13, color: colors.ink, fontWeight: '500' },
  label: { fontSize: 13, color: colors.ink2 },
});
