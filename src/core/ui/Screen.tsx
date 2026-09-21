import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type Props = {
  children: ReactNode;
  /** Conteudo fixo no topo, fora da area rolavel (TopBar, banners). */
  header?: ReactNode;
  /** Barra de acao fixa no rodape. */
  footer?: ReactNode;
  /** Desativa a rolagem quando a tela ja controla o proprio scroll. */
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

/** Esqueleto comum das telas: superficie, header fixo, corpo rolavel e rodape. */
export function Screen({ children, header, footer, scroll = true, contentStyle }: Props) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {header}
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sur },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md },
});
