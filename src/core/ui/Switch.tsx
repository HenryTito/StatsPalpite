import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

/** Toggle 44x26 do design, com polegar de 18pt. */
export function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  trackOff: { backgroundColor: colors.sur2, borderWidth: 1, borderColor: colors.bd },
  trackOn: { backgroundColor: colors.accStrong },
  thumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  thumbOff: { left: 3, backgroundColor: colors.bd2 },
  thumbOn: { right: 3, backgroundColor: colors.onAcc },
});
