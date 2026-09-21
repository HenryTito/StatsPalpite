import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../core/theme';
import { BottomBar, Button, Field, Icon, Screen, SelectField, TopBar } from '../../core/ui';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

export function CadastroScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState('henrytito');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const usuarioDisponivel = usuario.trim().length >= 3;
  const senhasConferem = senha.length > 0 && senha === confirmacao;
  const podeCadastrar = usuarioDisponivel && email.includes('@') && senhasConferem;

  return (
    <Screen
      header={<TopBar title="Criar conta" back="arrow" onBack={() => navigation.goBack()} />}
      footer={
        <BottomBar>
          <Button
            label="Cadastrar"
            disabled={!podeCadastrar}
            onPress={
              podeCadastrar ? () => navigation.replace('Tabs', { screen: 'Home' }) : undefined
            }
          />
        </BottomBar>
      }
    >
      <Field
        label="Nome de usuário"
        value={usuario}
        onChangeText={setUsuario}
        right={
          usuarioDisponivel ? (
            <View style={styles.adornment}>
              <Icon name="check" size={18} color={colors.acc} strokeWidth={2.2} />
            </View>
          ) : undefined
        }
      />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="nome@email.com"
        keyboardType="email-address"
      />
      <SelectField
        label="Data de nascimento"
        value="12/04/2001"
        right={<Icon name="calendar-days" size={18} color={colors.ink3} />}
      />
      <Field
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        secureTextEntry
      />
      <Field
        label="Confirmar senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        placeholder="••••••••"
        secureTextEntry
        error={confirmacao.length > 0 && !senhasConferem ? 'As senhas não coincidem' : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  adornment: { marginLeft: spacing.sm },
});
