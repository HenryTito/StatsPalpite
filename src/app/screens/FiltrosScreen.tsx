import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '../../core/api/ApiError';
import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import {
  Badge,
  BottomBar,
  Button,
  Chip,
  DateField,
  FieldLabel,
  Icon,
  Screen,
  TopBar,
} from '../../core/ui';
import {
  matchRepository,
  searchRepository,
} from '../../infrastructure/repositories/apiRepositories';
import {
  EMPTY_FILTER,
  useMatchFilter,
  type MatchFilter,
} from '../../modules/partidas/FilterContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Filtros'>;

/** Espera o usuário parar de digitar antes de consultar a API. */
const DEBOUNCE_MS = 350;

const STATUS_OPTIONS = ['scheduled', 'live', 'finished'] as const;

export function FiltrosScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { filter, applyFilter, clearFilter } = useMatchFilter();

  // Começa do filtro em vigor: reabrir a tela mostra o que já está aplicado.
  const [rascunho, setRascunho] = useState<MatchFilter>(filter);
  const [buscaTime, setBuscaTime] = useState(filter.teamName ?? '');
  const [sugestoes, setSugestoes] = useState<{ id: string; name: string }[]>([]);
  const [buscando, setBuscando] = useState(false);

  const { data: ligasResposta } = useAsync(() => matchRepository.leagues(), []);
  const ligas = ligasResposta?.leagues ?? [];

  // Busca de times com espera: sem ela, cada tecla vira uma requisição.
  useEffect(() => {
    const termo = buscaTime.trim();
    if (termo.length < 2 || termo === rascunho.teamName) {
      setSugestoes([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      setBuscando(true);
      searchRepository
        .global(termo, 'team')
        .then((resposta) =>
          setSugestoes(resposta.results.slice(0, 5).map((r) => ({ id: r.id, name: r.name }))),
        )
        .catch((erro) => {
          if (!(erro instanceof ApiError)) return;
          setSugestoes([]);
        })
        .finally(() => setBuscando(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [buscaTime, rascunho.teamName]);

  const aplicar = () => {
    applyFilter(rascunho);
    navigation.goBack();
  };

  const limpar = () => {
    clearFilter();
    setRascunho(EMPTY_FILTER);
    setBuscaTime('');
    setSugestoes([]);
  };

  return (
    <Screen
      header={<TopBar title={t('home.filters')} back="close" onBack={() => navigation.goBack()} />}
      scroll={false}
      contentStyle={styles.content}
      footer={
        <BottomBar row>
          <Button
            label={t('filters.clear')}
            variant="secondary"
            onPress={limpar}
            style={styles.action}
          />
          <Button label={t('filters.apply')} onPress={aplicar} style={styles.action} />
        </BottomBar>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FieldLabel>{t('filters.league')}</FieldLabel>
        <View style={styles.chips}>
          {ligas.map((liga) => (
            <Chip
              key={liga.id}
              label={liga.name}
              selected={liga.id === rascunho.leagueId}
              onPress={() =>
                setRascunho((atual) =>
                  atual.leagueId === liga.id
                    ? { ...atual, leagueId: null, leagueName: null }
                    : { ...atual, leagueId: liga.id, leagueName: liga.name },
                )
              }
            />
          ))}
          {ligas.length === 0 ? <Text style={styles.vazio}>{t('common.loading')}</Text> : null}
        </View>

        <FieldLabel>{t('filters.date')}</FieldLabel>
        <DateField
          value={rascunho.date}
          onChange={(data) => setRascunho((atual) => ({ ...atual, date: data }))}
          placeholder={t('filters.anyDate')}
          accessibilityLabel={t('filters.date')}
        />

        <FieldLabel>{t('filters.team')}</FieldLabel>
        <View style={styles.input}>
          <TextInput
            style={styles.inputTexto}
            value={buscaTime}
            onChangeText={(texto) => {
              setBuscaTime(texto);
              // Digitar de novo desfaz a seleção anterior.
              setRascunho((atual) => ({ ...atual, teamId: null, teamName: null }));
            }}
            placeholder={t('filters.searchTeam')}
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {rascunho.teamId ? (
            <Pressable
              onPress={() => {
                setBuscaTime('');
                setRascunho((atual) => ({ ...atual, teamId: null, teamName: null }));
              }}
              hitSlop={8}
              accessibilityLabel={t('common.close')}
            >
              <Icon name="close" size={18} color={colors.ink3} />
            </Pressable>
          ) : (
            <Icon name="search" size={18} color={colors.ink3} />
          )}
        </View>

        {rascunho.teamName ? <Badge label={rascunho.teamName} style={styles.selecionado} /> : null}

        {buscando ? <Text style={styles.vazio}>{t('common.loading')}</Text> : null}

        {sugestoes.map((sugestao) => (
          <Pressable
            key={sugestao.id}
            onPress={() => {
              setRascunho((atual) => ({ ...atual, teamId: sugestao.id, teamName: sugestao.name }));
              setBuscaTime(sugestao.name);
              setSugestoes([]);
            }}
            style={styles.sugestao}
          >
            <Text style={styles.sugestaoTexto}>{sugestao.name}</Text>
            <Icon name="chevron-right" size={18} color={colors.bd2} strokeWidth={2} />
          </Pressable>
        ))}

        <FieldLabel>{t('filters.status')}</FieldLabel>
        <View style={styles.chips}>
          {STATUS_OPTIONS.map((status) => (
            <Chip
              key={status}
              label={t(`filters.statusOptions.${status}`)}
              selected={status === rascunho.status}
              onPress={() =>
                setRascunho((atual) => ({
                  ...atual,
                  status: atual.status === status ? null : status,
                }))
              }
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0, flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: colors.sur2,
    gap: spacing.sm,
  },
  inputErro: { borderColor: colors.dan },
  inputTexto: { flex: 1, fontSize: 14, color: colors.ink, padding: 0 },
  erro: { fontSize: 12, color: colors.dan },
  vazio: { fontSize: 13, color: colors.ink3 },
  selecionado: { marginTop: 2 },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
  },
  sugestaoTexto: { fontSize: 14, color: colors.ink, flex: 1 },
  action: { flex: 1 },
});
