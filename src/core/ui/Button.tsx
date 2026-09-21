import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** 50pt e a altura padrao; 40pt e usada em acoes secundarias no corpo. */
  height?: number;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  height = 50,
  style,
}: Props) {
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { height },
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant], isDisabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: { backgroundColor: colors.sur2, borderWidth: 0 },
  pressed: { opacity: 0.85 },
  label: { fontSize: 15, fontWeight: '600' },
  labelDisabled: { color: colors.ink3 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.accStrong },
  secondary: { borderWidth: 1, borderColor: colors.bd2, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danStrong },
};

const labelStyles = StyleSheet.create({
  primary: { color: colors.onAcc },
  secondary: { color: colors.ink },
  ghost: { color: colors.acc },
  danger: { color: colors.onAcc },
});
