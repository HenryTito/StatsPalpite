import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../core/theme';
import { Button, Field, Icon } from '../../core/ui';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.logo}>
          <Icon name="logo" size={34} color={colors.onAcc} />
        </View>
        <Text style={styles.wordmark}>StatsPalpite</Text>
        <Text style={styles.tagline}>Analise antes de palpitar.</Text>

        <View style={styles.form}>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="nome@email.com"
            keyboardType="email-address"
          />
          <Field
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            secureTextEntry={!senhaVisivel}
            right={
              <View onTouchEnd={() => setSenhaVisivel((v) => !v)}>
                <Icon name="eye" size={20} color={colors.ink3} />
              </View>
            }
          />
        </View>

        <Text style={styles.forgot}>Esqueci a senha</Text>

        <Button label="Entrar" onPress={() => navigation.replace('Tabs', { screen: 'Home' })} />
        <Button
          label="Criar conta"
          variant="secondary"
          onPress={() => navigation.navigate('Cadastro')}
        />
      </View>
      <Text style={styles.legal}>Uso permitido apenas para maiores de 18 anos</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sur },
  body: { flex: 1, paddingTop: 56, paddingHorizontal: spacing.xl, gap: spacing.lg },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.accStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.26,
    marginTop: spacing.sm,
  },
  tagline: { fontSize: 14, color: colors.ink2 },
  form: { gap: spacing.md, marginTop: spacing.lg },
  forgot: { fontSize: 13, color: colors.acc, fontWeight: '600', textAlign: 'right' },
  legal: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    fontSize: 12,
    color: colors.ink3,
  },
});
