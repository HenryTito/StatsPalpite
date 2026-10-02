import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { PartidaCard } from './home/PartidaCard';
import { toPartida } from './home/toPartida';
import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import {
  AsyncBoundary,
  Button,
  Screen,
  SectionTitle,
  SplitBar,
  StatTile,
  TopBar,
} from '../../core/ui';
import { digestRepository } from '../../infrastructure/repositories/apiRepositories';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResumoDiario'>;

export function ResumoDiarioScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(() => digestRepository.daily(), []);

  return (
    <Screen
      header={<TopBar title={t('digest.title')} back="close" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={loading} error={error} hasData={data !== null} onRetry={reload}>
        {data ? (
          <>
            <View style={styles.tiles}>
              <StatTile
                label={t('digest.matchesToday')}
                value={String(data.totals.matches)}
                size="lg"
              />
              <StatTile label={t('digest.liveNow')} value={String(data.totals.live)} size="lg" />
              <StatTile
                label={t('ranking.yourPosition')}
                value={data.ranking ? `#${data.ranking.position}` : '—'}
                size="lg"
              />
            </View>

            <SectionTitle style={styles.section}>{t('digest.highlights')}</SectionTitle>

            {data.highlights.map((highlight) => (
              <View key={highlight.id} style={styles.highlight}>
                <PartidaCard
                  partida={toPartida(highlight)}
                  onPress={() => navigation.navigate('DetalhePartida', { partidaId: highlight.id })}
                />

                {highlight.community?.percentages ? (
                  <View style={styles.community}>
                    <Text style={styles.communityTitle}>{t('digest.community')}</Text>
                    <View style={styles.communityLegend}>
                      <Text style={styles.communityValue}>
                        {highlight.community.percentages.home}%
                      </Text>
                      <Text style={styles.communityLabel}>
                        {highlight.community.total} palpites
                      </Text>
                      <Text style={styles.communityValue}>
                        {highlight.community.percentages.away}%
                      </Text>
                    </View>
                    <SplitBar
                      left={highlight.community.percentages.home}
                      right={highlight.community.percentages.away}
                    />
                  </View>
                ) : null}
              </View>
            ))}

            <Button
              label={t('digest.previousRound')}
              variant="secondary"
              height={44}
              onPress={() => navigation.navigate('BoletimRodada')}
              style={styles.bulletinButton}
            />
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
  highlight: { gap: spacing.sm },
  community: {
    backgroundColor: colors.sur2,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  communityTitle: { fontSize: 12, color: colors.ink3 },
  communityLegend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  communityValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
  communityLabel: { fontSize: 12, color: colors.ink2 },
  bulletinButton: { marginTop: spacing.sm },
});
