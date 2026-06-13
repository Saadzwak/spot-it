import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SpotLogo, Icon } from '@/components';
import { colors, font, shadows, radius } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { MapWebView } from '@/map/MapWebView';
import { fireProximityNotification } from '@/geo/notify';

export default function MapScreen() {
  const router = useRouter();
  const offers = useStore((s) => s.offers);

  const simulate = () => {
    const target = offers.find((o) => o.sponsored) ?? offers[0];
    if (target) fireProximityNotification({ offerId: target.id, brand: target.brand, walkMin: target.walkMin });
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <SpotLogo size={22} />
        <Text style={styles.title}>Autour de toi</Text>
      </View>

      <View style={styles.mapWrap}>
        <MapWebView
          offers={offers}
          onSelectOffer={(id) => router.push({ pathname: '/offer/[id]', params: { id } })}
        />
        <Pressable style={styles.simulate} onPress={simulate} onLongPress={simulate}>
          <Icon name="bell" size={16} color="#fff" />
          <Text style={styles.simulateTxt}>Simuler la marche</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  title: { fontFamily: font.bodySemiBold, fontSize: 14, color: colors.ink2 },
  mapWrap: { flex: 1, overflow: 'hidden' },
  simulate: {
    position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999,
    ...shadows.card, shadowColor: colors.accent,
  },
  simulateTxt: { fontFamily: font.bodyBold, fontSize: 14, color: '#fff' },
});
