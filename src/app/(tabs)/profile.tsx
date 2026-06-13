import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, SectionTitle, Toggle, GhostButton, Card } from '@/components';
import { colors, font, text, radius, shadows, categories } from '@/design/theme';
import { useStore } from '@/store/useStore';

function labelForFeature(key: string): string {
  if (key === 'bias') return 'Base';
  const [kind, val] = key.split(':');
  if (kind === 'cat') return (categories as any)[val]?.label ?? val;
  if (kind === 'brand') return val.charAt(0).toUpperCase() + val.slice(1).replace(/-/g, ' ');
  if (kind === 'price_band') return `${val.replace('-', '–')} €`;
  if (kind === 'offer_type') {
    const m: Record<string, string> = { discount: 'Remises', gift: 'Cadeaux', voucher: 'Bons d’achat', exclusive: 'Exclusivités', bogo: '2 pour 1' };
    return m[val] ?? val;
  }
  if (kind === 'dist_band') return val === '<400' ? 'Très proche' : `À ${val} m`;
  return key;
}

export default function ProfileScreen() {
  const router = useRouter();
  const taste = useStore((s) => s.taste);
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  const reset = useStore((s) => s.reset);
  const wishlist = useStore((s) => s.wishlist);
  const swipeCount = useStore((s) => s.swipeCount);

  const top = Object.entries(taste)
    .filter(([k, v]) => k !== 'bias' && v > 0.001)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const max = top.length ? top[0][1] : 1;

  const onReset = () => { reset(); router.replace('/onboarding'); };

  return (
    <Screen scroll padded>
      <View style={styles.head}>
        <SpotLogo size={24} />
        <Text style={styles.stat}>{swipeCount} swipes · {wishlist.length} ❤</Text>
      </View>

      <SectionTitle style={{ marginTop: 8 }}>Ton profil de goûts</SectionTitle>
      <Card style={styles.card}>
        {top.length === 0 ? (
          <Text style={text.body}>Swipe quelques offres pour voir ton profil s’affiner ici en direct.</Text>
        ) : (
          top.map(([k, v]) => (
            <View key={k} style={styles.barRow}>
              <Text style={styles.barLabel} numberOfLines={1}>{labelForFeature(k)}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(8, (v / max) * 100)}%` }]} />
              </View>
            </View>
          ))
        )}
      </Card>

      <SectionTitle style={{ marginTop: 24 }}>Confidentialité & données</SectionTitle>
      <Card style={styles.card}>
        <Toggle
          value={consent.location}
          onValueChange={(v) => setConsent({ location: v })}
          label="Localisation"
          sublabel="Offres proches + alertes de proximité"
        />
        <View style={styles.sep} />
        <Toggle
          value={consent.personalization}
          onValueChange={(v) => setConsent({ personalization: v })}
          label="Personnalisation"
          sublabel="Apprendre de mes swipes pour de meilleures offres"
        />
        <View style={styles.sep} />
        <Toggle
          value={consent.share_data}
          onValueChange={(v) => setConsent({ share_data: v })}
          label="Partager mes données d’usage"
          sublabel="Désactivé par défaut"
        />
      </Card>

      <View style={{ marginTop: 24, gap: 10 }}>
        <GhostButton label="Réinitialiser mon profil" onPress={onReset} />
        <Text style={styles.note}>RGPD : tes données restent sur l’appareil en mode démo. Le partage est désactivé par défaut.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  stat: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.ink3 },
  card: { padding: 16, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  barLabel: { width: 100, fontFamily: font.bodySemiBold, fontSize: 13, color: colors.ink },
  barTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.canvas, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 999, backgroundColor: colors.accent },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  note: { ...text.caption, lineHeight: 16 },
});
