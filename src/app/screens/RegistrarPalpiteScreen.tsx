import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../core/theme';
import {
  BottomBar,
  Button,
  Field,
  FieldLabel,
  Icon,
  Screen,
  Slider,
  Surface,
  TopBar,
} from '../../core/ui';
import type { Escolha } from '../../modules/palpites/domain/Palpite';
import { ORCAMENTO_DIARIO } from '../../modules/palpites/domain/Palpite';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrarPalpite'>;

const opcoes: { valor: Escolha; rotulo: string }[] = [
  { valor: 'mandante', rotulo: 'Palmeiras' },
  { valor: 'empate', rotulo: 'Empate' },
  { valor: 'visitante', rotulo: 'Santos' },
];

/** Multiplicadores de pontuacao aplicados sobre a aposta. */
const MULTIPLICADOR_VENCEDOR = 2;
const MULTIPLICADOR_PLACAR = 5;

export function RegistrarPalpiteScreen({ navigation }: Props) {
  const [escolha, setEscolha] = useState<Escolha>('mandante');
  const [pontos, setPontos] = useState(7);
  const [justificativa, setJustificativa] = useState('');

  return (
    <Screen
      header={<TopBar title="Seu palpite" back="close" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={
        <BottomBar>
          <Button
            label="Confirmar palpite"
            onPress={() => navigation.navigate('Tabs', { screen: 'MeusPalpites' })}
          />
        </BottomBar>
      }
    >
      <FieldLabel>Quem vence?</FieldLabel>
      {opcoes.map((opcao) => {
        const selecionada = opcao.valor === escolha;
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => setEscolha(opcao.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selecionada }}
            style={[styles.option, selecionada ? styles.optionSelected : styles.optionIdle]}
          >
            <Text style={[styles.optionLabel, selecionada && styles.optionLabelSelected]}>
              {opcao.rotulo}
            </Text>
            {selecionada ? <Icon name="check-circle" size={22} color={colors.sur} /> : null}
          </Pressable>
        );
      })}

      <View style={styles.pointsHeader}>
        <FieldLabel>Pontos apostados</FieldLabel>
        <Text style={styles.pointsValue}>{pontos}</Text>
      </View>
      <Slider value={pontos} min={1} max={ORCAMENTO_DIARIO} onChange={setPontos} />

      <Surface>
        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Acerto do vencedor</Text>
          <Text style={styles.payoutValue}>{pontos * MULTIPLICADOR_VENCEDOR} pts</Text>
        </View>
        <View style={[styles.payoutRow, styles.payoutRowSpaced]}>
          <Text style={styles.payoutLabel}>Placar exato</Text>
          <Text style={styles.payoutValue}>{pontos * MULTIPLICADOR_PLACAR} pts</Text>
        </View>
      </Surface>

      <Field
        label="Justificativa (opcional)"
        value={justificativa}
        onChangeText={setJustificativa}
        placeholder="Por que esse palpite?"
        multiline
        autoCapitalize="sentences"
      />

      <Text style={styles.budget}>
        Orçamento diário: {pontos} de {ORCAMENTO_DIARIO} pts usados
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  option: {
    height: 52,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  optionIdle: { borderWidth: 1, borderColor: colors.bd, backgroundColor: colors.sur2 },
  optionSelected: { borderWidth: 2, borderColor: colors.acc, backgroundColor: colors.accBg },
  optionLabel: { fontSize: 14, color: colors.ink },
  optionLabelSelected: { fontWeight: '600' },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pointsValue: { fontSize: 16, fontWeight: '600', color: colors.ink },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payoutRowSpaced: { marginTop: 6 },
  payoutLabel: { fontSize: 13, color: colors.ink2 },
  payoutValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
  budget: { fontSize: 12, color: colors.ink3 },
});
