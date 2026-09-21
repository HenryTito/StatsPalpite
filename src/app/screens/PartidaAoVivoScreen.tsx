import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import { BottomBar, Icon, IconName, Screen, SectionTitle } from '../../core/ui';
import { eventosAoVivo } from '../../infrastructure/fixtures/partidas';
import type { EventoPartida } from '../../modules/partidas/domain/Partida';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PartidaAoVivo'>;

/** Icone e cor de cada tipo de evento da timeline. */
const aparenciaEvento: Record<
  EventoPartida['tipo'],
  { icone: IconName; cor: string; preenchido?: boolean }
> = {
  gol: { icone: 'ball', cor: colors.acc },
  'cartao-amarelo': { icone: 'card', cor: colors.warn, preenchido: true },
  substituicao: { icone: 'substitution', cor: colors.ink2 },
  inicio: { icone: 'play', cor: colors.ink2 },
};

export function PartidaAoVivoScreen({ navigation }: Props) {
  return (
    <Screen
      header={
        <>
          <View style={styles.liveStrip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Ao vivo · 34&apos;</Text>
          </View>
          <View style={styles.scoreboard}>
            <Text style={styles.matchup}>Real Madrid x Betis</Text>
            <Text style={styles.score}>1 — 0</Text>
          </View>
        </>
      }
      contentStyle={styles.content}
      footer={
        <BottomBar>
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'MeusPalpites' })}
            accessibilityRole="button"
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>Seu palpite está ganhando</Text>
            <Text style={styles.bannerDetail}>Real Madrid · 6 pts → 12 pts</Text>
          </Pressable>
        </BottomBar>
      }
    >
      <SectionTitle>Eventos</SectionTitle>
      {eventosAoVivo.map((evento) => {
        const aparencia = aparenciaEvento[evento.tipo];
        return (
          <View key={`${evento.minuto}-${evento.tipo}`} style={styles.eventRow}>
            <Text style={styles.minute}>{evento.minuto}&apos;</Text>
            <Icon
              name={aparencia.icone}
              size={20}
              color={aparencia.cor}
              fill={aparencia.preenchido ? aparencia.cor : 'none'}
            />
            <Text style={styles.eventLabel}>{evento.descricao}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  liveStrip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.danBg,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dan },
  liveText: { color: colors.dan, fontSize: 13, fontWeight: '600' },
  scoreboard: {
    paddingVertical: 28,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
    alignItems: 'center',
  },
  matchup: { fontSize: 14, color: colors.ink2 },
  score: {
    fontSize: 44,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 10,
    letterSpacing: -0.88,
  },
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  minute: { fontSize: 12, color: colors.ink3, width: 32 },
  eventLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  banner: { backgroundColor: colors.accBg, borderRadius: radius.lg, padding: 14 },
  bannerTitle: { fontSize: 13, color: colors.acc, fontWeight: '600' },
  bannerDetail: { fontSize: 13, color: colors.acc, marginTop: 4 },
});
