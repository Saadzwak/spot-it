// notify.ts — notification locale de proximité.
// La MÊME fonction est appelée par le géofencing (prod, tasks.ts) ET par le
// bouton "simuler la marche" (démo). Marche dans Expo Go (notif locale, trigger:null).
import * as Notifications from 'expo-notifications';

let handlerSet = false;

/** À appeler une fois au démarrage (dans le _layout racine). */
export function setupNotifications() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotifPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export interface ProximityPayload {
  offerId?: string;
  brand?: string;
  title?: string;
  body?: string;
  walkMin?: number;
}

/** Présente immédiatement une notif "magasin proche". */
export async function fireProximityNotification(p: ProximityPayload = {}) {
  await ensureNotifPermission();
  const title = p.title ?? (p.brand ? `${p.brand} est à deux pas` : 'Un magasin partenaire est tout proche');
  const body =
    p.body ??
    `Tu es à ~${p.walkMin ?? 5} min à pied${p.offerId ? '' : ''}. Ouvre Spot.it pour voir l’offre.`;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { offerId: p.offerId ?? null, kind: 'proximity' } },
    trigger: null,
  });
}
