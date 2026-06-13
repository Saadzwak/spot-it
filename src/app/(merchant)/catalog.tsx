// ============================================================================
// Catalogue — merchant's offers list with active toggle
// ============================================================================

import React, { useState, useMemo } from 'react';
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
import {
  Card,
  SectionTitle,
  PrimaryButton,
  BrandAvatar,
  CatDot,
  Toggle,
} from '@/components';
import { useMerchantOffers } from '@/merchant/useMerchantData';
import type { Offer, Category } from '@/types/contracts';

const CAT_LABELS: Record<Category, string> = {
  mode:   'Mode',
  tech:   'Tech',
  maison: 'Maison',
  beaute: 'Beauté',
};

export default function Catalog(): React.ReactElement {
  const { offers, loading } = useMerchantOffers();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web' ? { width: maxWidth, alignSelf: 'center' } : {};

  // Local active state per offer (demo: all start active)
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});

  const isActive = (id: string) => activeMap[id] ?? true;
  const toggle = (id: string) =>
    setActiveMap((prev) => ({ ...prev, [id]: !isActive(id) }));

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Offer[]> = {};
    for (const o of offers) {
      if (!groups[o.category]) groups[o.category] = [];
      groups[o.category].push(o);
    }
    return groups;
  }, [offers]);

  if (loading && offers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontFamily: font.body, color: colors.ink3 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header action ────────────────────────────────────────────────── */}
      <SectionTitle style={styles.topGap}>Mes offres</SectionTitle>
      <View style={styles.newOfferRow}>
        <PrimaryButton
          label="Nouvelle offre"
          onPress={() => {
            // Stub — not yet implemented
          }}
          disabled
        />
      </View>

      {/* ── Offers grouped by category ───────────────────────────────────── */}
      {(Object.keys(grouped) as Category[]).map((cat) => (
        <View key={cat}>
          <View style={styles.catHeader}>
            <CatDot catId={cat} size={9} />
            <Text style={styles.catLabel}>{CAT_LABELS[cat]}</Text>
          </View>
          <Card style={styles.groupCard}>
            {grouped[cat].map((offer, idx) => (
              <View
                key={offer.id}
                style={[styles.offerRow, idx > 0 && styles.rowBorder]}
              >
                <BrandAvatar offer={offer} size={42} />
                <View style={styles.offerMeta}>
                  <Text style={styles.offerBrand} numberOfLines={1}>
                    {offer.brand}
                  </Text>
                  <Text style={styles.offerTitle} numberOfLines={1}>
                    {offer.title}
                  </Text>
                </View>
                <Toggle
                  value={isActive(offer.id)}
                  onValueChange={() => toggle(offer.id)}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}

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
  topGap: {
    marginBottom: 12,
  },
  newOfferRow: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  catLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  groupCard: {
    paddingVertical: 4,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  offerMeta: {
    flex: 1,
    gap: 2,
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
    lineHeight: 16,
  },
});
