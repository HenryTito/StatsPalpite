import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import { Badge, BottomBar, Card, Icon, Screen, TopBar } from '../../core/ui';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Offline'>;

/** Quantidade de acoes aguardando sincronizacao. */
const ACOES_NA_FILA = 1;

export function OfflineScreen({ navigation }: Props) {
  return (
    <Screen
      header={
        <>
          <View style={styles.strip}>
            <Icon name="alert" size={16} color={colors.warn} strokeWidth={1.8} />
            <Text style={styles.stripText}>Sem conexão · exibindo dados locais</Text>
          </View>
          <TopBar title="Partidas" variant="large" />
        </>
      }
      contentStyle={styles.content}
      footer={
        <BottomBar row>
          <Text style={styles.queue}>
            {ACOES_NA_FILA} {ACOES_NA_FILA === 1 ? 'ação na fila' : 'ações na fila'}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            accessibilityRole="button"
            style={styles.syncButton}
          >
            <Text style={styles.sync}>Sincronizar</Text>
          </Pressable>
        </BottomBar>
      }
    >
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.meta}>Brasileirão</Text>
          <Text style={styles.meta}>16:00</Text>
        </View>
        <Text style={styles.match}>Palmeiras x Santos</Text>
        <Badge label="Palpite pendente de envio" tone="neutral" style={styles.badge} />
      </Card>

      <Card style={styles.stale}>
        <View style={styles.cardHeader}>
          <Text style={styles.meta}>Premier League</Text>
          <Text style={styles.meta}>18:30</Text>
        </View>
        <Text style={styles.match}>Arsenal x Chelsea</Text>
        <Text style={styles.updated}>Atualizado há 3 dias</Text>
      </Card>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Dados com mais de 48 horas. Conecte-se para atualizar antes de palpitar.
        </Text>
      </View>

      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>Ranking indisponível offline</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.warnBg,
  },
  stripText: { color: colors.warn, fontSize: 13, fontWeight: '600' },
  content: { paddingBottom: spacing.xxxl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: colors.ink3 },
  match: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 10 },
  badge: { marginTop: 10 },
  stale: { opacity: 0.5 },
  updated: { fontSize: 12, color: colors.ink3, marginTop: 6 },
  notice: { backgroundColor: colors.warnBg, borderRadius: radius.lg, padding: 14 },
  noticeText: { fontSize: 13, color: colors.warn, lineHeight: 19.5 },
  unavailable: {
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sur2,
  },
  unavailableText: { fontSize: 15, fontWeight: '600', color: colors.ink3 },
  queue: { flex: 1, fontSize: 13, color: colors.ink2 },
  syncButton: { paddingVertical: 4 },
  sync: { fontSize: 13, fontWeight: '600', color: colors.acc },
});
