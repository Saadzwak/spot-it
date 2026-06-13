// ============================================================================
// DistancePill — walk icon + distance + walk time
// Ports design-ref/spot-it/app/ui.jsx → DistancePill
// Uses offer.distanceM (computed) + offer.walkMin (not offer.walk/distanceLabel)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from './Icon';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';
import type { Offer } from '@/types/contracts';

export interface DistancePillProps {
  offer: Offer;
  dark?: boolean;
}

function formatDistance(distanceM?: number): string {
  if (distanceM == null) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function DistancePill({ offer, dark = false }: DistancePillProps): React.ReactElement {
  const distLabel = formatDistance(offer.distanceM);
  const walkMin = offer.walkMin;

  const label = [distLabel, walkMin != null ? `${walkMin} min` : null].filter(Boolean).join(' · ');

  const iconColor = dark ? '#fff' : colors.ink;
  const textColor = dark ? '#fff' : colors.ink;

  if (dark) {
    return (
      <BlurView intensity={40} tint="dark" style={styles.pillBlur}>
        <Icon name="walk" size={14} color={iconColor} strokeWidth={1.6} />
        {label ? <Text style={[styles.label, { color: textColor }]}>{label}</Text> : null}
      </BlurView>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: colors.canvas }]}>
      <Icon name="walk" size={14} color={iconColor} strokeWidth={1.6} />
      {label ? <Text style={[styles.label, { color: textColor }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 11,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pillBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 11,
    borderRadius: 999,
    overflow: 'hidden',
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontWeight: '600',
    fontSize: 13,
  },
});

export { DistancePill };
export default DistancePill;
