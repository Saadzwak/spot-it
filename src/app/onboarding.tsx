import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, SpotMark, ProximityRing, PrimaryButton, GhostButton, Toggle, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { TASTE_TAGS, WALLET_ARCHETYPES, BUYING_STYLES } from '@/data/onboarding';
import { ensureLocationPermission } from '@/geo/proximity';

const uniq = (a: string[]) => Array.from(new Set(a));

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0); // 0 goûts · 1 porte-monnaie · 2 style · 3 localisation
  const [tastes, setTastes] = useState<string[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [locationOn, setLocationOn] = useState(true);

  const finish = async () => {
    const picks = uniq([
      ...tastes.flatMap((id) => TASTE_TAGS.find((t) => t.id === id)?.picks ?? []),
      ...(WALLET_ARCHETYPES.find((a) => a.id === wallet)?.picks ?? []),
      ...(BUYING_STYLES.find((a) => a.id === style)?.picks ?? []),
    ]);
    if (locationOn) { try { await ensureLocationPermission(); } catch { /* ignore */ } }
    completeOnboarding(picks, undefined, { location: locationOn, share_data: false });
    router.replace('/landing');
  };

  return (
    <Screen padded>
      <View style={styles.head}>
        <SpotLogo size={24} />
        <View style={styles.dots}>{[0, 1, 2, 3].map((i) => <View key={i} style={[styles.dot, i === step && styles.dotActive]} />)}</View>
      </View>

      <View style={styles.body}>
        {step === 0 && (
          <>
            <Text style={text.h1}>Tes envies du moment</Text>
            <Text style={styles.sub}>Choisis ce qui te ressemble.</Text>
            <View style={styles.tags}>
              {TASTE_TAGS.map((t) => {
                const on = tastes.includes(t.id);
                return (
                  <Pressable key={t.id} onPress={() => setTastes((s) => on ? s.filter((x) => x !== t.id) : [...s, t.id])} style={[styles.tag, on && styles.tagOn]}>
                    <Text style={styles.tagEmoji}>{t.emoji}</Text>
                    <Text style={[styles.tagLabel, on && styles.tagLabelOn]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={text.h1}>Ton rapport à la dépense</Text>
            <Text style={styles.sub}>Sans jugement — ça nous aide à viser juste.</Text>
            {WALLET_ARCHETYPES.map((a) => <ArchCard key={a.id} a={a} on={wallet === a.id} onPress={() => setWallet(a.id)} />)}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={text.h1}>Comment tu achètes ?</Text>
            <Text style={styles.sub}>Ton style de shopping, en une phrase.</Text>
            {BUYING_STYLES.map((a) => <ArchCard key={a.id} a={a} on={style === a.id} onPress={() => setStyle(a.id)} />)}
          </>
        )}

        {step === 3 && (
          <View style={styles.locHero}>
            <View style={styles.ringWrap}>
              <ProximityRing size={150} />
              <View style={styles.ringCenter}><SpotMark size={40} /></View>
            </View>
            <Text style={styles.locTitle}>Les offres, juste autour de toi</Text>
            <Text style={styles.locSub}>Active ta position pour voir les bons plans proches et être prévenu à ~5 min d’un magasin partenaire.</Text>
            <View style={styles.locToggle}>
              <Toggle value={locationOn} onValueChange={setLocationOn} label="Activer la localisation" sublabel="Tu gardes le contrôle, modifiable à tout moment" />
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step > 0 ? <GhostButton label="Retour" onPress={() => setStep((s) => s - 1)} /> : <View style={{ flex: 1 }} />}
        {step < 3 ? (
          <PrimaryButton label={step === 0 ? 'Continuer' : 'Suivant'} onPress={() => setStep((s) => s + 1)} />
        ) : (
          <PrimaryButton label="Commencer" onPress={finish} icon={<Icon name="check" size={18} color="#fff" />} />
        )}
      </View>
    </Screen>
  );
}

function ArchCard({ a, on, onPress }: { a: { emoji: string; label: string; sub: string }; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.arch, on && styles.archOn]}>
      <Text style={styles.archEmoji}>{a.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.archLabel, on && styles.archLabelOn]}>{a.label}</Text>
        <Text style={styles.archSub}>{a.sub}</Text>
      </View>
      {on ? <Icon name="check" size={20} color={colors.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 14 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  body: { flex: 1, gap: 12 },
  sub: { ...text.body, marginBottom: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.sm },
  tagOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  tagEmoji: { fontSize: 16 },
  tagLabel: { fontFamily: font.bodySemiBold, fontSize: 14, color: colors.ink },
  tagLabelOn: { color: colors.accentInk },
  arch: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.sm },
  archOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  archEmoji: { fontSize: 26 },
  archLabel: { fontFamily: font.displaySemiBold, fontSize: 17, color: colors.ink },
  archLabelOn: { color: colors.accentInk },
  archSub: { fontFamily: font.body, fontSize: 13, color: colors.ink3, marginTop: 2 },
  // étape localisation — visuellement distincte
  locHero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  ringWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  locTitle: { fontFamily: font.displayBold, fontSize: 26, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  locSub: { ...text.body, textAlign: 'center', maxWidth: 300 },
  locToggle: { alignSelf: 'stretch', marginTop: 8, padding: 16, borderRadius: radius.card, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16 },
});
