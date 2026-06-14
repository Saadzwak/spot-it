// anchor.ts — ré-ancre les offres (seed Paris) autour de la VRAIE position de
// l'utilisateur, en préservant leur disposition relative. Permet une démo
// crédible n'importe où (Lille, etc.) sans toucher au seed partagé.
import type { Offer } from '@/types/contracts';
import { DEMO_USER } from '@/data/offers.seed';
import { haversineM } from './proximity';

export function anchorOffers(offers: Offer[], center: { lat: number; lng: number }): Offer[] {
  // Le seed est désormais ancré à Lille (EuraTechnologies) avec de VRAIES adresses.
  // Si l'utilisateur est dans la métropole lilloise (≤25 km de DEMO_USER), on garde
  // les coordonnées + adresses réelles (juste recalcul des distances). S'il est
  // ailleurs, on translate la disposition autour de lui et on masque l'adresse
  // (qui ne correspondrait plus à sa ville).
  const far = haversineM(center.lat, center.lng, DEMO_USER.lat, DEMO_USER.lng) > 25_000;
  const dLat = center.lat - DEMO_USER.lat;
  const dLng = center.lng - DEMO_USER.lng;
  return offers.map((o) => {
    if (o.lat == null || o.lng == null) return o;
    const lat = far ? o.lat + dLat : o.lat;
    const lng = far ? o.lng + dLng : o.lng;
    const distanceM = Math.round(haversineM(center.lat, center.lng, lat, lng));
    const walkMin = Math.max(1, Math.round(distanceM / 80));
    return far
      ? { ...o, lat, lng, distanceM, walkMin, address: undefined }
      : { ...o, distanceM, walkMin };
  });
}
