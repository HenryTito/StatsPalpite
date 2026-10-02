import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { VenueResult } from '../../core/api/types';
import { useAsync } from '../../core/hooks/useAsync';
import { useI18n } from '../../core/i18n';
import { colors, radius, spacing } from '../../core/theme';
import { AsyncBoundary, Screen, TopBar } from '../../core/ui';
import { matchRepository } from '../../infrastructure/repositories/apiRepositories';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MapaEstadios'>;

/** Enquadramento inicial: Brasil, de onde vem a maior parte do catálogo. */
const INITIAL_REGION = {
  latitude: -15.78,
  longitude: -47.93,
  latitudeDelta: 35,
  longitudeDelta: 35,
};

/** Raio do "perto de você", em quilômetros. */
const NEARBY_RADIUS_KM = 300;

/** Distância em km entre duas coordenadas (fórmula de Haversine). */
function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function MapaEstadiosScreen({ navigation }: Props) {
  const { t, formatNumber } = useI18n();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locationDenied, setLocationDenied] = useState(false);

  const { data, loading, error, reload } = useAsync(() => matchRepository.venues(), []);

  /**
   * O GPS é opcional (RF49): se o usuário negar, o mapa continua útil, só não
   * destaca os estádios próximos.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setLocationDenied(true);
          return;
        }
        const position = await Location.getLastKnownPositionAsync();
        if (cancelled || !position) return;
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        if (!cancelled) setLocationDenied(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const venues = useMemo(
    () =>
      (data?.venues ?? []).filter(
        (venue): venue is VenueResult & { coordinates: NonNullable<VenueResult['coordinates']> } =>
          venue.coordinates !== null,
      ),
    [data],
  );

  const nearby = useMemo(() => {
    if (!userLocation) return new Set<string>();
    return new Set(
      venues
        .filter((venue) => distanceKm(userLocation, venue.coordinates) <= NEARBY_RADIUS_KM)
        .map((venue) => venue.id),
    );
  }, [venues, userLocation]);

  return (
    <Screen
      header={<TopBar title={t('map.title')} back="arrow" onBack={() => navigation.goBack()} />}
      scroll={false}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading}
        error={error}
        hasData={venues.length > 0}
        onRetry={reload}
        isEmpty={!loading && venues.length === 0}
      >
        <View style={styles.container}>
          <MapView
            style={styles.map}
            // No Android o provider do Google rende melhor e é o padrão do SDK.
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={INITIAL_REGION}
            showsUserLocation={userLocation !== null}
            toolbarEnabled={false}
          >
            {venues.map((venue) => (
              <Marker
                key={venue.id}
                coordinate={venue.coordinates}
                title={venue.name}
                description={[
                  venue.city,
                  venue.capacity ? `${t('map.capacity')}: ${formatNumber(venue.capacity)}` : null,
                  venue.openedYear ? `${t('map.opened')} ${venue.openedYear}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                pinColor={nearby.has(venue.id) ? colors.acc : colors.warn}
              />
            ))}
          </MapView>

          <View style={styles.legend}>
            <Text style={styles.legendText}>
              {venues.length} {t('map.title').toLowerCase()}
              {nearby.size > 0 ? ` · ${nearby.size} ${t('map.nearby').toLowerCase()}` : ''}
            </Text>
            {locationDenied ? (
              <Text style={styles.legendHint}>{t('map.permissionDenied')}</Text>
            ) : null}
          </View>
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, gap: 0, flex: 1 },
  container: { flex: 1 },
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.sur,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bd,
    padding: spacing.md,
  },
  legendText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  legendHint: { fontSize: 12, color: colors.warn, marginTop: 4 },
});
