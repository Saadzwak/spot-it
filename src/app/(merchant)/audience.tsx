// ============================================================================
// Audience — insights AGRÉGÉS (RGPD : jamais de donnée perso).
// Top offres par taux d'acceptation + répartition par catégorie, archétype
// d'acheteur et tranche de prix. Tout en agrégats.
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors, radius } from '@/design/tokens';
import { font } from '@/design/theme';
import { Card, SectionTitle, BrandAvatar } from '@/components';
import { DistributionBars, Skeleton } from '@/merchant/components';
import { useAudienceInsights } from '@/merchant/useMerchantData';

export default function Audience(): React.ReactElement {
  const { topOffers, byCategory, byPriceBand, archetypes, loading } = useAudienceInsights();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web' ? { width: maxWidth, alignSelf: 'center' } : {};

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Audience</Text>
      <View style={styles.privacyBadge}>
        <Text style={styles.privacyText}>
          Agrégats uniquement · aucune donnée personnelle (RGPD)
        </Text>
      </View>

      {/* ── Top offres ─────────────────────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Top offres par acceptation</SectionTitle>
      <Card style={styles.listCard}>
        {loading && topOffers.length === 0 ? (
          <View style={styles.skelPad}>
            <Skeleton height={48} radius={12} />
            <View style={{ height: 10 }} />
            <Skeleton height={48} radius={12} />
          </View>
        ) : topOffers.length === 0 ? (
          <EmptyRow label="Aucune statistique pour le moment." />
        ) : (
          topOffers.map(({ stat, offer }, idx) => (
            <View key={stat.offerId} style={[styles.offerRow, idx > 0 && styles.rowBorder]}>
              <Text style={styles.rank}>{idx + 1}</Text>
              <BrandAvatar offer={offer} size={40} />
              <View style={styles.offerMeta}>
                <Text style={styles.offerBrand} numberOfLines={1}>{offer.brand}</Text>
                <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
              </View>
              <Text style={styles.rate}>{Math.round(stat.acceptRate * 100)}%</Text>
            </View>
          ))
        )}
      </Card>

      {/* ── Répartition par catégorie ──────────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Répartition par catégorie</SectionTitle>
      <Card style={styles.distCard}>
        {loading && byCategory.length === 0
          ? <Skeleton height={120} radius={12} />
          : <DistributionBars items={byCategory} />}
      </Card>

      {/* ── Répartition par archétype d'acheteur ───────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Archétype d’acheteur</SectionTitle>
      <Card style={styles.distCard}>
        <DistributionBars
          items={archetypes.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji, pct: a.pct }))}
        />
      </Card>

      {/* ── Répartition par tranche de prix ────────────────────────────────── */}
      <SectionTitle style={styles.sectionGap}>Tranche de prix recherchée</SectionTitle>
      <Card style={styles.distCard}>
        {loading && byPriceBand.length === 0
          ? <Skeleton height={100} radius={12} />
          : <DistributionBars items={byPriceBand} />}
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function EmptyRow({ label }: { label: string }): React.ReactElement {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
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
    marginBottom: 10,
  },
  privacyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  privacyText: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    color: colors.accentInk,
  },
  sectionGap: { marginTop: 28, marginBottom: 12 },
  listCard: { paddingVertical: 4 },
  distCard: { padding: 18 },
  skelPad: { padding: 14 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rank: {
    fontFamily: font.displaySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink3,
    width: 18,
    textAlign: 'center',
  },
  offerMeta: { flex: 1, gap: 2 },
  offerBrand: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  offerTitle: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
  rate: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
    minWidth: 40,
    textAlign: 'right',
  },
  empty: { padding: 28, alignItems: 'center' },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.ink3 },
});
