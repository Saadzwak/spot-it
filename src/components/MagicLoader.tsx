// MagicLoader — moment "l'IA fait sa magie" : anneau accent qui tourne autour du
// SpotMark pulsant + texte qui apparaît. Utilisé pendant les appels Claude.
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { SpotMark } from './SpotMark';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

export function MagicLoader({ label }: { label: string }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);
  }, [rot]);
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <View style={styles.wrap}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ring]} />
        <SpotMark size={42} />
      </View>
      <Animated.Text entering={FadeIn.duration(400)} style={styles.label}>{label}</Animated.Text>
      <Animated.Text entering={FadeIn.delay(250).duration(400)} style={styles.sub}>✨ Spot.it fait sa magie</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28 },
  center: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'transparent', borderTopColor: colors.accent, borderRightColor: colors.accent,
  },
  label: { fontFamily: font.displaySemiBold, fontSize: 20, color: colors.ink, textAlign: 'center', maxWidth: 280 },
  sub: { fontFamily: font.body, fontSize: 14, color: colors.ink3 },
});

export default MagicLoader;
