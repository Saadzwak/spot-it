// ============================================================================
// BarChart — barres en pures Views (aucune lib). Croissance animée (timing),
// décalage en cascade. Labels masqués quand la série est dense (30j).
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + ' k';
  return String(n);
}

function Bar({
  targetPx, label, value, index, dense,
}: {
  targetPx: number; label: string; value: number; index: number; dense: boolean;
}): React.ReactElement {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 26, withTiming(targetPx, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [h, targetPx, index]);

  const animStyle = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <View style={styles.col}>
      <Animated.View style={[styles.fill, dense && styles.fillDense, animStyle]} />
      {!dense && (
        <>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={styles.barValue}>{fmt(value)}</Text>
        </>
      )}
      {dense && label !== '' && <Text style={styles.barLabelDense}>{label}</Text>}
    </View>
  );
}

export interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function BarChart({ data, height = 150 }: BarChartProps): React.ReactElement {
  const max = Math.max(...data.map((d) => d.value), 1);
  const dense = data.length > 12;
  // Réserve la place des labels sous les barres (moins dense → plus de place).
  const barArea = dense ? height - 14 : height - 26;

  return (
    <View style={[styles.wrap, { height }]}>
      {data.map((d, i) => (
        <Bar
          key={i}
          index={i}
          dense={dense}
          label={d.label}
          value={d.value}
          targetPx={Math.max(3, (d.value / max) * barArea)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  fill: {
    width: '100%',
    maxWidth: 30,
    backgroundColor: colors.accent,
    borderRadius: 7,
    minHeight: 3,
  },
  fillDense: {
    borderRadius: 3,
    maxWidth: 12,
  },
  barLabel: {
    fontFamily: font.body,
    fontSize: 10,
    color: colors.ink3,
    marginTop: 6,
  },
  barValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    color: colors.ink2,
    marginTop: 1,
  },
  barLabelDense: {
    fontFamily: font.body,
    fontSize: 9,
    color: colors.ink3,
    marginTop: 4,
  },
});

export default BarChart;
