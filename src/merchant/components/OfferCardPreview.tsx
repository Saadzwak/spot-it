// ============================================================================
// OfferCardPreview — aperçu live de la carte d'offre pendant l'édition.
// Reflète le rendu côté shopper : héro duotone (ou image) + méta.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, categories, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { Sponsored } from '@/components';
import type { Category, PriceBand, OfferType } from '@/types/contracts';

export interface OfferDraft {
  brand: string;
  title: string;
  category: Category;
  priceBand: PriceBand;
  offerType: OfferType;
  sponsored: boolean;
  image?: string;
}

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  discount:  'Remise',
  gift:      'Cadeau',
  voucher:   'Bon d’achat',
  exclusive: 'Exclusivité',
  bogo:      '2 pour 1',
};

const PRICE_LABELS: Record<PriceBand, string> = {
  '0-20': '0–20 €', '20-50': '20–50 €', '50-100': '50–100 €', '100+': '100 € +',
};

export function OfferCardPreview({ draft }: { draft: OfferDraft }): React.ReactElement {
  const cat = categories[draft.category];
  const grad: [string, string] = [cat.hue, cat.tint];
  const hasImage = Boolean(draft.image && draft.image.startsWith('http'));

  return (
    <View style={styles.card}>
      {/* Héro */}
      <View style={styles.hero}>
        {hasImage ? (
          <Image source={{ uri: draft.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient
            colors={grad}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.heroTop}>
          {draft.sponsored && <Sponsored dark={hasImage} />}
        </View>
        <Text style={[styles.brand, { color: hasImage ? '#fff' : '#fff' }]} numberOfLines={1}>
          {draft.brand || 'Votre enseigne'}
        </Text>
      </View>

      {/* Corps */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {draft.title || 'Titre de votre offre'}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: cat.tint }]}>
            <View style={[styles.dot, { backgroundColor: cat.hue }]} />
            <Text style={[styles.chipLabel, { color: cat.hue }]}>{cat.label}</Text>
          </View>
          <View style={styles.chipMuted}>
            <Text style={styles.chipMutedLabel}>{OFFER_TYPE_LABELS[draft.offerType]}</Text>
          </View>
          <View style={styles.chipMuted}>
            <Text style={styles.chipMutedLabel}>{PRICE_LABELS[draft.priceBand]}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  hero: {
    height: 150,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  brand: {
    fontFamily: font.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: font.bodySemiBold,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 23,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  chipLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  chipMuted: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  chipMutedLabel: {
    fontFamily: font.bodyMedium,
    fontSize: 13,
    color: colors.ink2,
  },
});

export default OfferCardPreview;
