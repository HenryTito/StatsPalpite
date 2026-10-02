import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MatchDetail } from '../../core/api/types';
import { useAsync } from '../../core/hooks/useAsync';
import { useCountdown } from '../../core/hooks/useCountdown';
import { useI18n } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import {
  AsyncBoundary,
  BottomBar,
  Button,
  ComparisonPanel,
  Icon,
  Screen,
  SectionTitle,
  StatTile,
  TopBar,
  type ComparisonMetric,
} from '../../core/ui';
import { matchRepository } from '../../infrastructure/repositories/apiRepositories';
import { sharePredictionCard } from '../../modules/share/sharePrediction';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalhePartida'>;

/** Cores do selo de forma recente por resultado. */
const formaTone = {
  W: { background: colors.accBg, color: colors.acc },
  D: { background: colors.sur2, color: colors.ink2 },
  L: { background: colors.danBg, color: colors.dan },
} as const;

/** Monta as métricas do RF04 na ordem do design. */
function buildMetrics(detail: MatchDetail, t: (key: string) => string): ComparisonMetric[] {
  const stats = detail.statistics;
  if (!stats) return [];

  return [
    { label: t('matchDetail.possession'), home: stats.homePossession, away: stats.awayPossession },
    { label: t('matchDetail.shots'), home: stats.homeShots, away: stats.awayShots },
    {
      label: t('matchDetail.shotsOnTarget'),
      home: stats.homeShotsOnTarget,
      away: stats.awayShotsOnTarget,
    },
    // Menos faltas é melhor, então a barra inverte o peso.
    {
      label: t('matchDetail.fouls'),
      home: stats.homeFouls,
      away: stats.awayFouls,
      lowerIsBetter: true,
    },
    { label: t('matchDetail.corners'), home: stats.homeCorners, away: stats.awayCorners },
    {
      label: t('matchDetail.offsides'),
      home: stats.homeOffsides,
      away: stats.awayOffsides,
      lowerIsBetter: true,
    },
    {
      label: t('matchDetail.passAccuracy'),
      home: stats.homePassAccuracy,
      away: stats.awayPassAccuracy,
    },
  ];
}

export function DetalhePartidaScreen({ navigation, route }: Props) {
  const { t, formatTime, formatNumber } = useI18n();
  const matchId = route.params?.partidaId ?? '';
  const shareRef = useRef<View>(null);

  const { data, loading, error, reload } = useAsync(
    () => matchRepository.detail(matchId),
    [matchId],
  );
  const countdown = useCountdown(data?.kickoffAt ?? null);

  const title = data ? `${data.homeTeam?.name} x ${data.awayTeam?.name}` : t('common.loading');

  return (
    <Screen
      header={
        <TopBar
          title={title}
          back="arrow"
          onBack={() => navigation.goBack()}
          right={
            <Pressable
              onPress={() => sharePredictionCard(shareRef, { fileName: 'partida' })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('share.button')}
            >
              <Icon name="star" size={22} color={colors.warn} fill={colors.warn} />
            </Pressable>
          }
        />
      }
      contentStyle={styles.content}
      footer={
        <BottomBar>
          <Button
            label={t('matchDetail.makePrediction')}
            onPress={() => navigation.navigate('RegistrarPalpite', { partidaId: matchId })}
          />
        </BottomBar>
      }
    >
      <AsyncBoundary loading={loading} error={error} hasData={data !== null} onRetry={reload}>
        {data ? (
          <View ref={shareRef} collapsable={false} style={styles.shareArea}>
            <View style={styles.tiles}>
              <StatTile
                label={t('matchDetail.weather')}
                value={data.weather ? `${Math.round(data.weather.temperatureC)}°C` : '—'}
              />
              <StatTile
                label={t('matchDetail.kickoff')}
                value={
                  data.status === 'scheduled' && countdown && !countdown.started
                    ? countdown.label
                    : formatTime(data.kickoffAt)
                }
              />
              <StatTile label={t('matchDetail.venue')} value={data.venue?.name ?? '—'} />
            </View>

            {data.weather ? (
              <Text style={styles.weatherLine}>
                {data.weather.condition}
                {data.weather.humidity !== null ? ` · ${data.weather.humidity}% umidade` : ''}
                {data.weather.windKph !== null ? ` · ${data.weather.windKph} km/h` : ''}
              </Text>
            ) : null}

            {data.injuries.length > 0 ? (
              <View style={styles.alert}>
                <Text style={styles.alertText}>
                  {data.injuries.length} {t('matchDetail.injuries').toLowerCase()}
                </Text>
                {data.injuries.slice(0, 3).map((injury) => (
                  <Text key={injury.id} style={styles.alertDetail}>
                    {injury.player?.name} — {injury.reason}
                  </Text>
                ))}
              </View>
            ) : null}

            <SectionTitle style={styles.section}>{t('matchDetail.averageStats')}</SectionTitle>
            {data.statistics ? (
              <ComparisonPanel
                metrics={buildMetrics(data, t)}
                homeLabel={data.homeTeam?.name}
                awayLabel={data.awayTeam?.name}
              />
            ) : (
              <Text style={styles.muted}>{t('common.empty')}</Text>
            )}

            <SectionTitle style={styles.section}>{t('matchDetail.recentForm')}</SectionTitle>
            {(['home', 'away'] as const).map((side) => (
              <View key={side} style={styles.formRow}>
                <Text style={styles.formTeam} numberOfLines={1}>
                  {side === 'home' ? data.homeTeam?.name : data.awayTeam?.name}
                </Text>
                {data.form[side].map((resultado, index) => {
                  const tone = formaTone[resultado as keyof typeof formaTone] ?? formaTone.D;
                  return (
                    <View
                      key={`${side}-${index}`}
                      style={[styles.formChip, { backgroundColor: tone.background }]}
                    >
                      <Text style={[styles.formText, { color: tone.color }]}>{resultado}</Text>
                    </View>
                  );
                })}
              </View>
            ))}

            {data.referee ? (
              <>
                <SectionTitle style={styles.section}>{t('matchDetail.referee')}</SectionTitle>
                <View style={styles.referee}>
                  <Text style={styles.refereeName}>{data.referee.name}</Text>
                  <Text style={styles.refereeStats}>
                    {formatNumber(data.referee.matchesOfficiated)} jogos ·{' '}
                    {data.referee.averages.fouls ?? '—'} faltas ·{' '}
                    {data.referee.averages.yellowCards ?? '—'} amarelos
                  </Text>
                </View>
              </>
            ) : null}

            <Button
              label={t('matchDetail.compareTeams')}
              variant="secondary"
              height={40}
              onPress={() =>
                navigation.navigate('CompararTimes', {
                  mandante: data.homeTeam?.id,
                  visitante: data.awayTeam?.id,
                })
              }
              style={styles.compare}
            />
          </View>
        ) : null}
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  shareArea: { gap: spacing.md, backgroundColor: colors.sur },
  tiles: { flexDirection: 'row', gap: 10 },
  weatherLine: { fontSize: 12, color: colors.ink3 },
  alert: { backgroundColor: colors.warnBg, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  alertText: { fontSize: 13, color: colors.warn, fontWeight: '600' },
  alertDetail: { fontSize: 12, color: colors.warn },
  section: { marginTop: 4 },
  muted: { fontSize: 13, color: colors.ink3 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formTeam: { width: 90, fontSize: 13, color: colors.ink2 },
  formChip: {
    width: 26,
    borderRadius: radius.md,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formText: { fontSize: 12, fontWeight: '600' },
  referee: { backgroundColor: colors.sur2, borderRadius: radius.lg, padding: spacing.md },
  refereeName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  refereeStats: { fontSize: 12, color: colors.ink3, marginTop: 4 },
  compare: { marginTop: 4 },
});
