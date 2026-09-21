import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import {
  Badge,
  BottomBar,
  Button,
  Card,
  Icon,
  IconName,
  Screen,
  SectionTitle,
  SelectField,
  TopBar,
} from '../../core/ui';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PainelAdmin'>;

const entidades: { icone: IconName; rotulo: string; total: string }[] = [
  { icone: 'trophy-cup', rotulo: 'Ligas', total: '12' },
  { icone: 'shield', rotulo: 'Times', total: '248' },
  { icone: 'calendar', rotulo: 'Partidas', total: '1.324' },
];

/** Quantidade de palpites afetados pela correcao de resultado. */
const PALPITES_AFETADOS = 312;

function LinhaEntidade({
  icone,
  rotulo,
  total,
}: {
  icone: IconName;
  rotulo: string;
  total?: string;
}) {
  return (
    <Card style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icone} size={20} color={colors.ink2} />
        <Text style={styles.rowLabel}>{rotulo}</Text>
      </View>
      <View style={styles.rowRight}>
        {total ? <Text style={styles.rowTotal}>{total}</Text> : null}
        <Icon name="chevron-right" size={18} color={colors.bd2} strokeWidth={2} />
      </View>
    </Card>
  );
}

export function PainelAdminScreen({ navigation }: Props) {
  const [golsMandante, setGolsMandante] = useState('2');
  const [golsVisitante, setGolsVisitante] = useState('1');

  return (
    <Screen
      header={
        <TopBar
          title="Administração"
          variant="large"
          back="arrow"
          onBack={() => navigation.goBack()}
          right={<Badge label="admin" tone="admin" />}
        />
      }
      contentStyle={styles.content}
      footer={
        <BottomBar>
          <Button
            label="Salvar e recalcular"
            variant="danger"
            onPress={() => navigation.goBack()}
          />
        </BottomBar>
      }
    >
      {entidades.map((entidade) => (
        <LinhaEntidade
          key={entidade.rotulo}
          icone={entidade.icone}
          rotulo={entidade.rotulo}
          total={entidade.total}
        />
      ))}
      <LinhaEntidade icone="list" rotulo="Log de auditoria" />

      <SectionTitle style={styles.section}>Corrigir resultado</SectionTitle>
      <SelectField
        placeholder="Buscar partida encerrada"
        right={<Icon name="search" size={18} color={colors.ink3} />}
      />

      <Card>
        <Text style={styles.matchTitle}>Flamengo x Vasco</Text>
        <View style={styles.scoreRow}>
          <TextInput
            style={styles.scoreInput}
            value={golsMandante}
            onChangeText={setGolsMandante}
            keyboardType="numeric"
            maxLength={2}
            accessibilityLabel="Gols do Flamengo"
          />
          <Text style={styles.versus}>x</Text>
          <TextInput
            style={styles.scoreInput}
            value={golsVisitante}
            onChangeText={setGolsVisitante}
            keyboardType="numeric"
            maxLength={2}
            accessibilityLabel="Gols do Vasco"
          />
        </View>
      </Card>

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          Esta ação recalcula a pontuação de {PALPITES_AFETADOS} palpites.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTotal: { fontSize: 12, color: colors.ink3 },
  section: { marginTop: spacing.sm },
  matchTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 10 },
  scoreInput: {
    width: 56,
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    backgroundColor: colors.sur2,
  },
  versus: { fontSize: 12, color: colors.ink3 },
  warning: { backgroundColor: colors.danBg, borderRadius: radius.lg, padding: spacing.md },
  warningText: { fontSize: 13, color: colors.dan },
});
