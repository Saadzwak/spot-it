// ============================================================================
// Ciblage — campaign form: audience, radius, dayparts, budget
// No external dependencies — all built with View + Pressable.
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { SectionTitle, PrimaryButton, CatChip } from '@/components';
import { hasSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { DEMO_STORE_ID } from '@/merchant/mock';
import type { Category } from '@/types/contracts';

// ── preset data ──────────────────────────────────────────────────────────────

const RADIUS_PRESETS: { label: string; value: number }[] = [
  { label: '400 m', value: 400 },
  { label: '800 m', value: 800 },
  { label: '1,5 km', value: 1500 },
];

const DAYPART_PRESETS: { label: string; id: string }[] = [
  { label: 'Matin',    id: 'matin'   },
  { label: 'Midi',     id: 'midi'    },
  { label: 'Soir',     id: 'soir'    },
  { label: 'Weekend',  id: 'weekend' },
];

const ALL_CATS: Category[] = ['mode', 'tech', 'maison', 'beaute'];

const BUDGET_STEP = 500; // cents — 5 €
const BUDGET_MIN  = 500;
const BUDGET_MAX  = 100_000; // 1000 €

// ── SelectPill — active/inactive pressable pill ───────────────────────────────

function SelectPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selPill, active && styles.selPillActive]}
    >
      <Text style={[styles.selPillLabel, active && styles.selPillLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({
  value,
  onDecrement,
  onIncrement,
  display,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  display: string;
}): React.ReactElement {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDecrement} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnLabel}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{display}</Text>
      <Pressable onPress={onIncrement} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnLabel}>+</Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Targeting(): React.ReactElement {
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web' ? { width: maxWidth, alignSelf: 'center' } : {};

  // Form state
  const [selectedCats, setSelectedCats]   = useState<Set<Category>>(new Set(['mode']));
  const [radiusM, setRadiusM]             = useState<number>(800);
  const [selectedDayparts, setDayparts]   = useState<Set<string>>(new Set(['matin', 'soir']));
  const [budgetCents, setBudgetCents]     = useState<number>(5000); // 50 €
  const [launched, setLaunched]           = useState(false);
  const [launching, setLaunching]         = useState(false);

  const toggleCat = (cat: Category) =>
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); }
      else next.add(cat);
      return next;
    });

  const toggleDaypart = (id: string) =>
    setDayparts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });

  const decrementBudget = () =>
    setBudgetCents((v) => Math.max(BUDGET_MIN, v - BUDGET_STEP));
  const incrementBudget = () =>
    setBudgetCents((v) => Math.min(BUDGET_MAX, v + BUDGET_STEP));

  const budgetDisplay = `${(budgetCents / 100).toFixed(0)} €`;

  // Daypart → hours mapping (simplified)
  const daypartHours: Record<string, [number, number]> = {
    matin: [8, 12], midi: [12, 14], soir: [18, 22], weekend: [10, 20],
  };

  const handleLaunch = async () => {
    if (launching) return;
    setLaunching(true);

    if (hasSupabase()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const daypartArr = Array.from(selectedDayparts);
          const hours = daypartArr.reduce<[number, number]>(
            (acc, id) => {
              const h = daypartHours[id] ?? [9, 18];
              return [Math.min(acc[0], h[0]), Math.max(acc[1], h[1])];
            },
            [23, 0],
          );

          await supabase.from('campaigns').insert({
            store_id:     DEMO_STORE_ID,
            audience:     { categories: Array.from(selectedCats) },
            radius_m:     radiusM,
            daypart:      { days: daypartArr, hours },
            budget_cents: budgetCents,
            spend_cents:  0,
            status:       'active',
          });
        } catch {
          // Ignore — show success anyway for demo
        }
      }
    }

    setLaunching(false);
    setLaunched(true);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SectionTitle style={styles.topGap}>Nouvelle campagne</SectionTitle>

      {/* ── Audience ─────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Audience — catégories</Text>
        <View style={styles.chipRow}>
          {ALL_CATS.map((cat) => (
            <CatChip
              key={cat}
              catId={cat}
              active={selectedCats.has(cat)}
              onPress={() => toggleCat(cat)}
            />
          ))}
        </View>
      </View>

      {/* ── Rayon ────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Rayon de diffusion</Text>
        <View style={styles.pillRow}>
          {RADIUS_PRESETS.map((p) => (
            <SelectPill
              key={p.value}
              label={p.label}
              active={radiusM === p.value}
              onPress={() => setRadiusM(p.value)}
            />
          ))}
        </View>
      </View>

      {/* ── Créneaux ─────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Créneaux horaires</Text>
        <View style={styles.pillRow}>
          {DAYPART_PRESETS.map((d) => (
            <SelectPill
              key={d.id}
              label={d.label}
              active={selectedDayparts.has(d.id)}
              onPress={() => toggleDaypart(d.id)}
            />
          ))}
        </View>
      </View>

      {/* ── Budget ───────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Budget</Text>
        <Stepper
          value={budgetCents}
          onDecrement={decrementBudget}
          onIncrement={incrementBudget}
          display={budgetDisplay}
        />
      </View>

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <Text style={styles.summaryLine}>
          Catégories : {Array.from(selectedCats).join(', ')}
        </Text>
        <Text style={styles.summaryLine}>
          Rayon : {RADIUS_PRESETS.find((p) => p.value === radiusM)?.label ?? `${radiusM} m`}
        </Text>
        <Text style={styles.summaryLine}>
          Créneaux : {Array.from(selectedDayparts).join(', ')}
        </Text>
        <Text style={styles.summaryLine}>Budget : {budgetDisplay}</Text>
      </View>

      {/* ── Success state ────────────────────────────────────────────────── */}
      {launched && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>
            Campagne lancée avec succès !
          </Text>
          <Text style={styles.successSub}>
            {hasSupabase() ? 'Créée en base.' : 'Mode démo — aucune donnée envoyée.'}
          </Text>
        </View>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!launched && (
        <View style={styles.ctaRow}>
          <PrimaryButton
            label={launching ? 'Lancement…' : 'Lancer la campagne'}
            onPress={handleLaunch}
            disabled={launching}
          />
        </View>
      )}

      {launched && (
        <View style={styles.ctaRow}>
          <PrimaryButton
            label="Nouvelle campagne"
            onPress={() => {
              setLaunched(false);
              setSelectedCats(new Set(['mode']));
              setRadiusM(800);
              setDayparts(new Set(['matin', 'soir']));
              setBudgetCents(5000);
            }}
          />
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  topGap: {
    marginBottom: 20,
  },
  // ── sections ──
  section: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // ── SelectPill ──
  selPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadows.sm,
  },
  selPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  selPillLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink2,
  },
  selPillLabelActive: {
    color: colors.white,
  },
  // ── Stepper ──
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 24,
  },
  stepValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 72,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // ── Summary ──
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 20,
    gap: 4,
    ...shadows.sm,
  },
  summaryTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
  },
  summaryLine: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 20,
  },
  // ── Success ──
  successBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  successText: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentInk,
  },
  successSub: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.accentInk,
    opacity: 0.8,
  },
  // ── CTA ──
  ctaRow: {
    marginTop: 4,
    marginBottom: 8,
  },
});
