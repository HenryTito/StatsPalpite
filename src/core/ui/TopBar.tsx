import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './Icon';
import { colors, layout, spacing } from '../theme';

type Props = {
  title: string;
  /** `large` reproduz os titulos de 20pt das telas raiz. */
  variant?: 'large' | 'compact';
  /** Icone de retorno: seta em telas empilhadas, X em telas modais. */
  back?: 'arrow' | 'close';
  onBack?: () => void;
  right?: ReactNode;
};

export function TopBar({ title, variant = 'compact', back, onBack, right }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {back ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Icon name={back === 'close' ? 'close' : 'chevron-left'} size={22} strokeWidth={1.8} />
          </Pressable>
        ) : null}
        <Text style={variant === 'large' ? styles.titleLarge : styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.bd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink },
  titleLarge: { fontSize: 20, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
});

export const topBarHeight = layout.topBarHeight;
