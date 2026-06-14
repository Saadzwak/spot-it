// ============================================================================
// Funnel — entonnoir de conversion (impressions → clics → visites → achats).
// Barres horizontales en Views ; largeur animée en px (mesurée via onLayout).
// Taux de passage affiché entre chaque étape.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '@/design/tokens';
import { font } from '@/design/theme';

export interface FunnelStep { label: string; value: number }

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + ' k';
  return String(n);
}

function Row({
  step, ratioToTop, containerW, index,
}: {
  step: FunnelStep; ratioToTop: number; containerW: number; index: number;
}): React.ReactElement {
  const w = useSharedValue(0);
  const target = Math.max(6, ratioToTop * containerW);

  useEffect(() => {
    w.value = withDelay(index * 90, withTiming(target, { duration: 560, easing: Easing.out(Easing.cubic) }));
  }, [w, target, index]);

  const animStyle = useAnimatedStyle(() => ({ width: w.value }));
  // L'étape 1 (impressions) est la plus claire, dégradé d'opacité ensuite.
  const tint = 0.35 + 0.65 * (1 - index / 4);

  return (
    <View style={styles.rowWrap}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabel}>{step.label}</Text>
        <Text style={styles.rowValue}>{fmt(step.value)}</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFg, { opacity: tint }, animStyle]} />
      </View>
    </View>
  );
}

export interface FunnelProps { steps: FunnelStep[] }

export function Funnel({ steps }: FunnelProps): React.ReactElement {
  const [containerW, setContainerW] = useState(0);
  const top = steps[0]?.value || 1;

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value || 1 : null;
        const stepRate = prev ? step.value / prev : null;
        return (
          <View key={step.label}>
            {containerW > 0 && (
              <Row step={step} ratioToTop={step.value / top} containerW={containerW} index={i} />
            )}
            {stepRate !== null && (
              <Text style={styles.stepRate}>
                ↳ {Math.round(stepRate * 100)}% passent à l’étape suivante
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  rowWrap: { marginBottom: 2 },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  rowLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  rowValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
  },
  barBg: {
    height: 30,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  barFg: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  stepRate: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 2,
  },
});

export default Funnel;
