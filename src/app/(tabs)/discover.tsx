import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Screen, SpotLogo, SpotMark, Icon, BrandTile, WhyForYou, DistancePill, Sponsored, PrimaryButton,
} from '@/components';
import { colors, radius, shadows, font, text, categories } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { reasonFor } from '@/learning/features';
import { SwipeDeck, type SwipeDeckHandle } from '@/swipe/SwipeDeck';
import type { Offer } from '@/types/contracts';

export default function DiscoverScreen() {
  const router = useRouter();
  const deck = useStore((s) => s.deck);
  const taste = useStore((s) => s.taste);
  const intent = useStore((s) => s.intent);
  const swipe = useStore((s) => s.swipe);
  const rebuildDeck = useStore((s) => s.rebuildDeck);
  const deckRef = useRef<SwipeDeckHandle>(null);

  useEffect(() => { if (deck.length === 0) rebuildDeck(); }, [deck.length, rebuildDeck]);

  const onSwipe = (offer: Offer, accepted: boolean) => swipe(offer.id, accepted);

  const renderCard = (offer: Offer, isTop: boolean) => {
    const cat = categories[offer.category];
    const why = isTop ? reasonFor(taste, offer) : offer.whyTemplate ?? '';
    return (
      <View style={styles.cardInner}>
        <BrandTile offer={offer} rounded={radius.card} showMark style={styles.fill} />
        <View style={styles.topRow}>
          <View>{offer.sponsored ? <Sponsored dark /> : null}</View>
          <DistancePill offer={offer} dark />
        </View>
        <View style={styles.bottom}>
          <View style={[styles.catPill]}>
            <View style={[styles.catDot, { backgroundColor: cat.hue }]} />
            <Text style={[styles.catLabel, { color: cat.hue }]}>{cat.label}</Text>
          </View>
          <Text style={styles.brand} numberOfLines={1}>{offer.brand}</Text>
          <Text style={styles.offerText} numberOfLines={2}>{offer.title}</Text>
          {why ? <WhyForYou text={why} dark compact /> : null}
        </View>
      </View>
    );
  };

  const renderOverlays = (likeStyle: any, nopeStyle: any) => (
    <>
      <Animated.View style={[styles.stamp, styles.stampLike, likeStyle]}>
        <Text style={[styles.stampTxt, { color: colors.accent }]}>J’AIME</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.stampNope, nopeStyle]}>
        <Text style={[styles.stampTxt, { color: '#7C756E' }]}>PASSE</Text>
      </Animated.View>
    </>
  );

  const top = deck[0];

  return (
    <Screen padded={false}>
      {/* top bar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <SpotLogo size={22} />
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Icon name="sliders" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <Pressable style={styles.agentChip} onPress={() => rebuildDeck()}>
          <Icon name="sparkle" size={18} color={colors.accent} />
          <Text style={[styles.agentTxt, intent ? styles.agentTxtActive : null]} numberOfLines={1}>
            {intent || 'Que cherches-tu aujourd’hui ?'}
          </Text>
          <Icon name="search" size={18} color={colors.ink3} />
        </Pressable>
      </View>

      {/* deck */}
      <View style={styles.deckWrap}>
        {deck.length > 0 ? (
          <SwipeDeck<Offer>
            ref={deckRef}
            data={deck}
            keyFor={(o) => o.id}
            renderCard={renderCard}
            renderOverlays={renderOverlays}
            onSwipe={onSwipe}
          />
        ) : (
          <View style={styles.empty}>
            <SpotMark size={52} />
            <Text style={styles.emptyTitle}>Tu as tout vu près de toi</Text>
            <Text style={styles.emptyBody}>Change ta recherche pour découvrir d’autres offres.</Text>
            <PrimaryButton label="Revoir les offres" onPress={rebuildDeck} />
          </View>
        )}
      </View>

      {/* actions */}
      {deck.length > 0 ? (
        <View style={styles.actions}>
          <RoundBtn icon="close" tint="#7C756E" onPress={() => deckRef.current?.swipeLeft()} />
          <RoundBtn icon="arrowUp" tint={colors.ink} small onPress={() => router.push('/(tabs)/map')} />
          <RoundBtn icon="heartFill" tint="#fff" bg={colors.accent} big onPress={() => deckRef.current?.swipeRight()} />
          <RoundBtn
            icon="chevronRight"
            tint={colors.ink}
            small
            onPress={() => top && router.push({ pathname: '/offer/[id]', params: { id: top.id } })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function RoundBtn({
  icon, tint, bg = colors.surface, big = false, small = false, onPress,
}: { icon: any; tint: string; bg?: string; big?: boolean; small?: boolean; onPress: () => void }) {
  const size = big ? 68 : small ? 50 : 58;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        bg === colors.accent ? styles.roundLike : styles.roundShadow,
      ]}
    >
      <Icon name={icon} size={big ? 30 : 22} color={tint} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.line, ...shadows.sm,
  },
  agentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 999, backgroundColor: colors.surface, ...shadows.sm,
  },
  agentTxt: { flex: 1, fontFamily: font.bodyMedium, fontSize: 15, color: colors.ink3 },
  agentTxtActive: { fontFamily: font.bodySemiBold, color: colors.ink },

  deckWrap: { flex: 1, marginHorizontal: 20, marginTop: 8, minHeight: 0 },
  cardInner: { flex: 1, borderRadius: radius.card, ...shadows.card },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topRow: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, gap: 12 },
  catPill: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontFamily: font.bodyBold, fontSize: 12 },
  brand: {
    fontFamily: font.displaySemiBold, fontSize: 26, color: '#fff', letterSpacing: -0.5, lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 18,
  },
  offerText: {
    fontFamily: font.bodySemiBold, fontSize: 16, color: '#fff', marginTop: -4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  stamp: {
    position: 'absolute', top: 70, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12,
    borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.14)',
  },
  stampLike: { left: 22, transform: [{ rotate: '-14deg' }], borderColor: colors.accent },
  stampNope: { right: 22, transform: [{ rotate: '14deg' }], borderColor: '#7C756E' },
  stampTxt: { fontFamily: font.displayBold, fontSize: 22, letterSpacing: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyTitle: { ...text.h2, textAlign: 'center' },
  emptyBody: { ...text.body, textAlign: 'center', maxWidth: 240 },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 16 },
  round: { alignItems: 'center', justifyContent: 'center' },
  roundShadow: { borderWidth: 0.5, borderColor: colors.line, ...shadows.sm },
  roundLike: { ...shadows.card, shadowColor: colors.accent },
});
