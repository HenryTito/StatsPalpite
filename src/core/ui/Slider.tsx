import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

/**
 * Slider de valores inteiros. Trilho de 6pt e polegar de 24pt contornado,
 * como no design; arrasto implementado com PanResponder para evitar
 * dependencia nativa adicional.
 */
export function Slider({ value, min = 0, max = 100, onChange }: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const emit = useCallback(
    (x: number) => {
      if (width <= 0) return;
      const ratio = Math.min(1, Math.max(0, x / width));
      onChange(Math.round(min + ratio * (max - min)));
    },
    [max, min, onChange, width],
  );

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => emit(e.nativeEvent.locationX),
        onPanResponderMove: (e) => emit(e.nativeEvent.locationX),
      }),
    [emit],
  );

  const ratio = max === min ? 0 : (value - min) / (max - min);

  return (
    <View
      style={styles.root}
      onLayout={onLayout}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      {...responder.panHandlers}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      <View style={[styles.thumb, { left: Math.max(0, ratio * width - 12) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: 24, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sur2,
  },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: colors.acc },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sur,
    borderWidth: 2,
    borderColor: colors.acc,
  },
});
