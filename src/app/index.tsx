import { Redirect, Link, type Href } from 'expo-router';
import { Platform, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { SpotLogo, Icon } from '@/components';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';

export default function Index() {
  const onboarded = useStore((s) => s.onboarded);

  // Natif : comportement inchangé (app shopper).
  if (Platform.OS !== 'web') {
    return <Redirect href={onboarded ? '/(tabs)/discover' : '/onboarding'} />;
  }

  // Web : page de choix shopper / magasin.
  return <WebChoice onboarded={onboarded} />;
}

function WebChoice({ onboarded }: { onboarded: boolean }) {
  const { width } = useWindowDimensions();
  const row = width >= 720;

  const shopperHref = (onboarded ? '/(tabs)/discover' : '/onboarding') as Href;
  const merchantHref = '/(merchant)/dashboard' as Href;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <SpotLogo size={30} />
        <Text style={styles.title}>Bienvenue sur Spot.it</Text>
        <Text style={styles.sub}>Comment veux-tu continuer ?</Text>

        <View style={[styles.cards, row && styles.cardsRow]}>
          <ChoiceCard
            href={shopperHref}
            icon="profile"
            title="Découvrir les offres"
            desc="Côté shopper — swipe, carte, alertes de proximité."
            cta="Entrer"
          />
          <ChoiceCard
            href={merchantHref}
            icon="sliders"
            title="Espace magasin"
            desc="Tableau de bord, audience, catalogue et campagnes."
            cta="Gérer ma boutique"
            accent
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ChoiceCard({
  href, icon, title, desc, cta, accent,
}: {
  href: Href;
  icon: 'profile' | 'sliders';
  title: string;
  desc: string;
  cta: string;
  accent?: boolean;
}) {
  // Link → vrai <a href> sur web (clic/navigation fiables), onPress sur natif.
  return (
    <Link href={href} replace asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
          <Icon name={icon} size={22} color={accent ? colors.white : colors.ink} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
        <View style={[styles.cardCta, accent && styles.cardCtaAccent]}>
          <Text style={[styles.cardCtaLabel, accent && styles.cardCtaLabelAccent]}>{cta}</Text>
          <Icon name="chevronRight" size={16} color={accent ? colors.white : colors.ink} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 24 },
  inner: { width: '100%', maxWidth: 760, alignItems: 'center', gap: 6 },
  title: {
    fontFamily: font.displayBold,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.ink,
    marginTop: 18,
    textAlign: 'center',
  },
  sub: { fontFamily: font.body, fontSize: 15, color: colors.ink3, marginBottom: 12 },
  cards: { width: '100%', gap: 14, marginTop: 12 },
  cardsRow: { flexDirection: 'row' },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 24,
    gap: 8,
    ...shadows.card,
  },
  cardPressed: { opacity: 0.94 },
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  iconWrapAccent: { backgroundColor: colors.accent },
  cardTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.ink,
  },
  cardDesc: { fontFamily: font.body, fontSize: 14, color: colors.ink3, lineHeight: 20 },
  cardCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  cardCtaAccent: { backgroundColor: colors.accent },
  cardCtaLabel: { fontFamily: font.bodySemiBold, fontSize: 14, fontWeight: '600', color: colors.ink },
  cardCtaLabelAccent: { color: colors.white },
});
