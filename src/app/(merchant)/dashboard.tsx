// ============================================================================
// Dashboard — KPIs riches + variation vs période précédente + sélecteur 7j/30j
// + graphe barres (Views) + entonnoir de conversion + Dépense Meta-Ads-style.
// Skeletons, UI optimiste.
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { Card, SectionTitle } from '@/components';
import {
  KpiCard,
  BarChart,
  Funnel,
  Segmented,
  Skeleton,
} from '@/merchant/components';
import { useStoreKpis } from '@/merchant/useMerchantData';
import {
  calcRoiMultiplier,
  dailySeriesFor,
  spendModelFor,
  spendSeriesFor,
  type Period,
} from '@/merchant/mock';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + ' k';
  return String(n);
}

function fmtEuros(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) return (euros / 1000).toFixed(1) + ' k€';
  return euros.toFixed(0) + ' €';
}

function delta(cur: number, prev: number | undefined): number | undefined {
  if (prev === undefined || prev === 0) return undefined;
  return (cur - prev) / prev;
}

function roiPct(spendCents: number, revenueCents: number): number {
  if (spendCents <= 0) return 0;
  return Math.round(((revenueCents - spendCents) / spendCents) * 100);
}

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: '7 jours', value: '7j' },
  { label: '30 jours', value: '30j' },
];

// ── SpendBreakdown bar (horizontal) ──────────────────────────────────────────

function SpendBreakdownBar({ fixedCents, variableCents }: { fixedCents: number; variableCents: number }): React.ReactElement {
  const total = fixedCents + variableCents;
  const fixedPct = total > 0 ? (fixedCents / total) * 100 : 0;
  const varPct = 100 - fixedPct;

  return (
    <View style={spendStyles.breakBar}>
      <View style={[spendStyles.breakFixed, { width: `${fixedPct.toFixed(1)}%` as `${number}%` }]} />
      <View style={[spendStyles.breakVariable, { width: `${varPct.toFixed(1)}%` as `${number}%` }]} />
    </View>
  );
}

// ── SpendDetailCard ───────────────────────────────────────────────────────────

function SpendDetailCard({ period }: { period: Period }): React.ReactElement {
  const model = useMemo(() => spendModelFor(period), [period]);
  const series = useMemo(() => spendSeriesFor(period), [period]);

  // Total-spend series for BarChart
  const totalSeries = useMemo(
    () => series.map((d) => ({ label: d.label, value: d.fixed + d.variable })),
    [series],
  );

  const fixedPct = model.totalCents > 0
    ? Math.round((model.fixedCents / model.totalCents) * 100)
    : 0;
  const varPct = 100 - fixedPct;

  return (
    <Card style={spendStyles.card}>
      {/* Fixed + Variable breakdown rows */}
      <View style={spendStyles.rowItem}>
        <View style={[spendStyles.dot, { backgroundColor: '#A9794E' }]} />
        <Text style={spendStyles.rowLabel}>{model.fixedLabel}</Text>
        <Text style={spendStyles.rowValue}>{fmtEuros(model.fixedCents)}</Text>
        <Text style={spendStyles.rowPct}>{fixedPct} %</Text>
      </View>
      <View style={spendStyles.divider} />
      <View style={spendStyles.rowItem}>
        <View style={[spendStyles.dot, { backgroundColor: colors.accent }]} />
        <Text style={spendStyles.rowLabel}>{model.variableLabel}</Text>
        <Text style={spendStyles.rowValue}>{fmtEuros(model.variableCents)}</Text>
        <Text style={spendStyles.rowPct}>{varPct} %</Text>
      </View>
      <View style={spendStyles.divider} />

      {/* Proportion bar + legend */}
      <SpendBreakdownBar fixedCents={model.fixedCents} variableCents={model.variableCents} />
      <View style={spendStyles.legend}>
        <View style={spendStyles.legendItem}>
          <View style={[spendStyles.legendDot, { backgroundColor: '#A9794E' }]} />
          <Text style={spendStyles.legendLabel}>Forfait</Text>
        </View>
        <View style={spendStyles.legendItem}>
          <View style={[spendStyles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={spendStyles.legendLabel}>Sponsoring</Text>
        </View>
      </View>

      {/* Total */}
      <View style={[spendStyles.totalRow, { marginTop: 14 }]}>
        <Text style={spendStyles.totalLabel}>Total</Text>
        <Text style={spendStyles.totalValue}>{fmtEuros(model.totalCents)}</Text>
      </View>

      {/* Spend over time chart */}
      <Text style={spendStyles.chartTitle}>Dépense totale / jour</Text>
      <BarChart data={totalSeries} height={120} />
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Dashboard(): React.ReactElement {
  const [period, setPeriod] = useState<Period>('7j');
  const { kpis, prev, loading, live } = useStoreKpis(period);
  const centered: object = { width: '100%', maxWidth: 960, alignSelf: 'center' };

  const series = useMemo(() => dailySeriesFor(period), [period]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header : titre + sélecteur période ────────────────────────────── */}
      <View style={styles.headRow}>
        <View>
          <Text style={styles.h1}>Performances</Text>
          <Text style={styles.sub}>
            {live ? 'Données temps réel' : 'Données de démonstration'}
          </Text>
        </View>
        <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </View>

      {loading && !kpis ? (
        <KpiGridSkeleton />
      ) : (
        <KpiGrid kpis={kpis!} prev={prev} />
      )}

      {/* ── Graphe impressions ─────────────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>
        Impressions · {period === '7j' ? '7 derniers jours' : '30 derniers jours'}
      </SectionTitle>
      <Card style={styles.chartCard}>
        {loading && !kpis ? (
          <Skeleton height={150} radius={12} />
        ) : (
          <BarChart data={series} height={150} />
        )}
      </Card>

      {/* ── Dépense — détail Meta-Ads style ───────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Dépense publicitaire</SectionTitle>
      {loading && !kpis ? (
        <Card style={styles.chartCard}><Skeleton height={260} radius={12} /></Card>
      ) : (
        <SpendDetailCard period={period} />
      )}

      {/* ── Entonnoir de conversion ────────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Entonnoir de conversion</SectionTitle>
      <Card style={styles.funnelCard}>
        {loading && !kpis ? (
          <Skeleton height={180} radius={12} />
        ) : (
          <Funnel
            steps={[
              { label: 'Impressions', value: kpis!.impressions },
              { label: 'Clics',       value: kpis!.clicks },
              { label: 'Visites',     value: kpis!.visits },
              { label: 'Achats',      value: kpis!.conversions },
            ]}
          />
        )}
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ── KPI grid ───────────────────────────────────────────────────────────────────

function KpiGrid({ kpis: k, prev }: { kpis: NonNullable<ReturnType<typeof useStoreKpis>['kpis']>; prev: ReturnType<typeof useStoreKpis>['prev'] }): React.ReactElement {
  const roi = roiPct(k.spendCents, k.revenueCents);
  const prevRoi = prev ? roiPct(prev.spendCents, prev.revenueCents) : undefined;

  return (
    <View style={styles.kpiGrid}>
      <KpiCard index={0} label="Impressions" value={fmt(k.impressions)} deltaPct={delta(k.impressions, prev?.impressions)} />
      <KpiCard index={1} label="Clics"       value={fmt(k.clicks)}      deltaPct={delta(k.clicks, prev?.clicks)} />
      <KpiCard index={2} label="Visites"     value={fmt(k.visits)}      deltaPct={delta(k.visits, prev?.visits)} />
      <KpiCard index={3} label="Conversions" value={fmt(k.conversions)} deltaPct={delta(k.conversions, prev?.conversions)} />
      <KpiCard index={4} label="Chiffre d'affaires" value={fmtEuros(k.revenueCents)} deltaPct={delta(k.revenueCents, prev?.revenueCents)} />
      <KpiCard index={5} label="Dépense"     value={fmtEuros(k.spendCents)} deltaPct={delta(k.spendCents, prev?.spendCents)} goodWhenUp={false} />
      <KpiCard
        index={6}
        label={`ROI · ${calcRoiMultiplier(k.spendCents, k.revenueCents)}× retour`}
        value={`${roi} %`}
        deltaPct={delta(roi, prevRoi)}
        accent
      />
    </View>
  );
}

function KpiGridSkeleton(): React.ReactElement {
  return (
    <View style={styles.kpiGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.kpiSkeletonTile}>
          <Skeleton width="60%" height={26} radius={8} />
          <View style={{ height: 10 }} />
          <Skeleton width="40%" height={12} radius={6} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingTop: 20 },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  h1: {
    fontFamily: font.displayBold,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.ink,
  },
  sub: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink3,
    marginTop: 2,
  },
  sectionGap: { marginTop: 28, marginBottom: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiSkeletonTile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    ...shadows.sm,
  },
  chartCard: { padding: 16, paddingBottom: 12 },
  funnelCard: { padding: 18 },
});

const spendStyles = StyleSheet.create({
  card: { padding: 18, gap: 0 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: {
    flex: 1,
    fontFamily: font.bodyMedium,
    fontSize: 14,
    color: colors.ink2,
  },
  rowValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  rowPct: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    color: colors.ink3,
    minWidth: 38,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: colors.line },
  breakBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 14,
    backgroundColor: colors.canvas,
  },
  breakFixed: {
    backgroundColor: '#A9794E',
    height: '100%',
  },
  breakVariable: {
    backgroundColor: colors.accent,
    height: '100%',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 14,
  },
  totalLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  totalValue: {
    fontFamily: font.displayBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  chartTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink3,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
});
