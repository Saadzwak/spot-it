// ============================================================================
// DistributionBars — répartition agrégée (catégorie / archétype / tranche prix).
// Rangées avec libellé, %, et barre proportionnelle animée. Aucune donnée perso.
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

export interface DistItem {
  id: string;
  label: string;
  pct: number;        // 0..1
  color?: string;     // teinte de la barre (défaut accent)
  emoji?: string;
}

function Bar({
  item, trackW, index,
}: {
  item: DistItem; trackW: number; index: number;
}): React.ReactElement {
  const w = useSharedValue(0);
  const target = Math.max(4, item.pct * trackW);
  useEffect(() => {
    w.value = withDelay(index * 70, withTiming(target, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [w, target, index]);
  const animStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <Animated.View
      style={[styles.fill, { backgroundColor: item.color ?? colors.accent }, animStyle]}
    />
  );
}

export interface DistributionBarsProps { items: DistItem[] }

export function DistributionBars({ items }: DistributionBarsProps): React.ReactElement {
  const [trackW, setTrackW] = useState(0);

  return (
    <View style={styles.wrap}>
      {items.map((item, i) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.head}>
            <Text style={styles.label} numberOfLines={1}>
              {item.emoji ? `${item.emoji}  ` : ''}{item.label}
            </Text>
            <Text style={styles.pct}>{Math.round(item.pct * 100)}%</Text>
          </View>
          <View
            style={styles.track}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && w !== trackW) setTrackW(w);
            }}
          >
            {trackW > 0 && <Bar item={item} trackW={trackW} index={i} />}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: { gap: 6 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    flex: 1,
    fontFamily: font.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  pct: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink2,
  },
  track: {
    height: 10,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

export default DistributionBars;
