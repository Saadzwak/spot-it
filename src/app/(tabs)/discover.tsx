// Découvrir = accueil "wow" : question centrée → IA pose 2 questions (animées) →
// l'agent de curation sélectionne les meilleures offres → carte. Loaders "magie".
import { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SpotMark, PrimaryButton, Icon, MagicLoader } from '@/components';
import { colors, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { INTENT_SUGGESTIONS } from '@/data/onboarding';
import { getIntentFollowups, buildIntentPicks, curateOffers, type FollowupQ } from '@/agents/intent';

const EXAMPLES = INTENT_SUGGESTIONS.slice(0, 4);
type Phase = 'ask' | 'magic' | 'followups' | 'curating';

export default function DiscoverScreen() {
  const router = useRouter();
  const offers = useStore((s) => s.offers);
  const applyIntent = useStore((s) => s.applyIntent);
  const setMatched = useStore((s) => s.setMatched);

  const [phase, setPhase] = useState<Phase>('ask');
  const [intent, setIntent] = useState('');
  const [followups, setFollowups] = useState<FollowupQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);

  const goMap = () => router.push('/(tabs)/map');

  const decideForMe = () => { setMatched(null, 'Sélection pour toi'); goMap(); };

  const startIntent = async () => {
    if (!intent.trim() || phase !== 'ask') return;
    setPhase('magic');
    const qs = await getIntentFollowups(intent.trim());
    setFollowups(qs); setAnswers({}); setCurrentQ(0); setPhase('followups');
  };

  const runCurate = async (finalAnswers: Record<string, string>) => {
    setPhase('curating');
    const { picks, summary } = buildIntentPicks(intent, finalAnswers);
    applyIntent(picks, summary);
    const res = await curateOffers(intent.trim(), finalAnswers, offers);
    setMatched(res.offerIds, res.headline);
    goMap();
    setTimeout(() => setPhase('ask'), 400); // reset pour le prochain passage
  };

  const answer = (qid: string, opt: string) => {
    const next = { ...answers, [qid]: opt };
    setAnswers(next);
    if (currentQ + 1 < followups.length) setCurrentQ((c) => c + 1);
    else void runCurate(next);
  };

  if (phase === 'magic') return <Screenish><MagicLoader label={`On cerne ton envie : « ${intent} »`} /></Screenish>;
  if (phase === 'curating') return <Screenish><MagicLoader label="On déniche tes meilleures offres autour de toi…" /></Screenish>;

  if (phase === 'followups' && followups[currentQ]) {
    const q = followups[currentQ];
    return (
      <Screenish>
        <View style={styles.center}>
          <Text style={styles.step}>Question {currentQ + 1} / {followups.length}</Text>
          <Animated.View key={currentQ} entering={FadeInDown.duration(450)} style={styles.qBlock}>
            <Text style={styles.q}>{q.question}</Text>
            <View style={styles.optRow}>
              {q.options.map((o) => {
                const on = answers[q.id] === o;
                return (
                  <Pressable key={o} onPress={() => answer(q.id, o)} style={[styles.opt, on && styles.optOn]}>
                    <Text style={[styles.optTxt, on && styles.optTxtOn]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Screenish>
    );
  }

  // phase ask
  return (
    <Screenish>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(400)}><SpotMark size={26} /></Animated.View>
        <Animated.Text entering={FadeInDown.delay(120).duration(450)} style={styles.q}>Tu cherches quelque chose en particulier ?</Animated.Text>

        <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.searchWrap}>
          <Icon name="search" size={20} color={colors.ink3} />
          <TextInput
            value={intent}
            onChangeText={setIntent}
            placeholder="ex. des sneakers blanches"
            placeholderTextColor={colors.ink3}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={startIntent}
            autoCorrect={false}
          />
          {intent.trim() ? (
            <Pressable onPress={startIntent} hitSlop={8} style={styles.goCircle}>
              <Icon name="arrowUp" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(450)} style={styles.examples}>
          {EXAMPLES.map((s) => (
            <Pressable key={s} onPress={() => setIntent(s)} style={styles.ex}><Text style={styles.exTxt}>{s}</Text></Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(480).duration(450)}>
          <Pressable onPress={decideForMe} hitSlop={8} style={styles.decide}>
            <Icon name="sparkle" size={16} color={colors.accentInk} />
            <Text style={styles.decideTxt}>Décide pour moi</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Screenish>
  );
}

function Screenish({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.screen}><View style={styles.flex}>{children}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  q: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, color: colors.ink, textAlign: 'center', letterSpacing: -0.5, maxWidth: 320 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingHorizontal: 18, paddingVertical: 18, borderRadius: 22, backgroundColor: colors.surface, ...shadows.card },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 18, color: colors.ink, padding: 0 },
  goCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  ex: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  exTxt: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  decide: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8, paddingVertical: 8 },
  decideTxt: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.accentInk },
  step: { fontFamily: font.bodySemiBold, fontSize: 13, color: colors.accentInk, letterSpacing: 0.3 },
  qBlock: { gap: 16, alignItems: 'center' },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  opt: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadows.sm },
  optOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  optTxt: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.ink },
  optTxtOn: { color: colors.accentInk },
});
