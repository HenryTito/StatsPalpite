import React, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../../core/theme';

/**
 * Carregamento sob demanda de telas (RNF01).
 *
 * O alvo é inicializar abaixo de 3 segundos. Telas que o usuário pode nunca
 * abrir — mapa, busca, painel admin, boletim — não precisam entrar no bundle
 * avaliado no arranque. React.lazy adia o require até a navegação acontecer;
 * o Metro mantém tudo no mesmo bundle, mas o custo de avaliação sai do
 * caminho crítico, que é o que pesa no tempo até a primeira tela.
 */
function Fallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color={colors.acc} />
    </View>
  );
}

/**
 * Embrulha um componente preguiçoso num Suspense com o fallback padrão.
 *
 * As props ficam deliberadamente soltas: quem garante a tipagem é o
 * `Stack.Screen`, que confere nome e parâmetros contra RootStackParamList.
 * Propagar o genérico até aqui faria a inferência brigar com o retorno do
 * `import()` dinâmico sem ganhar nenhuma segurança real.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

export function lazyScreen(loader: () => Promise<{ default: AnyComponent }>): AnyComponent {
  const Lazy = React.lazy(loader);

  return function LazyScreen(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<Fallback />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.sur,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
