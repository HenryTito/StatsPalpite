import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import { AsyncBoundary, Badge, Card, Screen, SectionTitle, StatTile, TopBar } from '../../core/ui';
import { digestRepository } from '../../infrastructure/repositories/apiRepositories';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BoletimRodada'>;

export function BoletimRodadaScreen({ navigation }: Props) {
  const { t, formatDate } = useI18n();
  const { data, loading, error, reload } = useAsync(() => digestRepository.previousRound(), []);

  return (
    <Screen
      header={
        <TopBar title={t('digest.previousRound')} back="arrow" onBack={() => navigation.goBack()} />
      }
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={loading} error={error} hasData={data !== null} onRetry={reload}>
        {data ? (
          <>
            <View style={styles.tiles}>
              <StatTile label={t('digest.results')} value={String(data.totals.matches)} size="lg" />
              <StatTile
                label="Palpites apurados"
                value={String(data.totals.predictionsSettled)}
                size="lg"
              />
            </View>

            <SectionTitle style={styles.section}>{t('digest.topPredictions')}</SectionTitle>
            {data.topPredictions.length === 0 ? (
              <Text style={styles.empty}>{t('common.empty')}</Text>
            ) : (
              data.topPredictions.map((item, index) => (
                <Card key={`${item.username}-${index}`}>
                  <View style={styles.row}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Badge label={`+${item.pointsAwarded} pts`} />
                  </View>
                  <Text style={styles.match}>{item.match}</Text>
                </Card>
              ))
            )}

            <SectionTitle style={styles.section}>{t('digest.biggestMisses')}</SectionTitle>
            {data.biggestMisses.length === 0 ? (
              <Text style={styles.empty}>{t('common.empty')}</Text>
            ) : (
              data.biggestMisses.map((item, index) => (
                <Card key={`${item.username}-miss-${index}`}>
                  <View style={styles.row}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Badge label={`${item.stake} pts perdidos`} tone="danger" />
                  </View>
                  <Text style={styles.match}>{item.match}</Text>
                </Card>
              ))
            )}

            <SectionTitle style={styles.section}>{t('digest.results')}</SectionTitle>
            {data.results.map((result) => (
              <View key={result.id} style={styles.result}>
                <Text style={styles.resultTeams} numberOfLines={1}>
                  {result.homeTeam} {result.score.home} x {result.score.away} {result.awayTeam}
                </Text>
                <Text style={styles.resultDate}>{formatDate(result.kickoffAt)}</Text>
              </View>
            ))}
          </>
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  tiles: { flexDirection: 'row', gap: 10 },
  section: { marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '600', color: colors.ink },
  match: { fontSize: 13, color: colors.ink2, marginTop: 4 },
  empty: { fontSize: 13, color: colors.ink3 },
  result: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
    gap: spacing.md,
  },
  resultTeams: { flex: 1, fontSize: 13, color: colors.ink },
  resultDate: { fontSize: 12, color: colors.ink3 },
});
