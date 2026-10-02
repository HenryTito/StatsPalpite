import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { captureError } from '../observability/sentry';
import { colors, spacing } from '../theme';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Captura erros de renderização e os reporta (RNF08).
 *
 * Sem isto, um erro em qualquer tela derruba o app inteiro para uma tela
 * branca, e o crash chega ao painel sem o contexto do que o usuário via.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack });
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.message}>{error.message}</Text>
        <Button label="Tentar novamente" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sur,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.ink },
  message: { fontSize: 14, color: colors.ink2, textAlign: 'center' },
});
