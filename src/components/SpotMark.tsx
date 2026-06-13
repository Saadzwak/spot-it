// ============================================================================
// SpotMark — luminous point + concentric ripple + soft glow
// Animated with reanimated 4: spotRipple 2.4s, spotGlow
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, motion } from '@/design/tokens';

export interface SpotMarkProps {
  size?: number;
  color?: string;
  pulse?: boolean;
}

function SpotMark({ size = 22, color = colors.accent, pulse = true }: SpotMarkProps): React.ReactElement {
  // Ripple: scale 0.6→2.2, opacity 0.7→0
  const rippleScale = useSharedValue(0.6);
  const rippleOpacity = useSharedValue(0.7);
  // Glow: opacity 0.14↔0.32, scale 0.9↔1.15
  const glowOpacity = useSharedValue(0.14);
  const glowScale = useSharedValue(0.9);

  useEffect(() => {
    if (!pulse) return;
    const dur = motion.spotPulse; // 2400ms

    rippleScale.value = withRepeat(
      withTiming(2.2, { duration: dur, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    rippleOpacity.value = withRepeat(
      withTiming(0, { duration: dur, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.32, { duration: dur / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.14, { duration: dur / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: dur / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: dur / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const dotSize = size * 0.42;
  const glowSize = size * 0.95;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Ripple ring */}
      <Animated.View
        style={[
          styles.absolute,
          rippleStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: color,
          },
        ]}
      />
      {/* Soft glow blur approximation */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      {/* Core dot */}
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: size * 0.5,
            elevation: 4,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    // blur approximated via opacity animation + low-opacity fill
  },
  dot: {
    position: 'absolute',
  },
});

export { SpotMark };
export default SpotMark;
