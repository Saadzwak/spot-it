// ============================================================================
// ProximityRing — pulsing ring for map "spot" pin
// Ports proxPulse animation: 0%,100% scale(1) opacity(1); 50% scale(1.04) opacity(0.85)
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, motion } from '@/design/tokens';

export interface ProximityRingProps {
  size: number;
}

function ProximityRing({ size }: ProximityRingProps): React.ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const dur = motion.proxPulse; // 3500ms
    const half = dur / 2;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: half, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: half, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: half, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: half, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(249,83,46,0.08)',
  },
});

export { ProximityRing };
export default ProximityRing;
