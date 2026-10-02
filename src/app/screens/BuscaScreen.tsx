import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '../../core/api/ApiError';
import type { GlobalSearchResponse, PlayerResult } from '../../core/api/types';
import { useI18n } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import { AsyncBoundary, Badge, Card, Icon, Screen, TopBar } from '../../core/ui';
import { searchRepository } from '../../infrastructure/repositories/apiRepositories';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Busca'>;
type Aba = 'all' | 'players';

/** Espera o usuário parar de digitar antes de consultar a API. */
const DEBOUNCE_MS = 350;
const MIN_LENGTH = 2;

export function BuscaScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [termo, setTermo] = useState('');
  const [debounced, setDebounced] = useState('');
  const [aba, setAba] = useState<Aba>('all');

  const [global, setGlobal] = useState<GlobalSearchResponse | null>(null);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Sem o debounce, cada tecla viraria uma requisição.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(termo.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [termo]);

  const buscar = useCallback(async () => {
    if (debounced.length < MIN_LENGTH) {
      setGlobal(null);
      setPlayers([]);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      if (aba === 'players') {
        const response = await searchRepository.players(debounced);
        setPlayers(response.results);
      } else {
        setGlobal(await searchRepository.global(debounced));
      }
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : ApiError.offline());
    } finally {
      setLoading(false);
    }
  }, [debounced, aba]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const resultados = useMemo(() => global?.results ?? [], [global]);
  const vazio =
    debounced.length >= MIN_LENGTH &&
    !loading &&
    (aba === 'players' ? players.length === 0 : resultados.length === 0);

  const abrirResultado = (tipo: string, id: string) => {
    if (tipo === 'venue') navigation.navigate('MapaEstadios');
    if (tipo === 'team') navigation.navigate('CompararTimes', { mandante: id });
  };

  return (
    <Screen
      header={<TopBar title={t('search.title')} back="arrow" onBack={() => navigation.goBack()} />}
      scroll={false}
      contentStyle={styles.content}
    >
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.ink3} />
        <TextInput
          style={styles.input}
          value={termo}
          onChangeText={setTermo}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
        />
        {termo.length > 0 ? (
          <Pressable
            onPress={() => setTermo('')}
            hitSlop={8}
            accessibilityLabel={t('common.close')}
          >
            <Icon name="close" size={18} color={colors.ink3} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {(['all', 'players'] as Aba[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setAba(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected: item === aba }}
            style={[styles.tab, item === aba && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, item === aba && styles.tabLabelActive]}>
              {item === 'all' ? t('search.allTab') : t('search.playersTab')}
            </Text>
          </Pressable>
        ))}
      </View>

      {debounced.length < MIN_LENGTH ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>{t('search.minLength')}</Text>
        </View>
      ) : (
        <AsyncBoundary
          loading={loading}
          error={error}
          hasData={aba === 'players' ? players.length > 0 : resultados.length > 0}
          onRetry={buscar}
          isEmpty={vazio}
          emptyMessage={t('search.noResults', { query: debounced })}
        >
          {aba === 'players' ? (
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Card>
                  <View style={styles.playerHeader}>
                    <Text style={styles.playerName}>{item.name}</Text>
                    {item.position ? <Badge label={item.position} tone="neutral" /> : null}
                  </View>
                  {item.team ? (
                    <Text style={styles.playerTeam}>
                      {item.team.name}
                      {item.team.league ? ` · ${item.team.league}` : ''}
                    </Text>
                  ) : null}
                  <View style={styles.statRow}>
                    {[
                      [t('search.stats.appearances'), item.statistics.appearances],
                      [t('search.stats.goals'), item.statistics.goals],
                      [t('search.stats.assists'), item.statistics.assists],
                      [
                        t('search.stats.cards'),
                        item.statistics.yellowCards + item.statistics.redCards,
                      ],
                    ].map(([label, value]) => (
                      <View key={String(label)} style={styles.stat}>
                        <Text style={styles.statValue}>{value}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}
            />
          ) : (
            <FlatList
              data={resultados}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                global && global.suggestions.length > 0 ? (
                  <View style={styles.suggestions}>
                    {global.suggestions.slice(0, 4).map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => setTermo(suggestion)}
                        style={styles.suggestion}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => abrirResultado(item.type, item.id)} style={styles.row}>
                  <Badge label={t(`search.types.${item.type}`)} tone="neutral" />
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Icon name="chevron-right" size={18} color={colors.bd2} strokeWidth={2} />
                </Pressable>
              )}
            />
          )}
        </AsyncBoundary>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.xl,
    marginBottom: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    backgroundColor: colors.sur2,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink, padding: 0 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.bd },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.acc },
  tabLabel: { fontSize: 14, color: colors.ink2 },
  tabLabelActive: { color: colors.acc, fontWeight: '600' },
  hint: { padding: spacing.xxxl, alignItems: 'center' },
  hintText: { fontSize: 13, color: colors.ink3 },
  list: { padding: spacing.xl, gap: spacing.md },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestion: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.bd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: { fontSize: 13, color: colors.ink2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
  },
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerName: { fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 },
  playerTeam: { fontSize: 13, color: colors.ink2, marginTop: 4 },
  statRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '600', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.ink3, marginTop: 2 },
});
