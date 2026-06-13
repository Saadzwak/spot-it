import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotMark, PrimaryButton } from '@/components';
import { colors, text, font } from '@/design/theme';
import { useStore } from '@/store/useStore';

export default function Landing() {
  const router = useRouter();
  const offers = useStore((s) => s.offers);
  const intent = useStore((s) => s.intent);
  const near = offers.filter((o) => (o.distanceM ?? 9999) <= 1500).length || offers.length;

  const go = () => router.replace('/(tabs)/map');
  useEffect(() => {
    const t = setTimeout(go, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <View style={styles.wrap}>
        <SpotMark size={64} />
        <Text style={styles.title}>Ton terrain de jeu est prêt</Text>
        <Text style={styles.count}>{near}</Text>
        <Text style={styles.sub}>
          {intent ? `offres analysées pour « ${intent} » près de toi` : 'offres repérées près de toi, triées pour ton profil'}
        </Text>
        <View style={{ height: 8 }} />
        <PrimaryButton label="Voir la carte" onPress={go} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  title: { ...text.h1, textAlign: 'center' },
  count: { fontFamily: font.displayBold, fontSize: 64, color: colors.accent, lineHeight: 68 },
  sub: { ...text.body, textAlign: 'center', maxWidth: 260, marginTop: -8 },
});
