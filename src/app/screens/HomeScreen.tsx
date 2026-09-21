import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PartidaCard } from './home/PartidaCard';
import { colors, spacing } from '../../core/theme';
import { Chip, Icon, Screen, TopBar } from '../../core/ui';
import { partidasDeHoje } from '../../infrastructure/fixtures/partidas';
import type { RootStackParamList } from '../navigation/types';

const filtrosRapidos = ['Todas', 'Brasileirão', 'Filtros'];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filtroAtivo, setFiltroAtivo] = useState('Todas');

  const abrirPartida = (id: string, aoVivo: boolean) =>
    aoVivo
      ? navigation.navigate('PartidaAoVivo', { partidaId: id })
      : navigation.navigate('DetalhePartida', { partidaId: id });

  return (
    <Screen
      header={
        <TopBar
          title="Hoje"
          variant="large"
          right={<Icon name="bell" size={22} color={colors.ink} />}
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.filters}>
        {filtrosRapidos.map((filtro) => (
          <Chip
            key={filtro}
            label={filtro}
            selected={filtro === filtroAtivo}
            onPress={() => {
              setFiltroAtivo(filtro);
              navigation.navigate('Filtros');
            }}
          />
        ))}
      </View>

      {partidasDeHoje.map((partida) => (
        <PartidaCard
          key={partida.id}
          partida={partida}
          onPress={() => abrirPartida(partida.id, partida.status === 'ao-vivo')}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  filters: { flexDirection: 'row', gap: spacing.sm },
});
