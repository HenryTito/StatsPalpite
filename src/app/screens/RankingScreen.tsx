import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../core/theme';
import { Screen, TopBar } from '../../core/ui';
import { posicaoDoUsuario, rankingGlobal } from '../../infrastructure/fixtures/ranking';

export function RankingScreen() {
  return (
    <Screen
      header={
        <>
          <TopBar title="Ranking global" variant="large" />
          <View style={styles.highlight}>
            <View>
              <Text style={styles.highlightLabel}>Sua posição</Text>
              <Text style={styles.highlightValue}>#{posicaoDoUsuario.posicao}</Text>
            </View>
            <View style={styles.highlightRight}>
              <Text style={styles.highlightPoints}>{posicaoDoUsuario.pontos} pts</Text>
              <Text style={styles.highlightHint}>+{posicaoDoUsuario.paraSubir} para subir</Text>
            </View>
          </View>
        </>
      }
      contentStyle={styles.content}
    >
      {rankingGlobal.map((jogador, index) => (
        <View
          key={jogador.posicao}
          style={[styles.row, index < rankingGlobal.length - 1 && styles.rowDivider]}
        >
          <Text style={[styles.position, jogador.posicao === 1 && styles.positionLeader]}>
            {jogador.posicao}
          </Text>
          <View style={styles.avatar} />
          <Text style={styles.name}>{jogador.usuario}</Text>
          <Text style={styles.points}>{jogador.pontos}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  highlight: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightLabel: { fontSize: 12, color: colors.acc, fontWeight: '600' },
  highlightValue: { fontSize: 26, fontWeight: '600', color: colors.acc, marginTop: 2 },
  highlightRight: { alignItems: 'flex-end' },
  highlightPoints: { fontSize: 14, fontWeight: '600', color: colors.acc },
  highlightHint: { fontSize: 12, color: colors.acc, marginTop: 4 },
  content: {
    paddingVertical: 4,
    paddingHorizontal: spacing.xl,
    gap: 0,
    paddingBottom: spacing.xxxl,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.bd },
  position: { width: 22, fontSize: 14, fontWeight: '600', color: colors.ink2 },
  positionLeader: { color: colors.warn },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sur2 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  points: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
