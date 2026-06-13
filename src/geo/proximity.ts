// proximity.ts — chemin AVANT-PLAN (marche dans Expo Go).
// watchPositionAsync + Haversine : déclenche fireProximityNotification quand on
// entre dans le rayon ~400 m d'une offre. Le géofencing arrière-plan (tasks.ts)
// est la voie prod (dev build) ; ici, l'avant-plan suffit pour la démo.
import * as Location from 'expo-location';
import type { Offer } from '@/types/contracts';
import { fireProximityNotification } from './notify';

const EARTH_R = 6371000; // m
const toRad = (d: number) => (d * Math.PI) / 180;

/** Distance Haversine en mètres entre deux points lat/lng. */
export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

export async function ensureLocationPermission(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  return fg.status === 'granted';
}

export interface ProximityResult { offer: Offer; distanceM: number }

/** Trouve la 1re offre à <= radius m d'un point (la plus proche). */
export function nearestWithin(
  lat: number, lng: number, offers: Offer[], radiusM = 400,
): ProximityResult | null {
  let best: ProximityResult | null = null;
  for (const o of offers) {
    if (o.lat == null || o.lng == null) continue;
    const d = haversineM(lat, lng, o.lat, o.lng);
    if (d <= radiusM && (!best || d < best.distanceM)) best = { offer: o, distanceM: d };
  }
  return best;
}

export interface ProximityWatch { remove: () => void }

/**
 * Surveille la position en avant-plan ; à la 1re entrée dans le rayon d'une offre
 * (non déjà notifiée), déclenche la notif. `onEnter` optionnel pour l'UI.
 */
export async function startProximityWatch(
  offers: Offer[],
  opts: { radiusM?: number; onEnter?: (r: ProximityResult) => void } = {},
): Promise<ProximityWatch> {
  const radiusM = opts.radiusM ?? 400;
  const notified = new Set<string>();
  const ok = await ensureLocationPermission();
  if (!ok) return { remove: () => {} };

  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 5000 },
    (pos) => {
      const hit = nearestWithin(pos.coords.latitude, pos.coords.longitude, offers, radiusM);
      if (hit && !notified.has(hit.offer.id)) {
        notified.add(hit.offer.id);
        fireProximityNotification({
          offerId: hit.offer.id, brand: hit.offer.brand, walkMin: hit.offer.walkMin,
        });
        opts.onEnter?.(hit);
      }
    },
  );
  return { remove: () => sub.remove() };
}
