import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import { ComparisonRow, Icon, Screen, SectionTitle, TopBar } from '../../core/ui';
import {
  comparacaoTimes,
  confrontosRecentes,
  retrospecto,
} from '../../infrastructure/fixtures/partidas';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CompararTimes'>;

/** Cor do marcador de cada confronto recente. */
const marcadorPorResultado = {
  V: colors.acc,
  E: colors.bd2,
  D: colors.dan,
} as const;

function TeamSelect({ nome }: { nome: string }) {
  return (
    <View style={styles.select}>
      <Text style={styles.selectLabel}>{nome}</Text>
      <Icon name="chevron-down" size={16} color={colors.ink3} strokeWidth={2} />
    </View>
  );
}

export function CompararTimesScreen({ navigation, route }: Props) {
  const mandante = route.params?.mandante ?? 'Palmeiras';
  const visitante = route.params?.visitante ?? 'Santos';
  const totais = retrospecto[0]!;

  return (
    <Screen
      header={<TopBar title="Comparar times" back="arrow" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <View style={styles.selectors}>
        <TeamSelect nome={mandante} />
        <Text style={styles.versus}>x</Text>
        <TeamSelect nome={visitante} />
      </View>

      <View style={styles.record}>
        {[
          { valor: totais.vitorias, rotulo: 'Vitórias' },
          { valor: totais.empates, rotulo: 'Empates' },
          { valor: totais.derrotas, rotulo: 'Derrotas' },
        ].map((item) => (
          <View key={item.rotulo} style={styles.recordItem}>
            <Text style={styles.recordValue}>{item.valor}</Text>
            <Text style={styles.recordLabel}>{item.rotulo}</Text>
          </View>
        ))}
      </View>

      {comparacaoTimes.map((estatistica) => (
        <ComparisonRow
          key={estatistica.rotulo}
          home={estatistica.mandante}
          label={estatistica.rotulo}
          away={estatistica.visitante}
          leftWidth={estatistica.pesoMandante}
          rightWidth={estatistica.pesoVisitante}
        />
      ))}

      <SectionTitle style={styles.section}>Confrontos recentes</SectionTitle>
      {confrontosRecentes.map((confronto) => (
        <View key={confronto.data} style={styles.matchRow}>
          <View
            style={[styles.marker, { backgroundColor: marcadorPorResultado[confronto.resultado] }]}
          />
          <Text style={styles.score}>{confronto.placar}</Text>
          <Text style={styles.date}>{confronto.data}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  selectors: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  select: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: colors.sur2,
  },
  selectLabel: { fontSize: 13, color: colors.ink },
  versus: { fontSize: 12, color: colors.ink3 },
  record: {
    backgroundColor: colors.sur2,
    borderRadius: 14,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordItem: { alignItems: 'center' },
  recordValue: { fontSize: 20, fontWeight: '600', color: colors.ink },
  recordLabel: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  section: { marginTop: 4 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: spacing.sm },
  marker: { width: 10, height: 10, borderRadius: 5 },
  score: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  date: { fontSize: 12, color: colors.ink3 },
});
