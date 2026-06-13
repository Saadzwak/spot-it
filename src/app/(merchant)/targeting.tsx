// ============================================================================
// Ciblage — campagne : audience (catégories + archétypes + tranches prix),
// rayon, créneaux, budget (stepper), portée estimée, lancer / pause.
// Tout en Views + Pressable. UI optimiste, écriture best-effort en réel.
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { SectionTitle, PrimaryButton, GhostButton, CatChip } from '@/components';
import { SelectPill, Stepper } from '@/merchant/components';
import { hasSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { DEMO_STORE_ID } from '@/merchant/mock';
import { WALLET_ARCHETYPES } from '@/data/onboarding';
import type { Category, PriceBand } from '@/types/contracts';

const RADIUS_PRESETS = [
  { label: '400 m', value: 400 },
  { label: '800 m', value: 800 },
  { label: '1,5 km', value: 1500 },
];

const DAYPART_PRESETS = [
  { label: 'Matin',   id: 'matin',   weight: 0.25 },
  { label: 'Midi',    id: 'midi',    weight: 0.15 },
  { label: 'Soir',    id: 'soir',    weight: 0.30 },
  { label: 'Weekend', id: 'weekend', weight: 0.30 },
];

const ALL_CATS: Category[] = ['mode', 'tech', 'maison', 'beaute'];
const PRICE_BANDS: { id: PriceBand; label: string }[] = [
  { id: '0-20', label: '0–20 €' }, { id: '20-50', label: '20–50 €' },
  { id: '50-100', label: '50–100 €' }, { id: '100+', label: '100 € +' },
];

const BUDGET_STEP = 500, BUDGET_MIN = 500, BUDGET_MAX = 100_000;

// Pool d'audience estimé par catégorie (rayon 800 m de référence).
const CAT_POOL: Record<Category, number> = { mode: 5200, tech: 3100, maison: 2400, beaute: 3800 };
const RADIUS_FACTOR: Record<number, number> = { 400: 0.5, 800: 1, 1500: 1.9 };

export default function Targeting(): React.ReactElement {
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web' ? { width: maxWidth, alignSelf: 'center' } : {};

  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(['mode']));
  const [selectedArchs, setArchs]       = useState<Set<string>>(new Set(['malin']));
  const [selectedBands, setBands]       = useState<Set<PriceBand>>(new Set(['50-100']));
  const [radiusM, setRadiusM]           = useState(800);
  const [selectedDayparts, setDayparts] = useState<Set<string>>(new Set(['matin', 'soir']));
  const [budgetCents, setBudgetCents]   = useState(5000);
  const [status, setStatus]             = useState<'draft' | 'active' | 'paused'>('draft');
  const [working, setWorking]           = useState(false);

  const toggleSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, min = 0) =>
    (v: T) => setter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) { if (next.size > min) next.delete(v); } else next.add(v);
      return next;
    });

  const toggleCat     = toggleSet(setSelectedCats, 1);
  const toggleArch    = toggleSet(setArchs, 0);
  const toggleBand    = toggleSet(setBands, 0);
  const toggleDaypart = toggleSet(setDayparts, 1);

  const budgetDisplay = `${(budgetCents / 100).toFixed(0)} €`;

  // ── Portée estimée (déterministe) ──
  const reach = useMemo(() => {
    const pool = Array.from(selectedCats).reduce((s, c) => s + CAT_POOL[c], 0);
    const rf = RADIUS_FACTOR[radiusM] ?? 1;
    const dp = DAYPART_PRESETS
      .filter((d) => selectedDayparts.has(d.id))
      .reduce((s, d) => s + d.weight, 0) || 0.25;
    const bandFactor = 0.6 + 0.1 * selectedBands.size; // plus de tranches → plus large
    return Math.round((pool * rf * dp * bandFactor) / 100) * 100;
  }, [selectedCats, radiusM, selectedDayparts, selectedBands]);

  const daypartHours: Record<string, [number, number]> = {
    matin: [8, 12], midi: [12, 14], soir: [18, 22], weekend: [10, 20],
  };

  const persist = async (newStatus: 'active' | 'paused') => {
    if (!hasSupabase()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const days = Array.from(selectedDayparts);
      const hours = days.reduce<[number, number]>(
        (acc, id) => { const h = daypartHours[id] ?? [9, 18]; return [Math.min(acc[0], h[0]), Math.max(acc[1], h[1])]; },
        [23, 0],
      );
      await supabase.from('campaigns').insert({
        store_id: DEMO_STORE_ID,
        audience: {
          categories: Array.from(selectedCats),
          archetypes: Array.from(selectedArchs),
          price_bands: Array.from(selectedBands),
        },
        radius_m: radiusM,
        daypart: { days, hours },
        budget_cents: budgetCents,
        spend_cents: 0,
        status: newStatus,
      });
    } catch { /* optimiste */ }
  };

  const handleLaunch = async () => {
    if (working) return;
    setWorking(true);
    setStatus('active');           // optimiste
    await persist('active');
    setWorking(false);
  };
  const handlePause  = () => setStatus('paused');
  const handleResume = () => setStatus('active');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Campagne</Text>

      {/* ── Audience : catégories ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Audience — catégories</Text>
        <View style={styles.chipRow}>
          {ALL_CATS.map((cat) => (
            <CatChip key={cat} catId={cat} active={selectedCats.has(cat)} onPress={() => toggleCat(cat)} />
          ))}
        </View>
      </View>

      {/* ── Audience : archétypes ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Archétypes d’acheteur</Text>
        <View style={styles.pillRow}>
          {WALLET_ARCHETYPES.map((a) => (
            <SelectPill key={a.id} label={`${a.emoji} ${a.label}`} active={selectedArchs.has(a.id)} onPress={() => toggleArch(a.id)} />
          ))}
        </View>
      </View>

      {/* ── Audience : tranches de prix ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Tranches de prix</Text>
        <View style={styles.pillRow}>
          {PRICE_BANDS.map((p) => (
            <SelectPill key={p.id} label={p.label} active={selectedBands.has(p.id)} onPress={() => toggleBand(p.id)} />
          ))}
        </View>
      </View>

      {/* ── Rayon ──────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Rayon de diffusion</Text>
        <View style={styles.pillRow}>
          {RADIUS_PRESETS.map((p) => (
            <SelectPill key={p.value} label={p.label} active={radiusM === p.value} onPress={() => setRadiusM(p.value)} />
          ))}
        </View>
      </View>

      {/* ── Créneaux ───────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Créneaux horaires</Text>
        <View style={styles.pillRow}>
          {DAYPART_PRESETS.map((d) => (
            <SelectPill key={d.id} label={d.label} active={selectedDayparts.has(d.id)} onPress={() => toggleDaypart(d.id)} />
          ))}
        </View>
      </View>

      {/* ── Budget ─────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Budget hebdomadaire</Text>
        <Stepper
          display={budgetDisplay}
          onDecrement={() => setBudgetCents((v) => Math.max(BUDGET_MIN, v - BUDGET_STEP))}
          onIncrement={() => setBudgetCents((v) => Math.min(BUDGET_MAX, v + BUDGET_STEP))}
        />
      </View>

      {/* ── Portée estimée ─────────────────────────────────────────────────── */}
      <View style={styles.reachCard}>
        <Text style={styles.reachLabel}>Portée estimée</Text>
        <Text style={styles.reachValue}>~{reach.toLocaleString('fr-FR')} personnes</Text>
        <Text style={styles.reachSub}>par semaine, dans votre zone et vos créneaux</Text>
      </View>

      {/* ── État + actions ─────────────────────────────────────────────────── */}
      {status !== 'draft' && (
        <View style={[styles.statusBanner, status === 'paused' && styles.statusPaused]}>
          <View style={[styles.statusDot, { backgroundColor: status === 'active' ? '#1FA463' : colors.ink3 }]} />
          <Text style={styles.statusText}>
            {status === 'active' ? 'Campagne active' : 'Campagne en pause'}
          </Text>
          <Text style={styles.statusSub}>
            {hasSupabase() ? 'Synchronisée en base.' : 'Mode démo.'}
          </Text>
        </View>
      )}

      <View style={styles.ctaRow}>
        {status === 'active' ? (
          <GhostButton label="Mettre en pause" onPress={handlePause} />
        ) : status === 'paused' ? (
          <PrimaryButton label="Reprendre" onPress={handleResume} />
        ) : (
          <PrimaryButton
            label={working ? 'Lancement…' : 'Lancer la campagne'}
            onPress={handleLaunch}
            disabled={working}
          />
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingTop: 20 },
  h1: {
    fontFamily: font.displayBold,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.ink,
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  fieldLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reachCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 20,
  },
  reachLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentInk,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reachValue: {
    fontFamily: font.displayBold,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.accentInk,
    marginTop: 4,
  },
  reachSub: { fontFamily: font.body, fontSize: 13, color: colors.accentInk, opacity: 0.8, marginTop: 2 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 16,
    ...shadows.sm,
  },
  statusPaused: { opacity: 0.9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: font.bodySemiBold, fontSize: 14, fontWeight: '600', color: colors.ink },
  statusSub: { fontFamily: font.body, fontSize: 12, color: colors.ink3, marginLeft: 'auto' },
  ctaRow: { marginTop: 4 },
});
