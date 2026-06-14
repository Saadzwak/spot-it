import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { ensureNotifPermission } from '@/geo/notify';
import { Screen, SpotLogo, SpotMark, ProximityRing, PrimaryButton, GhostButton, Toggle, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { TASTE_TAGS, WALLET_ARCHETYPES, BUYING_STYLES } from '@/data/onboarding';

const uniq = (a: string[]) => Array.from(new Set(a));

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const setUserLoc = useStore((s) => s.setUserLoc);

  const [step, setStep] = useState(0); // 0 goûts · 1 porte-monnaie · 2 style · 3 localisation
  const [tastes, setTastes] = useState<string[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'denied'>('idle');

  const finish = (withLocation: boolean) => {
    const picks = uniq([
      ...tastes.flatMap((id) => TASTE_TAGS.find((t) => t.id === id)?.picks ?? []),
      ...(WALLET_ARCHETYPES.find((a) => a.id === wallet)?.picks ?? []),
      ...(BUYING_STYLES.find((a) => a.id === style)?.picks ?? []),
    ]);
    completeOnboarding(picks, undefined, { location: withLocation, share_data: false });
    router.replace('/landing');
  };

  // Vrai prompt iOS natif + vraie position → ancre les offres avant la carte.
  const requestLocation = async () => {
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocStatus('denied'); return; }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch { /* on garde, finish quand même */ }
      void ensureNotifPermission(); // active les notifs de proximité passives dès maintenant
      finish(true);
    } catch {
      setLocStatus('denied');
    }
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
            {WALLET_ARCHETYPES.map((a) => <ArchCard key={a.id} a={a} on={wallet === a.id} onPress={() => { setWallet(a.id); setTimeout(() => setStep(2), 240); }} />)}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={text.h1}>Comment tu achètes ?</Text>
            <Text style={styles.sub}>Ton style de shopping, en une phrase.</Text>
            {BUYING_STYLES.map((a) => <ArchCard key={a.id} a={a} on={style === a.id} onPress={() => { setStyle(a.id); setTimeout(() => setStep(3), 240); }} />)}
          </>
        )}

        {step === 3 && (
          <View style={styles.locHero}>
            <View style={styles.ringWrap}>
              <ProximityRing size={150} />
              <View style={styles.ringCenter}><SpotMark size={40} /></View>
            </View>
            <Text style={styles.locTitle}>Les offres, juste autour de toi</Text>
            <Text style={styles.locSub}>Active ta position pour des offres précises près de toi et une alerte à ~5 min d’un magasin.</Text>

            {locStatus === 'denied' ? (
              <View style={styles.denyCard}>
                <Text style={styles.denyTxt}>Localisation refusée. Active-la dans les Réglages pour des offres précises.</Text>
                <PrimaryButton label="Ouvrir les Réglages" onPress={() => Linking.openSettings()} icon={<Icon name="settings" size={18} color="#fff" />} />
                <GhostButton label="Continuer sans" onPress={() => finish(false)} />
              </View>
            ) : (
              <View style={styles.locActions}>
                <PrimaryButton
                  label={locStatus === 'loading' ? 'Localisation…' : 'Activer ma position'}
                  onPress={requestLocation}
                  disabled={locStatus === 'loading'}
                  icon={locStatus === 'loading' ? <ActivityIndicator color="#fff" /> : <Icon name="pin" size={18} color="#fff" />}
                />
                <Pressable onPress={() => finish(false)} hitSlop={8} style={styles.laterBtn}><Text style={styles.later}>Plus tard</Text></Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step > 0 ? <GhostButton label="Retour" onPress={() => { setLocStatus('idle'); setStep((s) => s - 1); }} /> : <View style={{ flex: 1 }} />}
        {step === 0 ? <PrimaryButton label="Continuer" onPress={() => setStep(1)} /> : null}
        {step === 1 || step === 2 ? <Text style={styles.hint}>Touche une option pour continuer</Text> : null}
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
  locHero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  ringWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  locTitle: { fontFamily: font.displayBold, fontSize: 26, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  locSub: { ...text.body, textAlign: 'center', maxWidth: 300 },
  locActions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  laterBtn: { alignSelf: 'center', paddingVertical: 8 },
  later: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.ink3 },
  denyCard: { alignSelf: 'stretch', gap: 10, marginTop: 8, padding: 16, borderRadius: radius.card, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  denyTxt: { ...text.body, color: colors.accentInk, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16, minHeight: 60 },
  hint: { fontFamily: font.body, fontSize: 13, color: colors.ink3 },
});
