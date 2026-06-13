import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, SpotMark, PrimaryButton } from '@/components';
import { colors, text, font } from '@/design/theme';

export default function Landing() {
  const router = useRouter();
  const go = () => router.replace('/(tabs)/discover');

  useEffect(() => {
    const t = setTimeout(go, 2800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn.duration(450)}><SpotMark size={72} /></Animated.View>
        <Animated.Text entering={FadeInDown.delay(180).duration(480)} style={styles.hi}>Bienvenue 👋</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(340).duration(480)} style={styles.title}>Ton terrain de jeu est prêt</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(480)} style={styles.sub}>
          Dis-nous ce que tu cherches — ou laisse Spot.it flairer les bons plans autour de toi.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(700).duration(480)} style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <PrimaryButton label="C’est parti" onPress={go} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  hi: { fontFamily: font.displayBold, fontSize: 18, color: colors.accentInk, letterSpacing: 0.5 },
  title: { ...text.h1, fontSize: 32, textAlign: 'center' },
  sub: { ...text.body, textAlign: 'center', maxWidth: 280 },
});
