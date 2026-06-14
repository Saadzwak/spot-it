// MagicLoader — moment "l'IA fait sa magie". Pas de radar : SpotMark qui pulse +
// une vague de points animés (cascade) + texte. Vivant et créatif.
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing, FadeIn } from 'react-native-reanimated';
import { SpotMark } from './SpotMark';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

function Dot({ delay }: { delay: number }) {
  const s = useSharedValue(0.6);
  useEffect(() => {
    s.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 380, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 380, easing: Easing.inOut(Easing.ease) }),
      ), -1, false));
  }, [s, delay]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.45 + (s.value - 0.6) * 0.7 }));
  return <Animated.View style={[styles.dot, st]} />;
}

export function MagicLoader({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <SpotMark size={52} />
      <View style={styles.dots}>
        {[0, 110, 220, 330, 440].map((d) => <Dot key={d} delay={d} />)}
      </View>
      <Animated.Text entering={FadeIn.duration(400)} style={styles.label}>{label}</Animated.Text>
      <Animated.Text entering={FadeIn.delay(250).duration(400)} style={styles.sub}>✨ Spot.it fait sa magie</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 28 },
  dots: { flexDirection: 'row', gap: 10, height: 16, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent },
  label: { fontFamily: font.displaySemiBold, fontSize: 20, color: colors.ink, textAlign: 'center', maxWidth: 290 },
  sub: { fontFamily: font.body, fontSize: 14, color: colors.ink3 },
});

export default MagicLoader;
