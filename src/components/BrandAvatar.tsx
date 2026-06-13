// ============================================================================
// BrandAvatar — gradient circle with brand initials
// Ports design-ref/spot-it/app/ui.jsx → BrandAvatar
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Offer } from '@/types/contracts';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

export interface BrandAvatarProps {
  offer: Offer;
  size?: number;
  ring?: boolean;
}

function BrandAvatar({ offer, size = 44, ring = false }: BrandAvatarProps): React.ReactElement {
  const initials = offer.brand
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        ring && styles.ring,
      ]}
    >
      <LinearGradient
        colors={offer.grad as [string, string]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
      <Text
        style={[
          styles.initials,
          {
            color: offer.ink,
            fontFamily: font.displaySemiBold,
            fontSize: size * 0.34,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ring: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    // White ring approximated by border + surface color
    borderWidth: 3,
    borderColor: colors.surface,
  },
  initials: {
    fontWeight: '600',
    letterSpacing: 0.02 * 44,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    position: 'relative',
  },
});

export { BrandAvatar };
export default BrandAvatar;
