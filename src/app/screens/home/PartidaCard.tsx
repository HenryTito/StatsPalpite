import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../core/theme';
import { Badge, Card, SplitBar } from '../../../core/ui';
import type { Partida } from '../../../modules/partidas/domain/Partida';

/** Card de partida da Home e da tela offline. */
export function PartidaCard({ partida, onPress }: { partida: Partida; onPress?: () => void }) {
  const aoVivo = partida.status === 'ao-vivo';

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.meta}>{partida.liga}</Text>
        {aoVivo ? (
          <Badge label={`Ao vivo ${partida.horario}`} tone="danger" />
        ) : (
          <Text style={styles.meta}>{partida.horario}</Text>
        )}
      </View>

      <View style={styles.teamRow}>
        <Text style={styles.team}>{partida.mandante}</Text>
        <Text style={aoVivo ? styles.score : styles.probability}>
          {aoVivo ? partida.placar?.mandante : `${partida.probabilidade?.mandante}%`}
        </Text>
      </View>
      <View style={styles.teamRowTight}>
        <Text style={styles.team}>{partida.visitante}</Text>
        <Text style={aoVivo ? styles.score : styles.probability}>
          {aoVivo ? partida.placar?.visitante : `${partida.probabilidade?.visitante}%`}
        </Text>
      </View>

      {partida.confianca !== undefined && partida.probabilidade ? (
        <>
          <View style={styles.bar}>
            <SplitBar
              left={partida.probabilidade.mandante}
              right={100 - partida.probabilidade.mandante - partida.probabilidade.visitante}
            />
          </View>
          <Badge label={`Confiança ${partida.confianca}%`} style={styles.badge} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 12, color: colors.ink3 },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  teamRowTight: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  team: { fontSize: 14, fontWeight: '600', color: colors.ink },
  probability: { fontSize: 14, fontWeight: '600', color: colors.ink2 },
  score: { fontSize: 14, fontWeight: '600', color: colors.ink },
  bar: { marginTop: spacing.md },
  badge: { marginTop: 10 },
});
