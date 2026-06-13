import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, SpotMark, PrimaryButton, GhostButton, Toggle, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { TASTE_TAGS, WALLET_ARCHETYPES, BUYING_STYLES, INTENT_SUGGESTIONS } from '@/data/onboarding';
import { ensureLocationPermission } from '@/geo/proximity';
import { getIntentFollowups, buildIntentPicks, type FollowupQ } from '@/agents/intent';

const uniq = (a: string[]) => Array.from(new Set(a));

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0); // 0 tastes · 1 wallet · 2 style · 3 final
  const [tastes, setTastes] = useState<string[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [locationOn, setLocationOn] = useState(true);

  const [finalMode, setFinalMode] = useState<'choice' | 'intent' | 'followups'>('choice');
  const [intent, setIntent] = useState('');
  const [followups, setFollowups] = useState<FollowupQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const basePicks = uniq([
    ...tastes.flatMap((id) => TASTE_TAGS.find((t) => t.id === id)?.picks ?? []),
    ...(WALLET_ARCHETYPES.find((a) => a.id === wallet)?.picks ?? []),
    ...(BUYING_STYLES.find((a) => a.id === style)?.picks ?? []),
  ]);

  const finish = async (extraPicks: string[], summary?: string) => {
    if (locationOn) { try { await ensureLocationPermission(); } catch { /* ignore */ } }
    completeOnboarding(uniq([...basePicks, ...extraPicks]), summary, { location: locationOn, share_data: false });
    router.replace('/landing');
  };

  const loadFollowups = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try { setFollowups(await getIntentFollowups(intent.trim())); }
    finally { setLoading(false); setFinalMode('followups'); }
  };

  const finishWithIntent = () => {
    const { picks, summary } = buildIntentPicks(intent, answers);
    void finish(picks, summary);
  };

  return (
    <Screen scroll padded>
      <View style={styles.head}>
        <SpotLogo size={24} />
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={[styles.dot, i === step && styles.dotActive]} />)}
        </View>
      </View>

      {step === 0 && (
        <View style={styles.body}>
          <Text style={text.h1}>Tes envies du moment</Text>
          <Text style={styles.sub}>Choisis ce qui te ressemble — on affine à chaque swipe.</Text>
          <View style={styles.tags}>
            {TASTE_TAGS.map((t) => {
              const on = tastes.includes(t.id);
              return (
                <Pressable key={t.id} onPress={() => setTastes((s) => on ? s.filter((x) => x !== t.id) : [...s, t.id])}
                  style={[styles.tag, on && styles.tagOn]}>
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
          <Text style={text.h1}>Ton rapport à la dépense</Text>
          <Text style={styles.sub}>Sans jugement — ça nous aide à viser juste (et oui, on assume les noms).</Text>
          {WALLET_ARCHETYPES.map((a) => (
            <ArchCard key={a.id} a={a} on={wallet === a.id} onPress={() => setWallet(a.id)} />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Text style={text.h1}>Comment tu achètes ?</Text>
          <Text style={styles.sub}>Ton style de shopping, en une phrase.</Text>
          {BUYING_STYLES.map((a) => (
            <ArchCard key={a.id} a={a} on={style === a.id} onPress={() => setStyle(a.id)} />
          ))}
        </View>
      )}

      {step === 3 && finalMode === 'choice' && (
        <View style={styles.body}>
          <Text style={text.h1}>Et maintenant ?</Text>
          <Text style={styles.sub}>On part de ton envie, ou on décide pour toi.</Text>
          <Pressable style={[styles.bigCard, styles.bigCardAccent]} onPress={() => setFinalMode('intent')}>
            <Text style={styles.bigEmoji}>🎯</Text>
            <Text style={styles.bigTitle}>Voilà ce que je veux</Text>
            <Text style={styles.bigSub}>Dis-nous, on cible direct (2 petites questions)</Text>
          </Pressable>
          <Pressable style={styles.bigCard} onPress={() => void finish([])}>
            <Text style={styles.bigEmoji}>✨</Text>
            <Text style={styles.bigTitle}>Décide pour moi</Text>
            <Text style={styles.bigSub}>On lit ton profil et on s’occupe de tout</Text>
          </Pressable>
          <View style={styles.locRow}>
            <Icon name="pin" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Toggle value={locationOn} onValueChange={setLocationOn} label="Offres proches & alertes" sublabel="Localisation — tu gardes le contrôle" />
            </View>
          </View>
        </View>
      )}

      {step === 3 && finalMode === 'intent' && (
        <View style={styles.body}>
          <Text style={text.h1}>Dis-nous tout</Text>
          <Text style={styles.sub}>Qu’est-ce que tu cherches aujourd’hui ?</Text>
          <View style={styles.inputWrap}>
            <Icon name="sparkle" size={18} color={colors.accent} />
            <TextInput value={intent} onChangeText={setIntent} placeholder="ex. des sneakers blanches"
              placeholderTextColor={colors.ink3} style={styles.input} autoFocus returnKeyType="done" onSubmitEditing={loadFollowups} />
          </View>
          <View style={styles.suggestRow}>
            {INTENT_SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => setIntent(s)} style={styles.suggest}><Text style={styles.suggestTxt}>{s}</Text></Pressable>
            ))}
          </View>
          {loading ? (
            <View style={styles.loadRow}><ActivityIndicator color={colors.accent} /><Text style={styles.loadTxt}>On prépare 2 questions sur-mesure…</Text></View>
          ) : null}
        </View>
      )}

      {step === 3 && finalMode === 'followups' && (
        <View style={styles.body}>
          <Text style={text.h1}>Encore deux détails</Text>
          <Text style={styles.sub}>Pour « {intent} » — ça nous aide à viser juste.</Text>
          {followups.map((q) => (
            <View key={q.id} style={{ gap: 8, marginTop: 6 }}>
              <Text style={styles.qLabel}>{q.question}</Text>
              <View style={styles.optRow}>
                {q.options.map((o) => {
                  const on = answers[q.id] === o;
                  return (
                    <Pressable key={o} onPress={() => setAnswers((a) => ({ ...a, [q.id]: o }))} style={[styles.opt, on && styles.optOn]}>
                      <Text style={[styles.optTxt, on && styles.optTxtOn]}>{o}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* footer */}
      <View style={styles.footer}>
        {step > 0 && finalMode === 'choice' ? <GhostButton label="Retour" onPress={() => setStep((s) => s - 1)} /> : null}
        {step === 3 && finalMode === 'intent' ? <GhostButton label="Retour" onPress={() => setFinalMode('choice')} /> : null}
        {step === 3 && finalMode === 'followups' ? <GhostButton label="Retour" onPress={() => setFinalMode('intent')} /> : null}

        {step < 3 ? (
          <PrimaryButton label={step === 0 ? 'Continuer' : 'Suivant'} onPress={() => setStep((s) => s + 1)} />
        ) : null}
        {step === 3 && finalMode === 'intent' ? (
          <PrimaryButton label="Continuer" onPress={loadFollowups} disabled={!intent.trim() || loading} />
        ) : null}
        {step === 3 && finalMode === 'followups' ? (
          <PrimaryButton label="Voir mes offres" onPress={finishWithIntent} icon={<Icon name="check" size={18} color="#fff" />} />
        ) : null}
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
  body: { gap: 12, paddingBottom: 20, minHeight: 380 },
  sub: { ...text.body, marginBottom: 6 },
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
  bigCard: { padding: 20, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.card, gap: 4 },
  bigCardAccent: { borderColor: colors.accent, borderWidth: 2 },
  bigEmoji: { fontSize: 30 },
  bigTitle: { fontFamily: font.displaySemiBold, fontSize: 22, color: colors.ink, marginTop: 4 },
  bigSub: { ...text.body },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.card, backgroundColor: colors.surface, ...shadows.sm, marginTop: 4 },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 16, color: colors.ink, padding: 0 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggest: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  suggestTxt: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  loadTxt: { ...text.body },
  qLabel: { fontFamily: font.bodySemiBold, fontSize: 16, color: colors.ink },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  optTxt: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.ink },
  optTxtOn: { color: colors.accentInk },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingVertical: 16 },
});
