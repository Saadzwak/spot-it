import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, SpotMark, PrimaryButton } from '@/components';
import { colors, text, font } from '@/design/theme';
import { useRealLocation } from '@/geo/useLocation';

export default function Landing() {
  const router = useRouter();
  useRealLocation(); // ancre les offres autour de toi pendant l'animation
  const go = () => router.replace('/(tabs)/discover');

  useEffect(() => {
    const t = setTimeout(go, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn.duration(450)}><SpotMark size={76} /></Animated.View>
        <Animated.Text entering={FadeInDown.delay(180).duration(460)} style={styles.hi}>Bienvenue 👋</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(340).duration(460)} style={styles.title}>C'est prêt.</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(480).duration(460)} style={styles.sub}>Les meilleures offres, juste autour de toi.</Animated.Text>
        <Animated.View entering={FadeInDown.delay(680).duration(460)} style={{ marginTop: 14, alignSelf: 'stretch' }}>
          <PrimaryButton label="C'est parti" onPress={go} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  hi: { fontFamily: font.displayBold, fontSize: 18, color: colors.accentInk, letterSpacing: 0.5 },
  title: { ...text.h1, fontSize: 38, textAlign: 'center' },
  sub: { ...text.body, textAlign: 'center', maxWidth: 260 },
});
