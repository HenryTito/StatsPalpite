import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
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
import { useMatchFilter } from '../../modules/partidas/FilterContext';
import { useForegroundSync } from '../../modules/sync/useForegroundSync';
import type { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, formatTime } = useI18n();

  const { filter, clearFilter, activeCount } = useMatchFilter();

  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * A filtragem acontece no servidor. O backend já indexa por data, liga,
   * time e situação; filtrar no app esconderia partidas que sequer chegaram
   * a ser buscadas, e a lista mudaria conforme a página carregada.
   */
  const carregar = useCallback(async () => {
    try {
      const response = await matchRepository.list({
        date: filter.date ?? undefined,
        leagueId: filter.leagueId ?? undefined,
        teamId: filter.teamId ?? undefined,
        status: filter.status ?? undefined,
      });
      setMatches(response.matches);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : ApiError.offline());
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
      <View style={styles.filters}>
        <Chip label={t('home.all')} selected={activeCount === 0} onPress={clearFilter} />
        {filter.leagueName ? (
          <Chip label={filter.leagueName} selected onPress={clearFilter} />
        ) : null}
        {filter.teamName ? <Chip label={filter.teamName} selected onPress={clearFilter} /> : null}
        {filter.date ? <Chip label={filter.date} selected onPress={clearFilter} /> : null}
        <Chip
          label={activeCount > 0 ? t('filters.active', { count: activeCount }) : t('home.filters')}
          selected={activeCount > 0}
          onPress={() => navigation.navigate('Filtros')}
        />
      </View>

      <AsyncBoundary
        loading={loading}
        error={error}
        hasData={matches.length > 0}
        onRetry={carregar}
        isEmpty={!loading && matches.length === 0}
        emptyMessage={activeCount > 0 ? t('filters.noResults') : t('common.empty')}
      >
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.acc} />
          }
        >
          {matches.some((match) => match.stale) ? (
            <Text style={styles.stale}>{t('home.staleWarning')}</Text>
          ) : null}

          {matches.map((match) => (
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
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stale: { fontSize: 12, color: colors.warn, fontWeight: '600' },
  synced: { fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: spacing.sm },
});
