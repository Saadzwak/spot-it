// ============================================================================
// Ciblage — campagne : audience (catégories + archétypes + tranches prix),
// rayon, créneaux, budget (stepper), portée estimée, lancer / pause.
// Feature: tap campagne existante → panneau détail complet.
// Tout en Views + Pressable. UI optimiste, écriture best-effort en réel.
// ============================================================================

import React, { useMemo, useState } from 'react';
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
import { SectionTitle, PrimaryButton, CatChip, Card } from '@/components';
import { SelectPill, Stepper } from '@/merchant/components';
import { useCampaigns } from '@/merchant/useMerchantData';
import {
  campaignLabel,
  CATEGORY_LABELS,
  PRICE_BAND_LABELS,
  ARCHETYPE_LABELS,
  type MerchantCampaign,
} from '@/merchant/mock';
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

const CAT_POOL: Record<Category, number> = { mode: 5200, tech: 3100, maison: 2400, beaute: 3800 };
const RADIUS_FACTOR: Record<number, number> = { 400: 0.5, 800: 1, 1500: 1.9 };

// ── Campaign Detail Panel ─────────────────────────────────────────────────────

function CampaignDetailPanel({
  campaign,
  onClose,
  onPauseResume,
}: {
  campaign: MerchantCampaign;
  onClose: () => void;
  onPauseResume: () => void;
}): React.ReactElement {
  const active = campaign.status === 'active';
  const fmtEuros = (cents: number) => `${(cents / 100).toFixed(0)} €`;

  const spendPct = campaign.budgetCents > 0
    ? Math.min(100, Math.round((campaign.spendCents / campaign.budgetCents) * 100))
    : 0;

  const ctr = campaign.impressions && campaign.clicks && campaign.impressions > 0
    ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(1)} %`
    : '—';

  const radiusLabel = campaign.radiusM >= 1000
    ? `${(campaign.radiusM / 1000).toLocaleString('fr-FR')} km`
    : `${campaign.radiusM} m`;

  const daypartLabels = DAYPART_PRESETS
    .filter((d) => campaign.dayparts?.includes(d.id))
    .map((d) => d.label);

  const archetypeLabels = (campaign.archetypes ?? []).map(
    (a) => ARCHETYPE_LABELS[a] ?? a,
  );

  const priceBandLabels = (campaign.priceBands ?? []).map(
    (p) => PRICE_BAND_LABELS[p],
  );

  return (
    <View>
      {/* Header */}
      <View style={detailStyles.head}>
        <Pressable onPress={onClose} hitSlop={8} style={detailStyles.backBtn} accessibilityLabel="Retour">
          <Text style={detailStyles.backLabel}>← Retour</Text>
        </Pressable>
        <Pressable
          onPress={onPauseResume}
          style={({ pressed }) => [
            detailStyles.toggleBtn,
            { backgroundColor: active ? colors.canvas : colors.accentSoft },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[detailStyles.toggleBtnText, { color: active ? colors.ink2 : colors.accent }]}>
            {active ? 'Mettre en pause' : 'Reprendre'}
          </Text>
        </Pressable>
      </View>

      {/* Status + Label */}
      <View style={detailStyles.statusRow}>
        <View style={[detailStyles.statusDot, { backgroundColor: active ? '#1FA463' : colors.ink3 }]} />
        <Text style={detailStyles.statusLabel}>{active ? 'Active' : 'En pause'}</Text>
      </View>
      <Text style={detailStyles.campaignTitle}>{campaignLabel(campaign)}</Text>

      {/* Budget progress */}
      <Card style={detailStyles.budgetCard}>
        <View style={detailStyles.budgetRow}>
          <Text style={detailStyles.budgetLabel}>Dépensé</Text>
          <Text style={detailStyles.budgetValue}>{fmtEuros(campaign.spendCents)} / {fmtEuros(campaign.budgetCents)}</Text>
        </View>
        <View style={detailStyles.progressTrack}>
          <View style={[detailStyles.progressFill, { width: `${spendPct}%` as `${number}%` }]} />
        </View>
        <Text style={detailStyles.budgetPct}>{spendPct} % du budget consommé</Text>
      </Card>

      {/* Performance KPIs */}
      <SectionTitle style={detailStyles.sectionTitle}>Performance</SectionTitle>
      <View style={detailStyles.kpiGrid}>
        <View style={detailStyles.kpiTile}>
          <Text style={detailStyles.kpiValue}>
            {campaign.impressions ? campaign.impressions.toLocaleString('fr-FR') : '—'}
          </Text>
          <Text style={detailStyles.kpiLabel}>Impressions</Text>
        </View>
        <View style={detailStyles.kpiTile}>
          <Text style={detailStyles.kpiValue}>
            {campaign.clicks ? campaign.clicks.toLocaleString('fr-FR') : '—'}
          </Text>
          <Text style={detailStyles.kpiLabel}>Clics</Text>
        </View>
        <View style={detailStyles.kpiTile}>
          <Text style={detailStyles.kpiValue}>{ctr}</Text>
          <Text style={detailStyles.kpiLabel}>CTR</Text>
        </View>
        <View style={detailStyles.kpiTile}>
          <Text style={detailStyles.kpiValue}>
            {campaign.conversions != null ? String(campaign.conversions) : '—'}
          </Text>
          <Text style={detailStyles.kpiLabel}>Conversions</Text>
        </View>
      </View>

      {/* Audience criteria */}
      <SectionTitle style={detailStyles.sectionTitle}>Critères d'audience</SectionTitle>
      <Card style={detailStyles.criteriaCard}>
        {/* Catégories */}
        <View style={detailStyles.criteriaRow}>
          <Text style={detailStyles.criteriaKey}>Catégories</Text>
          <View style={detailStyles.criteriaTagRow}>
            {campaign.categories.map((c) => (
              <View key={c} style={detailStyles.tag}>
                <Text style={detailStyles.tagText}>{CATEGORY_LABELS[c]}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={detailStyles.criteriaDivider} />

        {/* Rayon */}
        <View style={detailStyles.criteriaRow}>
          <Text style={detailStyles.criteriaKey}>Rayon</Text>
          <Text style={detailStyles.criteriaVal}>{radiusLabel}</Text>
        </View>

        {/* Créneaux */}
        {daypartLabels.length > 0 && (
          <>
            <View style={detailStyles.criteriaDivider} />
            <View style={detailStyles.criteriaRow}>
              <Text style={detailStyles.criteriaKey}>Créneaux</Text>
              <View style={detailStyles.criteriaTagRow}>
                {daypartLabels.map((d) => (
                  <View key={d} style={detailStyles.tag}>
                    <Text style={detailStyles.tagText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Archétypes */}
        {archetypeLabels.length > 0 && (
          <>
            <View style={detailStyles.criteriaDivider} />
            <View style={detailStyles.criteriaRow}>
              <Text style={detailStyles.criteriaKey}>Archétypes</Text>
              <View style={detailStyles.criteriaTagRow}>
                {archetypeLabels.map((a) => (
                  <View key={a} style={[detailStyles.tag, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[detailStyles.tagText, { color: colors.accentInk }]}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Tranches de prix */}
        {priceBandLabels.length > 0 && (
          <>
            <View style={detailStyles.criteriaDivider} />
            <View style={detailStyles.criteriaRow}>
              <Text style={detailStyles.criteriaKey}>Prix cibles</Text>
              <View style={detailStyles.criteriaTagRow}>
                {priceBandLabels.map((p) => (
                  <View key={p} style={detailStyles.tag}>
                    <Text style={detailStyles.tagText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Targeting(): React.ReactElement {
  const { width } = useWindowDimensions();
  const centered: object = { width: '100%', maxWidth: 960, alignSelf: 'center' };

  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(['mode']));
  const [selectedArchs, setArchs]       = useState<Set<string>>(new Set(['malin']));
  const [selectedBands, setBands]       = useState<Set<PriceBand>>(new Set(['50-100']));
  const [radiusM, setRadiusM]           = useState(800);
  const [selectedDayparts, setDayparts] = useState<Set<string>>(new Set(['matin', 'soir']));
  const [budgetCents, setBudgetCents]   = useState(5000);
  const [working, setWorking]           = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MerchantCampaign | null>(null);

  const { campaigns, setStatus: setCampaignStatus, add } = useCampaigns();

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

  const reach = useMemo(() => {
    const pool = Array.from(selectedCats).reduce((s, c) => s + CAT_POOL[c], 0);
    const rf = RADIUS_FACTOR[radiusM] ?? 1;
    const dp = DAYPART_PRESETS
      .filter((d) => selectedDayparts.has(d.id))
      .reduce((s, d) => s + d.weight, 0) || 0.25;
    const bandFactor = 0.6 + 0.1 * selectedBands.size;
    return Math.round((pool * rf * dp * bandFactor) / 100) * 100;
  }, [selectedCats, radiusM, selectedDayparts, selectedBands]);

  const handleLaunch = async () => {
    if (working) return;
    setWorking(true);
    await add({
      categories: Array.from(selectedCats),
      radiusM,
      budgetCents,
    });
    setWorking(false);
  };

  const fmtEuros = (cents: number) => `${(cents / 100).toFixed(0)} €`;

  // ── Campaign detail panel ──
  if (selectedCampaign) {
    // Keep an up-to-date view of the campaign (status might change via pause/resume)
    const liveCampaign = campaigns.find((c) => c.id === selectedCampaign.id) ?? selectedCampaign;
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, centered]}
        showsVerticalScrollIndicator={false}
      >
        <CampaignDetailPanel
          campaign={liveCampaign}
          onClose={() => setSelectedCampaign(null)}
          onPauseResume={() => {
            const active = liveCampaign.status === 'active';
            setCampaignStatus(liveCampaign.id, active ? 'paused' : 'active');
          }}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

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
        <Text style={styles.fieldLabel}>Archétypes d'acheteur</Text>
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

      {/* ── Lancer ─────────────────────────────────────────────────────────── */}
      <View style={styles.ctaRow}>
        <PrimaryButton
          label={working ? 'Lancement…' : 'Lancer la campagne'}
          onPress={handleLaunch}
          disabled={working}
        />
      </View>

      {/* ── Campagnes existantes ───────────────────────────────────────────── */}
      <SectionTitle style={styles.campaignsTitle}>Vos campagnes</SectionTitle>
      {campaigns.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune campagne active. Lancez-en une ci-dessus.</Text>
        </Card>
      ) : (
        <Card style={styles.campaignsCard}>
          {campaigns.map((c, idx) => {
            const active = c.status === 'active';
            return (
                    <View key={c.id} style={[styles.campaignRow, idx > 0 && styles.campaignBorder]}>
                <Pressable
                  style={styles.campaignTap}
                  onPress={() => setSelectedCampaign(c)}
                  accessibilityLabel={`Voir les détails de la campagne ${campaignLabel(c)}`}
                >
                  <View style={styles.campaignMeta}>
                    <View style={styles.campaignTop}>
                      <View style={[styles.statusDot, { backgroundColor: active ? '#1FA463' : colors.ink3 }]} />
                      <Text style={styles.campaignLabel} numberOfLines={1}>{campaignLabel(c)}</Text>
                    </View>
                    <Text style={styles.campaignSub}>
                      {fmtEuros(c.spendCents)} / {fmtEuros(c.budgetCents)} · {active ? 'active' : 'en pause'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCampaignStatus(c.id, active ? 'paused' : 'active')}
                  style={({ pressed }) => [styles.campaignBtn, pressed && { opacity: 0.6 }]}
                  accessibilityLabel={active ? 'Mettre en pause' : 'Reprendre'}
                >
                  <Text style={styles.campaignBtnText}>{active ? 'Pause' : 'Reprendre'}</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}

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
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  ctaRow: { marginTop: 4 },
  campaignsTitle: { marginTop: 32, marginBottom: 12 },
  emptyCard: { padding: 22, alignItems: 'center' },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.ink3, textAlign: 'center', lineHeight: 20 },
  campaignsCard: { paddingVertical: 4 },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.card,
  },
  campaignBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  campaignTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  campaignMeta: { flex: 1, gap: 4 },
  campaignTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campaignLabel: { flex: 1, fontFamily: font.bodySemiBold, fontSize: 14, fontWeight: '600', color: colors.ink },
  campaignSub: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
  campaignRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  campaignBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  campaignBtnText: { fontFamily: font.bodySemiBold, fontSize: 13, fontWeight: '600', color: colors.ink },
  chevron: {
    fontFamily: font.body,
    fontSize: 20,
    color: colors.ink3,
    lineHeight: 24,
  },
});

const detailStyles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backLabel: {
    fontFamily: font.bodyMedium,
    fontSize: 14,
    color: colors.ink2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  toggleBtnText: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  campaignTitle: {
    fontFamily: font.displayBold,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
    marginBottom: 20,
    lineHeight: 30,
  },
  budgetCard: { padding: 18, marginBottom: 4, gap: 10 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetLabel: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.ink2 },
  budgetValue: { fontFamily: font.bodySemiBold, fontSize: 15, fontWeight: '600', color: colors.ink },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.canvas,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  budgetPct: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
  sectionTitle: { marginTop: 24, marginBottom: 12 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  kpiTile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
    ...shadows.sm,
  },
  kpiValue: {
    fontFamily: font.displayBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  kpiLabel: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
  criteriaCard: { padding: 0, overflow: 'hidden' },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  criteriaKey: {
    fontFamily: font.bodyMedium,
    fontSize: 13,
    color: colors.ink3,
    minWidth: 80,
    paddingTop: 2,
  },
  criteriaVal: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  criteriaTagRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  criteriaDivider: { height: 1, backgroundColor: colors.line, marginHorizontal: 18 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  tagText: {
    fontFamily: font.bodyMedium,
    fontSize: 13,
    color: colors.ink2,
  },
});
