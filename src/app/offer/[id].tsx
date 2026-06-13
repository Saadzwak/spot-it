import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandTile, WhyForYou, DistancePill, Sponsored, Icon, PrimaryButton, GhostButton } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { reasonFor } from '@/learning/features';

export default function OfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const offers = useStore((s) => s.offers);
  const taste = useStore((s) => s.taste);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);

  const offer = offers.find((o) => o.id === id);
  if (!offer) {
    return (
      <View style={styles.missing}>
        <Text style={text.body}>Offre introuvable.</Text>
        <GhostButton label="Retour" onPress={() => router.back()} />
      </View>
    );
  }
  const saved = wishlist.includes(offer.id);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <BrandTile offer={offer} rounded={0} showMark style={styles.fill} />
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
            <Icon name="chevronLeft" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.heroTop}>{offer.sponsored ? <Sponsored dark /> : null}</View>
          <View style={styles.heroBottom}>
            <Text style={styles.brand}>{offer.brand}</Text>
            <Text style={styles.offer}>{offer.title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ alignSelf: 'flex-start' }}>
            <DistancePill offer={offer} />
          </View>
          <WhyForYou text={reasonFor(taste, offer)} />
          {offer.description ? <Text style={styles.desc}>{offer.description}</Text> : null}
          {offer.address ? (
            <View style={styles.addr}>
              <Icon name="pin" size={16} color={colors.ink3} />
              <Text style={styles.addrTxt}>{offer.address}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={saved ? 'Dans ta wishlist' : 'Ajouter à la wishlist'}
            onPress={() => toggleWishlist(offer.id)}
            icon={<Icon name={saved ? 'heartFill' : 'heart'} size={18} color="#fff" />}
          />
        </View>
        <Pressable style={styles.mapBtn} onPress={() => router.push('/(tabs)/map')}>
          <Icon name="map" size={22} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hero: { height: 380, position: 'relative' },
  back: {
    position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  heroTop: { position: 'absolute', top: 56, right: 16 },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  brand: {
    fontFamily: font.displayBold, fontSize: 32, color: '#fff', letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 18,
  },
  offer: {
    fontFamily: font.bodySemiBold, fontSize: 17, color: '#fff', marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  body: { padding: 20, gap: 16 },
  desc: { ...text.body, color: colors.ink, lineHeight: 23 },
  addr: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addrTxt: { ...text.body, color: colors.ink2 },
  cta: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingBottom: 32, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.line,
  },
  mapBtn: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.line, ...shadows.sm,
  },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.canvas },
});
