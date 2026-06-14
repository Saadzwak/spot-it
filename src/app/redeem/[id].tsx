// Écran QR "En profiter" — l'utilisateur a accepté l'offre : on génère un QR (+ code)
// à présenter en caisse. Sert à identifier les offres présentées qui ont abouti.
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon, PrimaryButton, GhostButton } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { track } from '@/lib/track';

function makeCode(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `SPOT-${h.toString(36).toUpperCase().slice(0, 5).padStart(5, '0')}`;
}

export default function Redeem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const offer = useStore((s) => s.offers).find((o) => o.id === id);

  useEffect(() => { if (offer) track('qr_generated', { offerId: offer.id, brand: offer.brand }); }, [offer]);

  if (!offer) {
    return (
      <View style={styles.missing}>
        <Text style={text.body}>Offre introuvable.</Text>
        <PrimaryButton label="Retour" onPress={() => router.back()} />
      </View>
    );
  }
  const code = makeCode(offer.id);
  const value = `spotit://redeem?offer=${offer.id}&code=${code}`;

  const addToWallet = async () => {
    track('add_to_wallet', { offerId: offer.id });
    try { await Share.share({ message: `Mon bon Spot.it · ${offer.brand} — ${offer.title}\nCode : ${code}`, url: value }); } catch { /* annulé */ }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}><Icon name="chevronLeft" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.htitle}>Ton bon</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <Text style={styles.brand}>{offer.brand}</Text>
        <Text style={styles.offer}>{offer.title}</Text>
        <View style={styles.qrCard}>
          <QRCode value={value} size={208} color={colors.ink} backgroundColor="#ffffff" />
        </View>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.hint}>Présente ce QR (ou le code) en caisse pour profiter de l'offre.</Text>
        <View style={styles.cta}>
          <GhostButton label="Ajouter à Apple Wallet" onPress={addToWallet} icon={<Icon name="plus" size={18} color={colors.ink} />} />
          <PrimaryButton label="C'est noté" onPress={() => router.replace('/(tabs)/discover')} icon={<Icon name="check" size={18} color="#fff" />} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  htitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  brand: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink, textAlign: 'center' },
  offer: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.accentInk, textAlign: 'center' },
  qrCard: { backgroundColor: '#fff', padding: 22, borderRadius: radius.card, marginTop: 8, ...shadows.card },
  code: { fontFamily: font.bodyBold, fontSize: 22, letterSpacing: 3, color: colors.ink, marginTop: 6 },
  hint: { ...text.body, textAlign: 'center', maxWidth: 280 },
  cta: { alignSelf: 'stretch', marginTop: 12, gap: 10 },
});
