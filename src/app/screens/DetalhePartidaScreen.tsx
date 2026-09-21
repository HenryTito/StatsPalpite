import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import {
  BottomBar,
  Button,
  ComparisonRow,
  Icon,
  Screen,
  SectionTitle,
  StatTile,
  TopBar,
} from '../../core/ui';
import {
  detalheResumo,
  estatisticasMedias,
  formaRecenteMandante,
} from '../../infrastructure/fixtures/partidas';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalhePartida'>;

/** Cores do selo de forma recente por resultado. */
const formaTone = {
  V: { background: colors.accBg, color: colors.acc },
  E: { background: colors.sur2, color: colors.ink2 },
  D: { background: colors.danBg, color: colors.dan },
} as const;

export function DetalhePartidaScreen({ navigation }: Props) {
  return (
    <Screen
      header={
        <TopBar
          title="Palmeiras x Santos"
          back="arrow"
          onBack={() => navigation.goBack()}
          right={<Icon name="star" size={22} color={colors.warn} fill={colors.warn} />}
        />
      }
      contentStyle={styles.content}
      footer={
        <BottomBar>
          <Button label="Fazer palpite" onPress={() => navigation.navigate('RegistrarPalpite')} />
        </BottomBar>
      }
    >
      <View style={styles.tiles}>
        {detalheResumo.map((item) => (
          <StatTile key={item.rotulo} label={item.rotulo} value={item.valor} />
        ))}
      </View>

      <View style={styles.alert}>
        <Text style={styles.alertText}>2 desfalques confirmados no Santos</Text>
      </View>

      <SectionTitle style={styles.section}>Estatísticas médias</SectionTitle>
      {estatisticasMedias.map((estatistica) => (
        <ComparisonRow
          key={estatistica.rotulo}
          home={estatistica.mandante}
          label={estatistica.rotulo}
          away={estatistica.visitante}
          leftWidth={estatistica.pesoMandante}
          rightWidth={estatistica.pesoVisitante}
        />
      ))}

      <SectionTitle style={styles.section}>Forma recente</SectionTitle>
      <View style={styles.formRow}>
        <Text style={styles.formTeam}>Palmeiras</Text>
        {formaRecenteMandante.map((resultado, index) => (
          <View
            key={`${resultado}-${index}`}
            style={[styles.formChip, { backgroundColor: formaTone[resultado].background }]}
          >
            <Text style={[styles.formText, { color: formaTone[resultado].color }]}>
              {resultado}
            </Text>
          </View>
        ))}
      </View>

      <Button
        label="Comparar times"
        variant="secondary"
        height={40}
        onPress={() => navigation.navigate('CompararTimes')}
        style={styles.compare}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  tiles: { flexDirection: 'row', gap: 10 },
  alert: { backgroundColor: colors.warnBg, borderRadius: radius.lg, padding: spacing.md },
  alertText: { fontSize: 13, color: colors.warn, fontWeight: '600' },
  section: { marginTop: 4 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formTeam: { width: 72, fontSize: 13, color: colors.ink2 },
  formChip: {
    width: 26,
    borderRadius: radius.md,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formText: { fontSize: 12, fontWeight: '600' },
  compare: { marginTop: 4 },
});
