// Découvrir = page d'accueil "wow" : une question centrée, une grande barre de
// recherche, quelques exemples. L'utilisateur dit son envie → filtre + carte.
import { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SpotMark, PrimaryButton, GhostButton, Icon } from '@/components';
import { colors, radius, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { INTENT_SUGGESTIONS } from '@/data/onboarding';
import { getIntentFollowups, buildIntentPicks, type FollowupQ } from '@/agents/intent';

const EXAMPLES = INTENT_SUGGESTIONS.slice(0, 4);

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
    if (!intent.trim() || loading) return;
    setLoading(true);
    try { setFollowups(await getIntentFollowups(intent.trim())); }
    finally { setLoading(false); setMode('followups'); }
  };
  const finishIntent = () => {
    const { picks, summary } = buildIntentPicks(intent, answers);
    applyIntent(picks, summary);
    goMap();
  };

  if (mode === 'followups') {
    return (
      <Screenish scroll>
        <Text style={styles.h}>Encore deux détails</Text>
        <Text style={styles.sub}>Pour « {intent} » — on vise juste.</Text>
        {followups.map((qq) => (
          <View key={qq.id} style={{ gap: 8, marginTop: 10 }}>
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
        <View style={{ gap: 10, marginTop: 28 }}>
          <PrimaryButton label="Voir mes offres" onPress={finishIntent} icon={<Icon name="check" size={18} color="#fff" />} />
          <GhostButton label="Retour" onPress={() => setMode('ask')} />
        </View>
      </Screenish>
    );
  }

  return (
    <Screenish>
      <View style={styles.center}>
        <SpotMark size={26} />
        <Text style={styles.q}>Tu cherches quelque chose en particulier ?</Text>

        <View style={styles.searchWrap}>
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
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="arrowUp" size={18} color="#fff" />}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.examples}>
          {EXAMPLES.map((s) => (
            <Pressable key={s} onPress={() => setIntent(s)} style={styles.ex}>
              <Text style={styles.exTxt}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={decideForMe} hitSlop={8} style={styles.decide}>
          <Icon name="sparkle" size={16} color={colors.accentInk} />
          <Text style={styles.decideTxt}>Décide pour moi</Text>
        </Pressable>
      </View>
    </Screenish>
  );
}

// Petit wrapper local (SafeArea + canvas) pour centrer sans dépendre du scroll.
function Screenish({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1, paddingHorizontal: 20 },
  scrollPad: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  q: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, color: colors.ink, textAlign: 'center', letterSpacing: -0.5, maxWidth: 320 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    paddingHorizontal: 18, paddingVertical: 18, borderRadius: 22, backgroundColor: colors.surface, ...shadows.card,
  },
  input: { flex: 1, fontFamily: font.bodyMedium, fontSize: 18, color: colors.ink, padding: 0 },
  goCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  ex: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  exTxt: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  decide: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8, paddingVertical: 8 },
  decideTxt: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.accentInk },
  // followups
  h: { fontFamily: font.displayBold, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
  sub: { ...text.body, marginTop: 4 },
  qLabel: { fontFamily: font.bodySemiBold, fontSize: 16, color: colors.ink },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  optTxt: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.ink },
  optTxtOn: { color: colors.accentInk },
});
