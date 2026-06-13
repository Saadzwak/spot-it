// ============================================================================
// KpiCard — tuile métrique : valeur + libellé + variation vs période précédente.
// Entrée animée (fade + rise). Accent persimmon réservé à la tuile clé (ROI).
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
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';

const UP = '#1FA463';   // vert sobre (hausse favorable)

export interface KpiCardProps {
  label: string;
  value: string;
  /** variation relative (-1..+1) vs période précédente. undefined → masquée */
  deltaPct?: number;
  /** une hausse est-elle une bonne nouvelle ? (dépense → false) */
  goodWhenUp?: boolean;
  accent?: boolean;
  index?: number;
}

export function KpiCard({
  label,
  value,
  deltaPct,
  goodWhenUp = true,
  accent = false,
  index = 0,
}: KpiCardProps): React.ReactElement {
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withDelay(index * 55, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
  }, [enter, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 10 }],
  }));

  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const up = (deltaPct ?? 0) >= 0;
  const favorable = up === goodWhenUp;
  const deltaColor = accent
    ? 'rgba(255,255,255,0.92)'
    : favorable ? UP : colors.ink3;

  return (
    <Animated.View style={[styles.tile, accent && styles.tileAccent, animStyle]}>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      <View style={styles.footer}>
        <Text style={[styles.label, accent && styles.labelAccent]} numberOfLines={1}>{label}</Text>
        {hasDelta && (
          <Text style={[styles.delta, { color: deltaColor }]}>
            {up ? '▲' : '▼'} {Math.abs(Math.round((deltaPct ?? 0) * 100))}%
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    ...shadows.sm,
  },
  tileAccent: {
    backgroundColor: colors.accent,
  },
  value: {
    fontFamily: font.displayBold,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 6,
  },
  valueAccent: { color: colors.white },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink3,
  },
  labelAccent: { color: 'rgba(255,255,255,0.78)' },
  delta: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default KpiCard;
