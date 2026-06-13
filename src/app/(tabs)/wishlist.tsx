import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotMark, BrandAvatar, DistancePill, Icon, SectionTitle } from '@/components';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';

export default function WishlistScreen() {
  const router = useRouter();
  const offers = useStore((s) => s.offers);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const items = offers.filter((o) => wishlist.includes(o.id));

  return (
    <Screen scroll padded>
      <View style={styles.head}>
        <SectionTitle>Wishlist</SectionTitle>
        <Text style={styles.count}>{items.length} offre{items.length > 1 ? 's' : ''}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <SpotMark size={44} />
          <Text style={styles.emptyTitle}>Rien d’enregistré (encore)</Text>
          <Text style={styles.emptyBody}>Swipe à droite sur Découvrir pour garder une offre ici.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((o) => (
            <Pressable
              key={o.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/offer/[id]', params: { id: o.id } })}
            >
              <BrandAvatar offer={o} size={52} ring />
              <View style={styles.rowMid}>
                <Text style={styles.brand} numberOfLines={1}>{o.brand}</Text>
                <Text style={styles.offer} numberOfLines={1}>{o.title}</Text>
                <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                  <DistancePill offer={o} />
                </View>
              </View>
              <Pressable hitSlop={10} onPress={() => toggleWishlist(o.id)} style={styles.heart}>
                <Icon name="heartFill" size={22} color={colors.accent} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 8 },
  count: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.ink3 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 80 },
  emptyTitle: { ...text.h2, textAlign: 'center' },
  emptyBody: { ...text.body, textAlign: 'center', maxWidth: 240 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
    borderRadius: radius.card, padding: 14, ...shadows.sm,
  },
  rowMid: { flex: 1, minWidth: 0 },
  brand: { fontFamily: font.displaySemiBold, fontSize: 17, color: colors.ink },
  offer: { fontFamily: font.body, fontSize: 14, color: colors.ink2, marginTop: 2 },
  heart: { padding: 4 },
});
