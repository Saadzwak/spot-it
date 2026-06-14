// anchor.ts — ré-ancre les offres (seed Paris) autour de la VRAIE position de
// l'utilisateur, en préservant leur disposition relative. Permet une démo
// crédible n'importe où (Lille, etc.) sans toucher au seed partagé.
import type { Offer } from '@/types/contracts';
import { DEMO_USER } from '@/data/offers.seed';
import { haversineM } from './proximity';

export function anchorOffers(offers: Offer[], center: { lat: number; lng: number }): Offer[] {
  const dLat = center.lat - DEMO_USER.lat;
  const dLng = center.lng - DEMO_USER.lng;
  return offers.map((o) => {
    if (o.lat == null || o.lng == null) return o;
    const lat = o.lat + dLat;
    const lng = o.lng + dLng;
    const distanceM = Math.round(haversineM(center.lat, center.lng, lat, lng));
    // l'adresse du seed est parisienne : on l'efface une fois ré-ancré (sinon
    // "Lille" afficherait une rue de Paris). On montre la distance à la place.
    return { ...o, lat, lng, distanceM, walkMin: Math.max(1, Math.round(distanceM / 80)), address: undefined };
  });
}
