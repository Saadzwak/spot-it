import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, SpotLogo, Icon } from '@/components';
import { colors, font, shadows, radius, text } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { rankOffers } from '@/learning/features';
import { MapWebView, type MapEta } from '@/map/MapWebView';
import { useRealLocation } from '@/geo/useLocation';
import { fireProximityNotification } from '@/geo/notify';
import { track } from '@/lib/track';
import { DEMO_USER } from '@/data/offers.seed';

const CARD_W = 116; // 104 + gap 12

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ route?: string }>();
  useRealLocation();
  const offers = useStore((s) => s.offers);
  const taste = useStore((s) => s.taste);
  const userLoc = useStore((s) => s.userLoc);
  const matchedIds = useStore((s) => s.matchedIds);
  const headline = useStore((s) => s.intentHeadline);
  const intentTxt = useStore((s) => s.intent);

  const ranked = useMemo(() => {
    const base = matchedIds ? offers.filter((o) => matchedIds.includes(o.id)) : offers;
    // garde l'ordre de l'agent quand il y a une sélection ; sinon bandit
    if (matchedIds) {
      const order = new Map(matchedIds.map((id, i) => [id, i]));
      return base.slice().sort((a, b) => (order.get(a.id)! - order.get(b.id)!)).slice(0, 24);
    }
    return rankOffers(taste, base).slice(0, 24);
  }, [offers, taste, matchedIds]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eta, setEta] = useState<MapEta | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const select = (id: string | null) => { setSelectedId(id); setEta(null); if (id) track('offer_select', { offerId: id }); };

  useEffect(() => { if (params.route) select(String(params.route)); }, [params.route]);
  // nettoie une sélection devenue hors-filtre, sans écraser un itinéraire demandé
  useEffect(() => {
    if (!params.route && selectedId && matchedIds && !matchedIds.includes(selectedId)) select(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);
  // sync carrousel : défile vers la carte sélectionnée
  useEffect(() => {
    const i = ranked.findIndex((o) => o.id === selectedId);
    if (i >= 0) scrollRef.current?.scrollTo({ x: Math.max(0, i * CARD_W - 20), animated: true });
  }, [selectedId, ranked]);

  const selected = ranked.find((o) => o.id === selectedId) ?? offers.find((o) => o.id === selectedId);
  const routeTo = selected && selected.lat != null && selected.lng != null
    ? { id: selected.id, lat: selected.lat, lng: selected.lng } : null;

  const simulate = () => {
    let id = selectedId ?? ranked[0]?.id ?? null;
    if (!selectedId && id) select(id);
    const target = ranked.find((o) => o.id === id) ?? offers.find((o) => o.id === id);
    if (target) { fireProximityNotification({ offerId: target.id, brand: target.brand, walkMin: target.walkMin }); track('simulate_walk', { offerId: target.id }); }
  };

  const empty = matchedIds != null && ranked.length === 0;
  const carouselTitle = `Top ${ranked.length} pour toi`;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <SpotLogo size={22} />
        <Text style={styles.title} numberOfLines={1}>{intentTxt ? `« ${intentTxt} »` : 'Autour de toi'}</Text>
      </View>

      <View style={styles.mapWrap}>
        <MapWebView
          offers={ranked}
          center={userLoc ?? DEMO_USER}
          routeTo={routeTo}
          onSelectOffer={(id) => select(id)}
          onEta={(e) => setEta(e)}
        />

        <Pressable style={styles.arBtn} onPress={() => router.push('/ar')}>
          <Icon name="target" size={18} color="#fff" /><Text style={styles.btnTxt}>Vue AR</Text>
        </Pressable>
        <Pressable style={styles.simulate} onPress={simulate}>
          <Icon name="walk" size={16} color="#fff" /><Text style={styles.btnTxt}>Simuler la marche</Text>
        </Pressable>

        {empty ? (
          <View style={styles.empty} pointerEvents="box-none">
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Rien trouvé près de toi</Text>
              <Text style={styles.emptyBody}>Aucune offre ne correspond vraiment à ta recherche dans ta zone.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/discover')}>
                <Text style={styles.emptyBtnTxt}>Nouvelle recherche</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Bandeau itinéraire (offre sélectionnée) */}
      {selected && eta && !eta.error ? (
        <View style={styles.etaBar}>
          {selected.image ? <Image source={{ uri: selected.image }} style={styles.etaThumb} contentFit="cover" /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.etaBrand} numberOfLines={1}>{selected.brand}</Text>
            <Text style={styles.etaInfo}>{eta.durationMin} min à pied · {eta.distanceM} m</Text>
          </View>
          <Pressable style={styles.etaGo} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: selected.id } })}>
            <Text style={styles.etaGoTxt}>Voir l'offre</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={() => select(null)} style={styles.etaClose}>
            <Icon name="close" size={18} color={colors.ink2} />
          </Pressable>
        </View>
      ) : null}

      {/* Carrousel des offres (synchro carte) */}
      {!empty && ranked.length > 0 ? (
        <View style={styles.carouselWrap}>
          <Text style={styles.carouselTitle}>{carouselTitle}</Text>
          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {ranked.map((o, i) => {
              const on = o.id === selectedId;
              return (
                <Pressable key={o.id} style={styles.cardSq} onPress={() => select(o.id)}>
                  <View style={[styles.thumbWrap, on && styles.thumbOn]}>
                    {o.image ? <Image source={{ uri: o.image }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: o.grad?.[0] ?? colors.ink2 }]} />}
                    <View style={styles.rank}><Text style={styles.rankTxt}>{i + 1}</Text></View>
                  </View>
                  <Text style={[styles.cardBrand, on && { color: colors.accentInk }]} numberOfLines={1}>{o.brand}</Text>
                  <Text style={styles.cardDist} numberOfLines={1}>{o.walkMin ?? '?'} min</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, gap: 12 },
  title: { fontFamily: font.bodySemiBold, fontSize: 14, color: colors.ink2, flexShrink: 1 },
  mapWrap: { flex: 1, overflow: 'hidden' },
  arBtn: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, ...shadows.card },
  simulate: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, ...shadows.card, shadowColor: colors.accent },
  btnTxt: { fontFamily: font.bodyBold, fontSize: 13, color: '#fff' },
  empty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 22, gap: 8, alignItems: 'center', ...shadows.card, maxWidth: 320 },
  emptyTitle: { ...text.h2, textAlign: 'center' },
  emptyBody: { ...text.body, textAlign: 'center' },
  emptyBtn: { marginTop: 6, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  emptyBtnTxt: { fontFamily: font.bodyBold, fontSize: 14, color: '#fff' },
  carouselWrap: { paddingTop: 10, paddingBottom: 12, backgroundColor: colors.canvas },
  carouselTitle: { fontFamily: font.displaySemiBold, fontSize: 16, color: colors.ink, paddingHorizontal: 16, marginBottom: 8 },
  carousel: { paddingHorizontal: 16, gap: 12 },
  cardSq: { width: 104 },
  thumbWrap: { width: 104, height: 104, borderRadius: 18, overflow: 'hidden', ...shadows.sm, borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: colors.accent },
  thumb: { width: 104, height: 104 },
  rank: { position: 'absolute', top: 6, left: 6, minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  rankTxt: { fontFamily: font.bodyBold, fontSize: 12, color: '#fff' },
  cardBrand: { fontFamily: font.bodySemiBold, fontSize: 13, color: colors.ink, marginTop: 6 },
  cardDist: { fontFamily: font.body, fontSize: 12, color: colors.ink3 },
  etaBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12, marginTop: 10, padding: 10, borderRadius: radius.card, backgroundColor: colors.surface, ...shadows.card },
  etaThumb: { width: 48, height: 48, borderRadius: 12 },
  etaBrand: { fontFamily: font.displaySemiBold, fontSize: 16, color: colors.ink },
  etaInfo: { fontFamily: font.body, fontSize: 13, color: colors.ink2, marginTop: 1 },
  etaGo: { backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  etaGoTxt: { fontFamily: font.bodyBold, fontSize: 13, color: '#fff' },
  etaClose: { padding: 6 },
});
