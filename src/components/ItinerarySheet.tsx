// ItinerarySheet — itinéraire détaillé façon Google Maps (turn-by-turn).
// Bottom sheet : en-tête offre + ETA, puis la liste des étapes en timeline.
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { colors, font, text, radius, shadows } from '@/design/theme';
import { Icon } from './Icon';
import type { RouteStep } from '@/map/MapWebView';

function fmtDist(m?: number): string {
  if (!m && m !== 0) return '';
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m)} m`;
}

function StepRow({ title, sub, last, end }: { title: string; sub?: string; last?: boolean; end?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, end && styles.dotEnd]} />
        {!last ? <View style={styles.lineBot} /> : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export function ItinerarySheet({
  visible, brand, image, durationMin, distanceM, steps, onClose, onSeeOffer,
}: {
  visible: boolean;
  brand?: string;
  image?: string;
  durationMin?: number;
  distanceM?: number;
  steps?: RouteStep[];
  onClose: () => void;
  onSeeOffer?: () => void;
}) {
  const list = steps ?? [];
  // on retire l'étape "arrive" générique de Mapbox (remplacée par notre ligne d'arrivée brandée)
  const mid = list.filter((s) => (s.type || '').toLowerCase() !== 'arrive');
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Animated.View entering={FadeInUp.duration(380)} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.head}>
            {image ? <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.brand} numberOfLines={1}>{brand}</Text>
              <View style={styles.etaRow}>
                <Icon name="walk" size={15} color={colors.accentInk} />
                <Text style={styles.eta}>{durationMin ?? '·'} min à pied · {fmtDist(distanceM)}</Text>
              </View>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.close}><Icon name="close" size={20} color={colors.ink2} /></Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingTop: 6, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <StepRow title="Ta position" sub="Départ" end />
            {mid.map((s, i) => (
              <StepRow
                key={i}
                title={s.instruction || 'Continue tout droit'}
                sub={s.distanceM ? fmtDist(s.distanceM) : undefined}
              />
            ))}
            <StepRow title={brand ? `${brand} — arrivée` : 'Arrivée'} sub="Présente-toi en boutique" last end />
          </ScrollView>

          {onSeeOffer ? (
            <Pressable style={styles.offerBtn} onPress={onSeeOffer}>
              <Text style={styles.offerBtnTxt}>Voir l'offre</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,19,15,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, ...shadows.card,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  brand: { fontFamily: font.displayBold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  eta: { fontFamily: font.bodySemiBold, fontSize: 14, color: colors.ink2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  scroll: { maxHeight: 320, marginTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginTop: 3 },
  dotEnd: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.ink },
  lineBot: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  rowBody: { flex: 1, paddingBottom: 18 },
  rowTitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.ink, lineHeight: 20 },
  rowSub: { fontFamily: font.body, fontSize: 13, color: colors.ink3, marginTop: 2 },
  offerBtn: { marginTop: 8, backgroundColor: colors.accent, paddingVertical: 14, borderRadius: radius.card, alignItems: 'center', ...shadows.sm, shadowColor: colors.accent },
  offerBtnTxt: { fontFamily: font.bodyBold, fontSize: 15, color: '#fff' },
});

export default ItinerarySheet;
