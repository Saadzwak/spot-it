// Réalité augmentée — caméra + cap boussole : les offres proches flottent à leur
// position réelle (relèvement + distance). Tap → détail. Compatible Expo Go.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Icon, BrandAvatar, PrimaryButton } from '@/components';
import { colors, font, text, shadows } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { rankOffers } from '@/learning/features';
import { DEMO_USER } from '@/data/offers.seed';

const { width: SW, height: SH } = Dimensions.get('window');
const FOV = 70; // champ de vision horizontal (deg)

function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toR = (d: number) => (d * Math.PI) / 180;
  const toD = (r: number) => (r * 180) / Math.PI;
  const dLng = toR(bLng - aLng);
  const y = Math.sin(dLng) * Math.cos(toR(bLat));
  const x = Math.cos(toR(aLat)) * Math.sin(toR(bLat)) - Math.sin(toR(aLat)) * Math.cos(toR(bLat)) * Math.cos(dLng);
  return (toD(Math.atan2(y, x)) + 360) % 360;
}
const distLabel = (m?: number) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

export default function ARScreen() {
  const router = useRouter();
  const [perm, requestPerm] = useCameraPermissions();
  const [heading, setHeading] = useState(0);
  const offers = useStore((s) => s.offers);
  const taste = useStore((s) => s.taste);
  const userLoc = useStore((s) => s.userLoc) ?? DEMO_USER;
  const near = useMemo(() => rankOffers(taste, offers).slice(0, 12), [taste, offers]);

  useEffect(() => { if (perm && !perm.granted) void requestPerm(); }, [perm, requestPerm]);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        sub = await Location.watchHeadingAsync((h) => {
          setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        });
      } catch { /* pas de boussole */ }
    })();
    return () => { sub?.remove(); };
  }, []);

  if (!perm) {
    return <View style={styles.center}><Text style={styles.msg}>Initialisation…</Text></View>;
  }
  if (!perm.granted) {
    return (
      <View style={styles.center}>
        <Icon name="target" size={40} color={colors.accent} />
        <Text style={styles.msgTitle}>Vue réalité augmentée</Text>
        <Text style={styles.msg}>Autorise la caméra pour voir les offres autour de toi.</Text>
        <View style={{ height: 8 }} />
        <PrimaryButton label="Activer la caméra" onPress={requestPerm} />
        <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}><Text style={styles.link}>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {near.map((o) => {
        if (o.lat == null || o.lng == null) return null;
        const b = bearingDeg(userLoc.lat, userLoc.lng, o.lat, o.lng);
        const rel = ((b - heading + 540) % 360) - 180; // -180..180
        if (Math.abs(rel) > FOV / 2) return null; // hors champ
        const x = SW / 2 + (rel / (FOV / 2)) * (SW / 2 - 80);
        const dist = o.distanceM ?? 500;
        const scale = Math.max(0.72, Math.min(1.08, 1 - (dist - 100) / 3000));
        const top = SH * 0.3 + Math.min(220, dist / 12);
        return (
          <Pressable
            key={o.id}
            onPress={() => router.push({ pathname: '/offer/[id]', params: { id: o.id } })}
            style={[styles.tag, { left: x - 78, top, transform: [{ scale }], opacity: Math.max(0.6, scale) }]}
          >
            <BrandAvatar offer={o} size={38} ring />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.tagBrand} numberOfLines={1}>{o.brand}</Text>
              <Text style={styles.tagDist}>{distLabel(o.distanceM)} · {o.walkMin ?? '?'} min</Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.reticle} pointerEvents="none" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Icon name="chevronLeft" size={22} color="#fff" /></Pressable>
        <Text style={styles.htitle}>Autour de toi</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.hint}>Balaie ton téléphone autour de toi pour repérer les offres</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 },
  msgTitle: { ...text.h2, textAlign: 'center' },
  msg: { ...text.body, textAlign: 'center', maxWidth: 260 },
  link: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.accentInk },
  tag: {
    position: 'absolute', width: 156, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 16, padding: 8, ...shadows.card,
  },
  tagBrand: { fontFamily: font.bodyBold, fontSize: 14, color: colors.ink },
  tagDist: { fontFamily: font.body, fontSize: 12, color: colors.ink2 },
  reticle: {
    position: 'absolute', left: SW / 2 - 16, top: SH / 2 - 16, width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  header: {
    position: 'absolute', top: 52, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  htitle: { fontFamily: font.bodySemiBold, fontSize: 15, color: '#fff' },
  hint: {
    position: 'absolute', bottom: 40, left: 24, right: 24, textAlign: 'center',
    fontFamily: font.body, fontSize: 13, color: 'rgba(255,255,255,0.9)',
  },
});
