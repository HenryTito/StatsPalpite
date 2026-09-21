import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../core/theme';
import { Icon, Screen, SectionTitle, StatTile } from '../../core/ui';
import { perfilUsuario, posicaoDoUsuario } from '../../infrastructure/fixtures/ranking';

/** Acima deste percentual a barra do grafico usa o acento cheio. */
const LIMIAR_DESTAQUE = 70;

export function PerfilScreen() {
  return (
    <Screen
      header={
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{perfilUsuario.iniciais}</Text>
            </View>
            <View>
              <Text style={styles.username}>{perfilUsuario.usuario}</Text>
              <Text style={styles.subtitle}>
                #{posicaoDoUsuario.posicao} · {posicaoDoUsuario.pontos} pts
              </Text>
            </View>
          </View>
          <Icon name="settings" size={22} color={colors.ink} />
        </View>
      }
      contentStyle={styles.content}
    >
      <View style={styles.tiles}>
        <StatTile label="Taxa de acerto" value={perfilUsuario.taxaAcerto} size="lg" />
        <StatTile label="Palpites" value={perfilUsuario.palpites} size="lg" />
        <StatTile label="Sequência" value={perfilUsuario.sequencia} size="lg" />
      </View>

      <SectionTitle style={styles.section}>Últimos 7 dias</SectionTitle>
      <View style={styles.chart}>
        {perfilUsuario.ultimosSeteDias.map((altura, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${altura}%`,
                backgroundColor: altura > LIMIAR_DESTAQUE ? colors.accStrong : colors.accBg,
              },
            ]}
          />
        ))}
      </View>

      <SectionTitle style={styles.section}>Conquistas</SectionTitle>
      <View style={styles.achievements}>
        <View style={[styles.achievement, { backgroundColor: colors.warnBg }]}>
          <Icon name="flame" size={24} color={colors.warn} />
        </View>
        <View style={[styles.achievement, { backgroundColor: colors.accBg }]}>
          <Icon name="target" size={24} color={colors.acc} />
        </View>
        {[0, 1].map((index) => (
          <View key={index} style={[styles.achievement, { backgroundColor: colors.sur2 }]}>
            <Icon name="lock" size={22} color={colors.bd2} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 76,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.acc, fontWeight: '600', fontSize: 14 },
  username: { fontSize: 16, fontWeight: '600', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  content: { gap: 14, paddingBottom: spacing.xxxl },
  tiles: { flexDirection: 'row', gap: 10 },
  section: { marginTop: 6 },
  chart: {
    height: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 2,
  },
  bar: { flex: 1, borderRadius: 6 },
  achievements: { flexDirection: 'row', gap: spacing.md },
  achievement: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
