// Découvrir = point d'entrée "besoin" (le deck à swiper est masqué pour l'instant,
// le code SwipeDeck reste en place dans src/swipe/). UI minimaliste, une question.
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, SpotMark, PrimaryButton, GhostButton, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { INTENT_SUGGESTIONS } from '@/data/onboarding';
import { getIntentFollowups, buildIntentPicks, type FollowupQ } from '@/agents/intent';

export default function DiscoverScreen() {
  const router = useRouter();
  const applyIntent = useStore((s) => s.applyIntent);

  const [mode, setMode] = useState<'ask' | 'followups'>('ask');
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState<FollowupQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const goMap = () => router.push('/(tabs)/map');

  const decideForMe = () => { applyIntent([]); goMap(); };

  const startIntent = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try { setFollowups(await getIntentFollowups(intent.trim())); }
    finally { setLoading(false); setMode('followups'); }
  };

  const finishIntent = () => {
    const { picks, summary } = buildIntentPicks(intent, answers);
    applyIntent(picks, summary);
    goMap();
  };

  return (
    <Screen scroll padded>
      <View style={styles.top}>
        <SpotLogo size={24} />
        <SpotMark size={18} />
      </View>

      {mode === 'ask' && (
        <View style={styles.body}>
          <Text style={styles.q}>Qu’est-ce que tu veux trouver aujourd’hui ?</Text>
          <Text style={styles.sub}>Dis-le-nous, ou laisse Spot.it décider pour toi.</Text>

          <View style={styles.inputWrap}>
            <Icon name="sparkle" size={18} color={colors.accent} />
            <TextInput
              value={intent}
              onChangeText={setIntent}
              placeholder="ex. des sneakers blanches"
              placeholderTextColor={colors.ink3}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={startIntent}
            />
          </View>

          <View style={styles.suggestRow}>
            {INTENT_SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => setIntent(s)} style={styles.suggest}>
                <Text style={styles.suggestTxt}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadRow}><ActivityIndicator color={colors.accent} /><Text style={styles.loadTxt}>On cerne ton besoin…</Text></View>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton label="C’est parti" onPress={startIntent} disabled={!intent.trim() || loading} icon={<Icon name="arrowUp" size={18} color="#fff" />} />
            <GhostButton label="Décide pour moi" onPress={decideForMe} />
          </View>
        </View>
      )}

      {mode === 'followups' && (
        <View style={styles.body}>
          <Text style={styles.q}>Encore deux détails</Text>
          <Text style={styles.sub}>Pour « {intent} » — on vise juste.</Text>
          {followups.map((qq) => (
            <View key={qq.id} style={{ gap: 8, marginTop: 8 }}>
              <Text style={styles.qLabel}>{qq.question}</Text>
              <View style={styles.optRow}>
                {qq.options.map((o) => {
                  const on = answers[qq.id] === o;
                  return (
                    <Pressable key={o} onPress={() => setAnswers((a) => ({ ...a, [qq.id]: o }))} style={[styles.opt, on && styles.optOn]}>
                      <Text style={[styles.optTxt, on && styles.optTxtOn]}>{o}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={styles.actions}>
            <PrimaryButton label="Voir mes offres" onPress={finishIntent} icon={<Icon name="check" size={18} color="#fff" />} />
            <GhostButton label="Retour" onPress={() => setMode('ask')} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 28 },
  body: { gap: 14 },
  q: { ...text.h1, fontSize: 30, lineHeight: 36 },
  sub: { ...text.body, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 16, borderRadius: radius.card, backgroundColor: colors.surface, ...shadows.sm },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 17, color: colors.ink, padding: 0 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  suggest: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  suggestTxt: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  loadTxt: { ...text.body },
  actions: { gap: 10, marginTop: 24 },
  qLabel: { fontFamily: font.bodySemiBold, fontSize: 16, color: colors.ink },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  optTxt: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.ink },
  optTxtOn: { color: colors.accentInk },
});
