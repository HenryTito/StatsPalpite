import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../core/api/ApiError';
import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import {
  AsyncBoundary,
  ComparisonPanel,
  Screen,
  SectionTitle,
  TopBar,
  type ComparisonMetric,
} from '../../core/ui';
import { matchRepository } from '../../infrastructure/repositories/apiRepositories';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CompararTimes'>;

/** Cor do marcador de cada confronto, pela ótica do mandante consultado. */
function markerColor(homeGoals: number | null, awayGoals: number | null): string {
  if (homeGoals === null || awayGoals === null) return colors.bd2;
  if (homeGoals > awayGoals) return colors.acc;
  if (homeGoals < awayGoals) return colors.dan;
  return colors.bd2;
}

export function CompararTimesScreen({ navigation, route }: Props) {
  const { t, formatDate } = useI18n();
  const homeTeamId = route.params?.mandante ?? '';
  const awayTeamId = route.params?.visitante ?? '';

  const { data, loading, error, reload } = useAsync(
    () =>
      homeTeamId && awayTeamId
        ? matchRepository.compare(homeTeamId, awayTeamId)
        : Promise.reject(new ApiError('Selecione dois times', 400, 'MISSING_TEAMS')),
    [homeTeamId, awayTeamId],
  );

  const metrics: ComparisonMetric[] = data
    ? [
        {
          label: t('compare.goalsPerGame'),
          home: data.record.played ? (data.goals.for / data.record.played).toFixed(1) : '0',
          away: data.record.played ? (data.goals.against / data.record.played).toFixed(1) : '0',
        },
        {
          label: t('compare.formScore'),
          home: data.form.home.score,
          away: data.form.away.score,
        },
      ]
    : [];

  return (
    <Screen
      header={<TopBar title={t('compare.title')} back="arrow" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={loading} error={error} hasData={data !== null} onRetry={reload}>
        {data ? (
          <>
            <View style={styles.teams}>
              <Text style={styles.teamName} numberOfLines={1}>
                {data.homeTeam.name}
              </Text>
              <Text style={styles.versus}>x</Text>
              <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
                {data.awayTeam.name}
              </Text>
            </View>

            <View style={styles.record}>
              {[
                { valor: data.record.homeWins, rotulo: t('compare.wins') },
                { valor: data.record.draws, rotulo: t('compare.draws') },
                { valor: data.record.awayWins, rotulo: t('compare.losses') },
              ].map((item) => (
                <View key={item.rotulo} style={styles.recordItem}>
                  <Text style={styles.recordValue}>{item.valor}</Text>
                  <Text style={styles.recordLabel}>{item.rotulo}</Text>
                </View>
              ))}
            </View>

            <ComparisonPanel metrics={metrics} />

            <SectionTitle style={styles.section}>{t('compare.recentMatches')}</SectionTitle>
            {data.history.length === 0 ? (
              <Text style={styles.empty}>{t('common.empty')}</Text>
            ) : (
              data.history.slice(0, 10).map((confronto) => (
                <View key={confronto.id} style={styles.matchRow}>
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: markerColor(confronto.score.home, confronto.score.away) },
                    ]}
                  />
                  <Text style={styles.score}>
                    {confronto.score.home} x {confronto.score.away}
                  </Text>
                  <Text style={styles.teams2} numberOfLines={1}>
                    {confronto.homeTeam} x {confronto.awayTeam}
                  </Text>
                  <Text style={styles.date}>
                    {formatDate(confronto.kickoffAt, { month: 'short', year: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </>
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: spacing.xxxl },
  teams: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teamName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  teamNameRight: { textAlign: 'right' },
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
  empty: { fontSize: 13, color: colors.ink3 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  marker: { width: 10, height: 10, borderRadius: 5 },
  score: { fontSize: 14, fontWeight: '600', color: colors.ink, width: 48 },
  teams2: { flex: 1, fontSize: 12, color: colors.ink2 },
  date: { fontSize: 12, color: colors.ink3 },
});
