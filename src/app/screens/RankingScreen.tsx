import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import { AsyncBoundary, Screen, TopBar } from '../../core/ui';
import { rankingRepository } from '../../infrastructure/repositories/apiRepositories';
import { useSession } from '../../modules/auth/SessionContext';

export function RankingScreen() {
  const { t, formatNumber } = useI18n();
  const { user } = useSession();

  const { data, loading, error, reload } = useAsync(
    async () => ({
      ranking: await rankingRepository.list({ limit: 50 }),
      // A posição própria só existe para quem está autenticado.
      position: user ? await rankingRepository.myPosition().catch(() => null) : null,
    }),
    [user?.id],
  );

  return (
    <Screen
      header={
        <>
          <TopBar title={t('ranking.title')} variant="large" />
          {data?.position ? (
            <View style={styles.highlight}>
              <View>
                <Text style={styles.highlightLabel}>{t('ranking.yourPosition')}</Text>
                <Text style={styles.highlightValue}>#{data.position.position}</Text>
              </View>
              <View style={styles.highlightRight}>
                <Text style={styles.highlightPoints}>
                  {formatNumber(data.position.points)} {t('ranking.points')}
                </Text>
                {data.position.pointsToClimb > 0 ? (
                  <Text style={styles.highlightHint}>
                    {t('ranking.toClimb', { points: data.position.pointsToClimb })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </>
      }
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading}
        error={error}
        hasData={(data?.ranking.entries.length ?? 0) > 0}
        onRetry={reload}
      >
        {(data?.ranking.entries ?? []).map((entry, index, list) => (
          <View
            key={entry.userId}
            style={[styles.row, index < list.length - 1 && styles.rowDivider]}
          >
            <Text style={[styles.position, entry.position === 1 && styles.positionLeader]}>
              {entry.position}
            </Text>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{entry.username.slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={[styles.name, entry.userId === user?.id && styles.nameSelf]}>
              {entry.username}
            </Text>
            <Text style={styles.points}>{formatNumber(entry.points)}</Text>
          </View>
        ))}
      </AsyncBoundary>
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sur2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 12, fontWeight: '600', color: colors.ink2 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  nameSelf: { color: colors.acc },
  points: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
