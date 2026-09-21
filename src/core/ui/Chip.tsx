import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Chip de filtro: 30pt de altura, cantos totalmente arredondados. */
export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  idle: { backgroundColor: 'transparent', borderColor: colors.bd },
  selected: { backgroundColor: colors.accBg, borderColor: colors.accLine },
  label: { fontSize: 13 },
  labelIdle: { color: colors.ink2, fontWeight: '400' },
  labelSelected: { color: colors.acc, fontWeight: '600' },
});

export const chipRadius = radius.pill;
