import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { ApiError } from '../api/ApiError';
import { colors, spacing } from '../theme';

type Props = {
  loading: boolean;
  error: ApiError | null;
  /** Mostra conteúdo antigo enquanto recarrega, em vez de piscar o spinner. */
  hasData?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
};

/** Estados de carregamento, erro e vazio, iguais em toda tela que busca dados. */
export function AsyncBoundary({
  loading,
  error,
  hasData = false,
  onRetry,
  emptyMessage,
  isEmpty = false,
  children,
}: Props) {
  if (loading && !hasData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.acc} />
      </View>
    );
  }

  if (error && !hasData) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          {error.isNetworkError ? 'Sem conexão com o servidor' : 'Algo deu errado'}
        </Text>
        <Text style={styles.message}>{error.message}</Text>
        {onRetry ? <Button label="Tentar novamente" variant="secondary" onPress={onRetry} /> : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{emptyMessage ?? 'Nada por aqui ainda'}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink },
  message: { fontSize: 14, color: colors.ink2, textAlign: 'center' },
});
