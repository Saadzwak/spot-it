// ============================================================================
// Dashboard — KPI tiles + bar chart + Top offres
// ============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors, radius, shadows } from '@/design/tokens';
import { font, text } from '@/design/theme';
import { Card, SectionTitle, BrandAvatar } from '@/components';
import { useStoreKpis, useOfferStats, useOfferLookup } from '@/merchant/useMerchantData';
import { MOCK_DAILY_IMPRESSIONS, calcRoiMultiplier } from '@/merchant/mock';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + ' k';
  return String(n);
}

function fmtEuros(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) return (euros / 1000).toFixed(1) + ' k€';
  return euros.toFixed(0) + ' €';
}

// ── KPI tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.kpiTile, accent && styles.kpiTileAccent]}>
      <Text style={[styles.kpiValue, accent && styles.kpiValueAccent]}>{value}</Text>
      <Text style={[styles.kpiLabel, accent && styles.kpiLabelAccent]}>{label}</Text>
    </View>
  );
}

// ── Bar chart (pure View, no dependency) ─────────────────────────────────────

function BarChart({
  data,
}: {
  data: { label: string; value: number }[];
}): React.ReactElement {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.chartWrap}>
      {data.map((d) => {
        const pct = d.value / max;
        return (
          <View key={d.label} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: `${Math.round(pct * 100)}%` as unknown as number }]} />
            </View>
            <Text style={styles.barLabel}>{d.label}</Text>
            <Text style={styles.barValue}>{fmt(d.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── AcceptRate bar ────────────────────────────────────────────────────────────

function AcceptBar({ rate }: { rate: number }): React.ReactElement {
  return (
    <View style={styles.acceptTrack}>
      <View style={[styles.acceptFill, { width: `${Math.round(rate * 100)}%` as unknown as number }]} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Dashboard(): React.ReactElement {
  const { kpis, loading } = useStoreKpis();
  const { stats } = useOfferStats();
  const offerLookup = useOfferLookup();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web' ? { width: maxWidth, alignSelf: 'center' } : {};

  const roi = useMemo(() => {
    if (!kpis) return 0;
    return calcRoiMultiplier(kpis.spendCents, kpis.revenueCents);
  }, [kpis]);

  // Top 5 offers by accept rate
  const topStats = useMemo(
    () => [...stats].sort((a, b) => b.acceptRate - a.acceptRate).slice(0, 5),
    [stats],
  );

  if (loading && !kpis) {
    return (
      <View style={styles.center}>
        <Text style={text.caption}>Chargement…</Text>
      </View>
    );
  }

  const k = kpis!;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── KPI grid ──────────────────────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Performances</SectionTitle>
      <View style={styles.kpiGrid}>
        <KpiTile label="Impressions"  value={fmt(k.impressions)} />
        <KpiTile label="Clics"        value={fmt(k.clicks)} />
        <KpiTile label="Visites"      value={fmt(k.visits)} />
        <KpiTile label="Conversions"  value={fmt(k.conversions)} />
        <KpiTile label="ROI ×"        value={roi.toFixed(1) + '×'} accent />
        <KpiTile label="Dépense"      value={fmtEuros(k.spendCents)} />
      </View>

      {/* ── Weekly impressions chart ──────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Impressions (7 jours)</SectionTitle>
      <Card style={styles.chartCard}>
        <BarChart data={MOCK_DAILY_IMPRESSIONS} />
      </Card>

      {/* ── Top offres ────────────────────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Top offres</SectionTitle>
      <Card style={styles.listCard}>
        {topStats.map((stat, idx) => {
          const offer = offerLookup.get(stat.offerId);
          if (!offer) return null;
          return (
            <View key={stat.offerId} style={[styles.offerRow, idx > 0 && styles.offerRowBorder]}>
              <BrandAvatar offer={offer} size={40} />
              <View style={styles.offerMeta}>
                <Text style={styles.offerBrand} numberOfLines={1}>{offer.brand}</Text>
                <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                <AcceptBar rate={stat.acceptRate} />
              </View>
              <Text style={styles.offerRate}>{Math.round(stat.acceptRate * 100)}%</Text>
            </View>
          );
        })}
      </Card>

      <View style={{ height: 32 }} />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionGap: {
    marginTop: 20,
    marginBottom: 12,
  },
  // ── KPI grid ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiTile: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    ...shadows.sm,
  },
  kpiTileAccent: {
    backgroundColor: colors.accent,
  },
  kpiValue: {
    fontFamily: font.displayBold,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 4,
  },
  kpiValueAccent: {
    color: colors.white,
  },
  kpiLabel: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink3,
  },
  kpiLabelAccent: {
    color: 'rgba(255,255,255,0.75)',
  },
  // ── Bar chart ──
  chartCard: {
    padding: 16,
    paddingBottom: 8,
  },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: font.body,
    fontSize: 10,
    color: colors.ink3,
    marginTop: 2,
  },
  barValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    color: colors.ink2,
  },
  // ── Top offres list ──
  listCard: {
    paddingVertical: 4,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  offerRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  offerMeta: {
    flex: 1,
    gap: 3,
  },
  offerBrand: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  offerTitle: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink3,
  },
  acceptTrack: {
    height: 4,
    backgroundColor: colors.canvas,
    borderRadius: 2,
    marginTop: 2,
    overflow: 'hidden',
  },
  acceptFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  offerRate: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink2,
    minWidth: 36,
    textAlign: 'right',
  },
});
