import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '../../core/hooks/useAsync';
import { SUPPORTED_LOCALES, useI18n, type Locale } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import {
  AsyncBoundary,
  Button,
  Icon,
  LineChart,
  Screen,
  SectionTitle,
  StatTile,
} from '../../core/ui';
import { rankingRepository } from '../../infrastructure/repositories/apiRepositories';
import { useSession } from '../../modules/auth/SessionContext';

export function PerfilScreen() {
  const { t, locale, setLocale, formatNumber } = useI18n();
  const { user, signOut } = useSession();

  const { data, loading, error, reload } = useAsync(
    async () =>
      user
        ? {
            position: await rankingRepository.myPosition(),
            // RF71: série dos últimos 30 dias.
            history: await rankingRepository.myHistory(30),
          }
        : null,
    [user?.id],
  );

  const chartPoints = (data?.history.points ?? []).map((point) => ({
    date: point.date,
    value: point.position,
  }));

  return (
    <Screen
      header={
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>
                {(user?.username ?? '??').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{user?.username ?? '—'}</Text>
              <Text style={styles.subtitle}>
                {data?.position
                  ? `#${data.position.position} · ${formatNumber(data.position.points)} ${t('ranking.points')}`
                  : '—'}
              </Text>
            </View>
          </View>
          <Icon name="settings" size={22} color={colors.ink} />
        </View>
      }
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={loading} error={error} hasData={data !== null} onRetry={reload}>
        <View style={styles.tiles}>
          <StatTile
            label={t('ranking.yourPosition')}
            value={data?.position ? `#${data.position.position}` : '—'}
            size="lg"
          />
          <StatTile
            label={t('ranking.best')}
            value={
              data?.history.best !== null && data?.history.best !== undefined
                ? `#${data.history.best}`
                : '—'
            }
            size="lg"
          />
          <StatTile
            label={t('ranking.worst')}
            value={
              data?.history.worst !== null && data?.history.worst !== undefined
                ? `#${data.history.worst}`
                : '—'
            }
            size="lg"
          />
        </View>

        <SectionTitle style={styles.section}>{t('ranking.evolution')}</SectionTitle>
        <View style={styles.chartCard}>
          <LineChart
            points={chartPoints}
            height={140}
            // Posição menor é melhor: o eixo precisa subir quando o número cai.
            invertY
            emptyMessage={t('ranking.noHistory')}
          />
          {data?.history && data.history.change !== 0 ? (
            <Text
              style={[styles.change, { color: data.history.change > 0 ? colors.acc : colors.dan }]}
            >
              {data.history.change > 0 ? '▲' : '▼'} {Math.abs(data.history.change)} posições em{' '}
              {data.history.days} dias
            </Text>
          ) : null}
        </View>

        <SectionTitle style={styles.section}>{t('settings.language')}</SectionTitle>
        <View style={styles.languages}>
          {SUPPORTED_LOCALES.map((item: Locale) => (
            <Pressable
              key={item}
              onPress={() => setLocale(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: item === locale }}
              style={[styles.language, item === locale && styles.languageActive]}
            >
              <Text style={[styles.languageLabel, item === locale && styles.languageLabelActive]}>
                {item === 'pt-BR' ? t('settings.portuguese') : t('settings.english')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          label={t('settings.logout')}
          variant="secondary"
          onPress={signOut}
          style={styles.logout}
        />
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 76,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.acc, fontWeight: '600', fontSize: 14 },
  username: { fontSize: 16, fontWeight: '600', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  content: { gap: 14, paddingBottom: spacing.xxxl },
  tiles: { flexDirection: 'row', gap: 10 },
  section: { marginTop: 6 },
  chartCard: { backgroundColor: colors.sur2, borderRadius: radius.lg, padding: spacing.md },
  change: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  languages: { flexDirection: 'row', gap: spacing.sm },
  language: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageActive: { backgroundColor: colors.accBg, borderColor: colors.accLine },
  languageLabel: { fontSize: 14, color: colors.ink2 },
  languageLabelActive: { color: colors.acc, fontWeight: '600' },
  logout: { marginTop: spacing.sm },
});
