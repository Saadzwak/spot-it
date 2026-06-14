// Welcome / walkthrough — première chose vue. Explique Spot.it en 2 lignes + 2
// visuels + 3 étapes claires, puis "Se connecter" entre directement (auth factice).
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, PrimaryButton, Icon } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { track } from '@/lib/track';

const IMG_A = 'https://loremflickr.com/600/700/shopping,sneakers?lock=901';
const IMG_B = 'https://loremflickr.com/600/700/lille,boutique,store?lock=902';

const STEPS: { icon: any; title: string; sub: string }[] = [
  { icon: 'search', title: 'Dis ton envie', sub: 'Un mot suffit — « un cadeau pour papa »' },
  { icon: 'sparkle', title: "L'IA choisit pour toi", sub: 'Les bonnes offres, triées, près de toi' },
  { icon: 'nav', title: 'File en boutique', sub: 'Itinéraire + QR à scanner en caisse' },
];

export default function Welcome() {
  const router = useRouter();
  const enter = () => { track('login'); router.replace('/onboarding'); };

  return (
    <Screen padded>
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: 'center' }}>
          <SpotLogo size={30} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(140).duration(460)} style={styles.title}>
          Tes meilleures offres,{'\n'}repérées autour de toi.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(460)} style={styles.cards}>
          <View style={styles.card}>
            <Image source={{ uri: IMG_A }} style={styles.img} contentFit="cover" transition={300} />
          </View>
          <View style={styles.card}>
            <Image source={{ uri: IMG_B }} style={styles.img} contentFit="cover" transition={300} />
          </View>
        </Animated.View>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <Animated.View key={s.title} entering={FadeInDown.delay(420 + i * 130).duration(440)} style={styles.step}>
              <View style={styles.badge}><Icon name={s.icon} size={18} color={colors.accentInk} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.delay(840).duration(460)} style={{ gap: 8 }}>
          <PrimaryButton label="Se connecter" onPress={enter} icon={<Icon name="arrowUp" size={18} color="#fff" />} />
          <Text style={styles.note}>Démo — aucun mot de passe requis.</Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 22, paddingBottom: 16, gap: 18 },
  title: { fontFamily: font.displayBold, fontSize: 29, lineHeight: 35, color: colors.ink, textAlign: 'center', letterSpacing: -0.6 },
  cards: { flexDirection: 'row', gap: 14 },
  card: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card },
  img: { width: '100%', height: 158 },
  steps: { gap: 12, marginTop: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontFamily: font.displaySemiBold, fontSize: 16, color: colors.ink, letterSpacing: -0.2 },
  stepSub: { fontFamily: font.body, fontSize: 13, color: colors.ink3, marginTop: 1 },
  note: { ...text.caption, textAlign: 'center' },
});
