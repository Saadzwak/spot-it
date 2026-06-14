// Welcome / walkthrough — première chose vue. Épurée : une accroche forte + 2
// visuels + "Se connecter" (auth factice pour la démo). La feature notif est mise
// en valeur plus tard, en contexte (pop-up après la 1re recherche).
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, PrimaryButton, Icon } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { track } from '@/lib/track';

const IMG_A = 'https://loremflickr.com/600/800/sneakers,shopping?lock=901';
const IMG_B = 'https://loremflickr.com/600/800/lille,store,shop?lock=902';

export default function Welcome() {
  const router = useRouter();
  const enter = () => { track('login'); router.replace('/onboarding'); };

  return (
    <Screen padded>
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: 'center' }}>
          <SpotLogo size={32} />
        </Animated.View>

        <View style={styles.middle}>
          <Animated.Text entering={FadeInDown.delay(150).duration(540)} style={styles.title}>
            Comprend et anticipe{'\n'}ton prochain achat,{'\n'}juste autour de toi.
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(380).duration(540)} style={styles.cards}>
            <View style={styles.card}><Image source={{ uri: IMG_A }} style={styles.img} contentFit="cover" transition={300} /></View>
            <View style={styles.card}><Image source={{ uri: IMG_B }} style={styles.img} contentFit="cover" transition={300} /></View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(560).duration(540)} style={{ gap: 8 }}>
          <PrimaryButton label="Se connecter" onPress={enter} icon={<Icon name="arrowUp" size={18} color="#fff" />} />
          <Text style={styles.note}>Démo — aucun mot de passe requis.</Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 24, paddingBottom: 20 },
  middle: { flex: 1, justifyContent: 'center', gap: 30 },
  title: { fontFamily: font.displayBold, fontSize: 33, lineHeight: 39, color: colors.ink, textAlign: 'center', letterSpacing: -0.8 },
  cards: { flexDirection: 'row', gap: 14 },
  card: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card },
  img: { width: '100%', height: 196 },
  note: { ...text.caption, textAlign: 'center' },
});
