// ============================================================================
// BrandTile — duotone editorial tile with wordmark, vignette, grain overlay
// Ports design-ref/spot-it/app/ui.jsx → BrandTile
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import type { Offer } from '@/types/contracts';
import { radius } from '@/design/tokens';

export interface BrandTileProps {
  offer: Offer;
  rounded?: number;
  showMark?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Convert a CSS-style 150deg linear-gradient to start/end points for expo-linear-gradient
// 150deg ≈ start top-left, end bottom-right (slightly more to bottom)
const GRAD_START = { x: 0.1, y: 0 };
const GRAD_END = { x: 0.9, y: 1 };

function BrandTile({ offer, rounded = radius.card, showMark = true, style, children }: BrandTileProps): React.ReactElement {
  const w = offer.wordmark ?? {};
  const isSerif = w.serif === true;
  const fontFamily = isSerif ? 'Georgia' : undefined; // system serif fallback; actual Clash Display loaded by theme
  const wordText = w.text ?? offer.brand;

  return (
    <View style={[styles.container, { borderRadius: rounded }, style]}>
      {/* Background duotone gradient */}
      <LinearGradient
        colors={offer.grad as [string, string]}
        start={GRAD_START}
        end={GRAD_END}
        style={StyleSheet.absoluteFill}
      />

      {/* Top radial highlight — approximated with LinearGradient from top */}
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'transparent']}
        start={{ x: 0.28, y: 0 }}
        end={{ x: 0.9, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.34)']}
        start={{ x: 0, y: 0.38 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Circle motif watermark (top-right) */}
      {showMark && (
        <View style={styles.circleMotifWrap} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
            <Circle
              cx="214"
              cy="-24"
              r="116"
              fill="none"
              stroke={offer.ink}
              strokeWidth="1.5"
              opacity={0.12}
            />
          </Svg>
        </View>
      )}

      {/* Wordmark */}
      <View style={styles.wordmarkWrap} pointerEvents="none">
        <Text
          style={[
            styles.wordmark,
            {
              color: offer.ink,
              fontFamily: fontFamily,
              fontWeight: w.weight != null ? String(w.weight) as '400' | '500' | '600' | '700' : '500',
              fontStyle: w.italic ? 'italic' : 'normal',
              fontSize: w.size ?? 26,
              letterSpacing: w.spacing ?? 2,
              textTransform: isSerif ? 'none' : 'uppercase',
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {wordText}
        </Text>
      </View>

      {/* Grain overlay — low-opacity semi-transparent pattern (mixBlendMode not supported in RN) */}
      <View style={[StyleSheet.absoluteFill, styles.grain]} pointerEvents="none" />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  circleMotifWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  wordmarkWrap: {
    position: 'absolute',
    left: 22,
    bottom: 20,
    right: 22,
  },
  wordmark: {
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 14,
  },
  // Grain: approximate a faint noise texture via semi-transparent dots pattern
  // RN cannot render SVG filter noise or use mixBlendMode:overlay on a View,
  // so we approximate with low-opacity white overlay for the film feel.
  grain: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    opacity: 0.5,
  },
});

export { BrandTile };
export default BrandTile;
