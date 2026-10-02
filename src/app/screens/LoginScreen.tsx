import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../../core/api/ApiError';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import { Button, Field, Icon } from '../../core/ui';
import { authRepository } from '../../infrastructure/repositories/apiRepositories';
import { useSession } from '../../modules/auth/SessionContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      await signIn({ email: email.trim(), password: senha });
    } catch (caught) {
      setErro(caught instanceof ApiError ? caught.message : t('common.error'));
    } finally {
      setEnviando(false);
    }
  };

  const recuperarSenha = async () => {
    if (!email.includes('@')) {
      setErro(t('login.emailPlaceholder'));
      return;
    }
    try {
      const response = await authRepository.forgotPassword(email.trim());
      setErro(response.message);
    } catch (caught) {
      setErro(caught instanceof ApiError ? caught.message : t('common.error'));
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/*
        Sem isto, o teclado comprime o layout e o aviso legal do rodapé sobe
        por cima do botão de entrar, que fica inalcançável. O ScrollView
        garante que todo o formulário continue acessível em telas baixas.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View style={styles.logo}>
              <Icon name="logo" size={34} color={colors.onAcc} />
            </View>
            <Text style={styles.wordmark}>StatsPalpite</Text>
            <Text style={styles.tagline}>{t('login.tagline')}</Text>

            <View style={styles.form}>
              <Field
                label={t('login.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('login.emailPlaceholder')}
                keyboardType="email-address"
              />
              <Field
                label={t('login.password')}
                value={senha}
                onChangeText={setSenha}
                placeholder="••••••••"
                secureTextEntry={!senhaVisivel}
                right={
                  <Pressable
                    onPress={() => setSenhaVisivel((visivel) => !visivel)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('login.password')}
                  >
                    <Icon name="eye" size={20} color={colors.ink3} />
                  </Pressable>
                }
              />
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <Pressable onPress={recuperarSenha} accessibilityRole="button">
              <Text style={styles.forgot}>{t('login.forgot')}</Text>
            </Pressable>

            <Button
              label={enviando ? t('common.loading') : t('login.signIn')}
              onPress={enviando ? undefined : entrar}
              disabled={enviando}
            />
            <Button
              label={t('login.signUp')}
              variant="secondary"
              onPress={() => navigation.navigate('Cadastro')}
            />
          </View>
          <Text style={styles.legal}>{t('login.legal')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sur },
  flex: { flex: 1 },
  // flexGrow mantém o rodapé embaixo quando sobra espaço, e deixa rolar quando falta.
  scroll: { flexGrow: 1, justifyContent: 'space-between' },
  body: { paddingTop: 56, paddingHorizontal: spacing.xl, gap: spacing.lg },
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
  erro: { fontSize: 13, color: colors.dan },
  forgot: { fontSize: 13, color: colors.acc, fontWeight: '600', textAlign: 'right' },
  legal: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    fontSize: 12,
    color: colors.ink3,
  },
});
