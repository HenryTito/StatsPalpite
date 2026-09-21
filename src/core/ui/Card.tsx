import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

/** Card de contorno: borda de 1pt, raio 14 e padding 14, como no design. */
export function Card({ children, onPress, style }: Props) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

/** Bloco preenchido (superficie elevada) usado em tiles e resumos. */
export function Surface({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.sur,
  },
  pressed: { opacity: 0.8 },
  surface: {
    backgroundColor: colors.sur2,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});
