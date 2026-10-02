import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../core/api/ApiError';
import { useI18n } from '../../core/i18n';
import { colors, spacing } from '../../core/theme';
import { BottomBar, Button, Field, Icon, Screen, TopBar } from '../../core/ui';
import { authRepository } from '../../infrastructure/repositories/apiRepositories';
import { useSession } from '../../modules/auth/SessionContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

/** Espera o usuário parar de digitar antes de consultar a disponibilidade. */
const USERNAME_DEBOUNCE_MS = 400;

export function CadastroScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { signUp } = useSession();

  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [nascimento, setNascimento] = useState('2001-04-12');
  // O seletor de data nativo entra na Sprint 2; por ora o campo e editavel.
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [usuarioStatus, setUsuarioStatus] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);

  // RF34: o backend é a autoridade sobre o nome, inclusive a lista de bloqueio.
  useEffect(() => {
    if (usuario.trim().length < 3) {
      setUsuarioStatus(null);
      return undefined;
    }

    const timer = setTimeout(() => {
      authRepository
        .checkUsername(usuario.trim())
        .then(setUsuarioStatus)
        .catch(() => setUsuarioStatus(null));
    }, USERNAME_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [usuario]);

  const senhasConferem = senha.length > 0 && senha === confirmacao;
  const podeCadastrar =
    usuarioStatus?.available === true && email.includes('@') && senhasConferem && !enviando;

  const cadastrar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      await signUp({
        email: email.trim(),
        username: usuario.trim().toLowerCase(),
        password: senha,
        passwordConfirmation: confirmacao,
        birthDate: nascimento,
      });
    } catch (caught) {
      setErro(caught instanceof ApiError ? caught.message : t('common.error'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Screen
      header={<TopBar title={t('signUp.title')} back="arrow" onBack={() => navigation.goBack()} />}
      footer={
        <BottomBar>
          <Button
            label={enviando ? t('common.loading') : t('signUp.submit')}
            disabled={!podeCadastrar}
            onPress={podeCadastrar ? cadastrar : undefined}
          />
        </BottomBar>
      }
    >
      <Field
        label={t('signUp.username')}
        value={usuario}
        onChangeText={setUsuario}
        placeholder="henrytito"
        error={usuarioStatus && !usuarioStatus.available ? usuarioStatus.reason : undefined}
        right={
          usuarioStatus?.available ? (
            <View style={styles.adornment}>
              <Icon name="check" size={18} color={colors.acc} strokeWidth={2.2} />
            </View>
          ) : undefined
        }
      />
      <Field
        label={t('login.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('login.emailPlaceholder')}
        keyboardType="email-address"
      />
      <Field
        label={t('signUp.birthDate')}
        value={nascimento}
        onChangeText={setNascimento}
        placeholder="AAAA-MM-DD"
        right={<Icon name="calendar-days" size={18} color={colors.ink3} />}
      />
      <Field
        label={t('login.password')}
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        secureTextEntry
      />
      <Field
        label={t('signUp.confirmPassword')}
        value={confirmacao}
        onChangeText={setConfirmacao}
        placeholder="••••••••"
        secureTextEntry
        error={confirmacao.length > 0 && !senhasConferem ? t('signUp.passwordMismatch') : undefined}
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  adornment: { marginLeft: spacing.sm },
  erro: { fontSize: 13, color: colors.dan },
});
