import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Line as SvgLine } from 'react-native-svg';

import { colors, spacing } from '../theme';

export type ChartPoint = { date: string; value: number };

type Props = {
  points: ChartPoint[];
  height?: number;
  /** Para posição no ranking, menor é melhor: o eixo precisa ser invertido. */
  invertY?: boolean;
  emptyMessage?: string;
};

const PADDING = 8;

/**
 * Gráfico de linha em SVG, usado pela evolução do ranking (RF71).
 *
 * Desenhado com react-native-svg, que o projeto já usa para os ícones, em vez
 * de somar outra dependência de gráficos só para uma série simples.
 */
export function LineChart({ points, height = 140, invertY = false, emptyMessage }: Props) {
  const [width, setWidth] = React.useState(0);

  if (points.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>{emptyMessage ?? 'Dados insuficientes'}</Text>
      </View>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Série constante teria amplitude zero e dividiria por zero no cálculo.
  const span = max - min || 1;

  const innerWidth = Math.max(width - PADDING * 2, 1);
  const innerHeight = height - PADDING * 2;

  const coordinates = points.map((point, index) => {
    const x = PADDING + (index / (points.length - 1)) * innerWidth;
    const ratio = (point.value - min) / span;
    // invertY: valor menor (posição melhor) fica mais alto no gráfico.
    const y = PADDING + (invertY ? ratio : 1 - ratio) * innerHeight;
    return { x, y };
  });

  const path = coordinates
    .map((coordinate, index) => `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`)
    .join(' ');

  const last = coordinates[coordinates.length - 1];

  return (
    <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <SvgLine
            x1={PADDING}
            y1={height - PADDING}
            x2={width - PADDING}
            y2={height - PADDING}
            stroke={colors.bd}
            strokeWidth={1}
          />
          <Path d={path} stroke={colors.acc} strokeWidth={2} fill="none" />
          {last ? <Circle cx={last.x} cy={last.y} r={4} fill={colors.acc} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emptyText: { fontSize: 13, color: colors.ink3, textAlign: 'center' },
});
