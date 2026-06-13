import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, SpotMark, PrimaryButton, GhostButton, Toggle, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { TASTE_TAGS, INTENT_SUGGESTIONS } from '@/data/onboarding';
import { ensureLocationPermission } from '@/geo/proximity';

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [intent, setIntent] = useState('');
  const [locationOn, setLocationOn] = useState(false);
  const [shareData, setShareData] = useState(false);

  const picks = useMemo(
    () => Array.from(new Set(selected.flatMap((id) => TASTE_TAGS.find((t) => t.id === id)?.picks ?? []))),
    [selected],
  );

  const toggleTag = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const finish = async () => {
    if (locationOn) { try { await ensureLocationPermission(); } catch { /* ignore */ } }
    completeOnboarding(picks, intent.trim() || undefined, { location: locationOn, share_data: shareData });
    router.replace('/(tabs)/discover');
  };

  return (
    <Screen scroll padded>
      <View style={styles.head}>
        <SpotLogo size={24} />
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </View>

      {step === 0 && (
        <View style={styles.body}>
          <Text style={text.h1}>Tes envies du moment</Text>
          <Text style={styles.sub}>Choisis ce qui te ressemble — on affine au fil de tes swipes.</Text>
          <View style={styles.tags}>
            {TASTE_TAGS.map((t) => {
              const on = selected.includes(t.id);
              return (
                <Pressable key={t.id} onPress={() => toggleTag(t.id)} style={[styles.tag, on && styles.tagOn]}>
                  <Text style={styles.tagEmoji}>{t.emoji}</Text>
                  <Text style={[styles.tagLabel, on && styles.tagLabelOn]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.body}>
          <Text style={text.h1}>Une intention shopping ?</Text>
          <Text style={styles.sub}>Dis-nous ce que tu cherches (optionnel) — nos agents s’en servent.</Text>
          <View style={styles.inputWrap}>
            <Icon name="sparkle" size={18} color={colors.accent} />
            <TextInput
              value={intent}
              onChangeText={setIntent}
              placeholder="ex. des sneakers blanches"
              placeholderTextColor={colors.ink3}
              style={styles.input}
            />
          </View>
          <View style={styles.suggestRow}>
            {INTENT_SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => setIntent(s)} style={styles.suggest}>
                <Text style={styles.suggestTxt}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <View style={styles.locMark}><SpotMark size={48} /></View>
          <Text style={text.h1}>Repère les offres autour de toi</Text>
          <Text style={styles.sub}>
            Active la localisation pour voir les offres proches et recevoir une alerte à ~5 min d’un magasin partenaire. Tu gardes le contrôle.
          </Text>
          <View style={styles.consentCard}>
            <Toggle
              value={locationOn}
              onValueChange={setLocationOn}
              label="Localisation"
              sublabel="Offres proches + alertes de proximité"
            />
            <View style={styles.sep} />
            <Toggle
              value={shareData}
              onValueChange={setShareData}
              label="Partager mes données d’usage"
              sublabel="Désactivé par défaut. Tu peux changer d’avis à tout moment."
            />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        {step > 0 ? <GhostButton label="Retour" onPress={() => setStep((s) => s - 1)} /> : <View style={{ flex: 1 }} />}
        {step < 2 ? (
          <PrimaryButton label={step === 0 ? 'Continuer' : 'Suivant'} onPress={() => setStep((s) => s + 1)} />
        ) : (
          <PrimaryButton label="Commencer" onPress={finish} icon={<Icon name="check" size={18} color="#fff" />} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  body: { gap: 12, paddingBottom: 24, minHeight: 360 },
  sub: { ...text.body, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.sm,
  },
  tagOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  tagEmoji: { fontSize: 16 },
  tagLabel: { fontFamily: font.bodySemiBold, fontSize: 14, color: colors.ink },
  tagLabelOn: { color: colors.accentInk },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: radius.card, backgroundColor: colors.surface, ...shadows.sm, marginTop: 4,
  },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 16, color: colors.ink, padding: 0 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggest: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  suggestTxt: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  locMark: { alignItems: 'center', paddingVertical: 12 },
  consentCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, marginTop: 8, ...shadows.sm },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16 },
});
