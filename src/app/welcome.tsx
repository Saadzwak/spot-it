// Welcome / walkthrough — première chose vue. Explique Spot.it en 2 lignes + 2
// visuels, puis "Se connecter" entre directement (auth factice pour la démo).
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, PrimaryButton, Icon } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';

const IMG_A = 'https://loremflickr.com/600/700/shopping,boutique?lock=901';
const IMG_B = 'https://loremflickr.com/600/700/paris,street,store?lock=902';

export default function Welcome() {
  const router = useRouter();
  const enter = () => router.replace('/onboarding');

  return (
    <Screen padded>
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: 'center' }}>
          <SpotLogo size={30} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(150).duration(480)} style={styles.title}>
          Les meilleures offres,{'\n'}repérées autour de toi.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(320).duration(480)} style={styles.cards}>
          <View style={styles.card}>
            <Image source={{ uri: IMG_A }} style={styles.img} contentFit="cover" />
            <View style={styles.cap}><Icon name="sparkle" size={15} color={colors.accentInk} /><Text style={styles.capTxt}>Offres ciblées par l'IA</Text></View>
          </View>
          <View style={styles.card}>
            <Image source={{ uri: IMG_B }} style={styles.img} contentFit="cover" />
            <View style={styles.cap}><Icon name="pin" size={15} color={colors.accentInk} /><Text style={styles.capTxt}>À deux pas de toi</Text></View>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.delay(500).duration(480)} style={{ gap: 8 }}>
          <PrimaryButton label="Se connecter" onPress={enter} icon={<Icon name="arrowUp" size={18} color="#fff" />} />
          <Text style={styles.note}>Démo — aucun mot de passe requis.</Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 24, paddingBottom: 16, gap: 22 },
  title: { fontFamily: font.displayBold, fontSize: 30, lineHeight: 36, color: colors.ink, textAlign: 'center', letterSpacing: -0.6 },
  cards: { flexDirection: 'row', gap: 14 },
  card: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card },
  img: { width: '100%', height: 200 },
  cap: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  capTxt: { fontFamily: font.bodySemiBold, fontSize: 13, color: colors.ink, flexShrink: 1 },
  note: { ...text.caption, textAlign: 'center' },
});
