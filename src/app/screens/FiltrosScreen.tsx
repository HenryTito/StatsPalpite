import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../core/theme';
import {
  BottomBar,
  Button,
  Chip,
  FieldLabel,
  Icon,
  Screen,
  SelectField,
  Switch,
  TopBar,
} from '../../core/ui';
import { ligas } from '../../infrastructure/fixtures/partidas';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Filtros'>;

export function FiltrosScreen({ navigation }: Props) {
  const [ligaSelecionada, setLigaSelecionada] = useState(ligas[0]);
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);
  const [comPalpitePendente, setComPalpitePendente] = useState(true);

  const limpar = () => {
    setLigaSelecionada(ligas[0]);
    setSomenteFavoritas(false);
    setComPalpitePendente(false);
    navigation.goBack();
  };

  return (
    <Screen
      header={<TopBar title="Filtrar partidas" back="close" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={
        <BottomBar row>
          <Button label="Limpar" variant="secondary" onPress={limpar} style={styles.action} />
          <Button label="Aplicar" onPress={() => navigation.goBack()} style={styles.action} />
        </BottomBar>
      }
    >
      <FieldLabel>Liga</FieldLabel>
      <View style={styles.chips}>
        {ligas.map((liga) => (
          <Chip
            key={liga}
            label={liga}
            selected={liga === ligaSelecionada}
            onPress={() => setLigaSelecionada(liga)}
          />
        ))}
      </View>

      <SelectField
        label="Data"
        value="13 de setembro"
        right={<Icon name="calendar" size={18} color={colors.ink3} />}
      />

      <SelectField
        label="Time"
        placeholder="Buscar time"
        right={<Icon name="search" size={18} color={colors.ink3} />}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Só partidas favoritas</Text>
        <Switch
          value={somenteFavoritas}
          onValueChange={setSomenteFavoritas}
          accessibilityLabel="Só partidas favoritas"
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Com palpite pendente</Text>
        <Switch
          value={comPalpitePendente}
          onValueChange={setComPalpitePendente}
          accessibilityLabel="Com palpite pendente"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  action: { flex: 1 },
});
