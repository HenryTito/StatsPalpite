import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PartidaCard } from './home/PartidaCard';
import { toPartida } from './home/toPartida';
import { ApiError } from '../../core/api/ApiError';
import type { MatchSummary } from '../../core/api/types';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import { AsyncBoundary, Chip, Icon, Screen, TopBar } from '../../core/ui';
import { matchRepository } from '../../infrastructure/repositories/apiRepositories';
import {
  configureNotifications,
  scheduleKickoffReminder,
} from '../../modules/notifications/matchNotifications';
import { useForegroundSync } from '../../modules/sync/useForegroundSync';
import type { RootStackParamList } from '../navigation/types';

const FILTROS = ['all', 'brasileirao', 'filters'] as const;
type Filtro = (typeof FILTROS)[number];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, formatTime } = useI18n();

  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('all');

  const carregar = useCallback(async () => {
    try {
      const response = await matchRepository.list();
      setMatches(response.matches);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : ApiError.offline());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // RF48: sincroniza a cada 5 min enquanto o app está em primeiro plano.
  const { lastSyncedAt } = useForegroundSync(carregar);

  /**
   * RF43: agenda o aviso de 5 minutos para as partidas que ainda vão começar.
   * Pedimos a permissão uma vez; negada, o app segue sem notificar.
   */
  useEffect(() => {
    if (matches.length === 0) return;

    let cancelled = false;
    (async () => {
      const allowed = await configureNotifications().catch(() => false);
      if (!allowed || cancelled) return;

      await Promise.all(
        matches
          .filter((match) => match.status === 'scheduled')
          .map((match) =>
            scheduleKickoffReminder({
              id: match.id,
              kickoffAt: match.kickoffAt,
              homeTeam: match.homeTeam?.name ?? '',
              awayTeam: match.awayTeam?.name ?? '',
            }).catch(() => null),
          ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [matches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  const visiveis = useMemo(() => {
    if (filtro !== 'brasileirao') return matches;
    return matches.filter((match) => match.league?.name?.toLowerCase().includes('brasileir'));
  }, [matches, filtro]);

  const abrir = (match: MatchSummary) =>
    match.status === 'live'
      ? navigation.navigate('PartidaAoVivo', { partidaId: match.id })
      : navigation.navigate('DetalhePartida', { partidaId: match.id });

  return (
    <Screen
      header={
        <TopBar
          title={t('home.title')}
          variant="large"
          right={
            <View style={styles.actions}>
              <Pressable
                onPress={() => navigation.navigate('Busca')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('search.title')}
              >
                <Icon name="search" size={22} color={colors.ink} />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('ResumoDiario')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('digest.title')}
              >
                <Icon name="bell" size={22} color={colors.ink} />
              </Pressable>
            </View>
          }
        />
      }
      scroll={false}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading}
        error={error}
        hasData={matches.length > 0}
        onRetry={carregar}
        isEmpty={!loading && matches.length === 0}
        emptyMessage={t('common.empty')}
      >
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.acc} />
          }
        >
          <View style={styles.filters}>
            {FILTROS.map((item) => (
              <Chip
                key={item}
                label={
                  item === 'all'
                    ? t('home.all')
                    : item === 'filters'
                      ? t('home.filters')
                      : 'Brasileirão'
                }
                selected={item === filtro}
                onPress={() =>
                  item === 'filters' ? navigation.navigate('Filtros') : setFiltro(item)
                }
              />
            ))}
          </View>

          {visiveis.some((match) => match.stale) ? (
            <Text style={styles.stale}>{t('home.staleWarning')}</Text>
          ) : null}

          {visiveis.map((match) => (
            <PartidaCard
              key={match.id}
              partida={toPartida(match, { t, formatTime })}
              onPress={() => abrir(match)}
            />
          ))}

          {lastSyncedAt ? (
            <Text style={styles.synced}>Atualizado às {formatTime(lastSyncedAt)}</Text>
          ) : null}
        </ScrollView>
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  list: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  filters: { flexDirection: 'row', gap: spacing.sm },
  stale: { fontSize: 12, color: colors.warn, fontWeight: '600' },
  synced: { fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: spacing.sm },
});
