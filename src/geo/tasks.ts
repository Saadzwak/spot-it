// tasks.ts — géofencing ARRIÈRE-PLAN (voie PRODUCTION, nécessite un dev build).
// En Expo Go le callback ne se déclenche pas (TaskManager sans exécution bg),
// mais définir la tâche est inoffensif. La démo utilise le chemin avant-plan
// (proximity.ts) + le bouton "simuler la marche" → fireProximityNotification.
//
// ⚠️ defineTask DOIT être au scope global → importer ce fichier tôt (root layout),
//    derrière un flag pour ne pas perturber Expo Go.
import { fireProximityNotification } from './notify';

export const GEOFENCE_TASK = 'spotit-store-proximity';

let defined = false;

/** Enregistre la tâche de géofencing (no-op sûr si TaskManager indisponible). */
export function defineGeofenceTask() {
  if (defined) return;
  defined = true;
  try {
    // import paresseux : évite de charger le module natif si non requis
    const TaskManager = require('expo-task-manager');
    const { GeofencingEventType } = require('expo-location');
    TaskManager.defineTask(GEOFENCE_TASK, (body: any) => {
      if (body?.error) return;
      const { eventType, region } = body?.data ?? {};
      if (eventType === GeofencingEventType.Enter) {
        fireProximityNotification({ offerId: region?.identifier });
      }
    });
  } catch {
    // Expo Go / module absent : ignoré (le chemin avant-plan prend le relais).
  }
}

/** Démarre le géofencing (≤20 régions iOS). À n'appeler qu'en dev build. */
export async function startGeofencing(
  regions: { identifier: string; latitude: number; longitude: number; radius?: number }[],
): Promise<boolean> {
  try {
    const Location = require('expo-location');
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return false;
    await Location.startGeofencingAsync(
      GEOFENCE_TASK,
      regions.slice(0, 20).map((r) => ({
        identifier: r.identifier, latitude: r.latitude, longitude: r.longitude,
        radius: r.radius ?? 400, notifyOnEnter: true, notifyOnExit: false,
      })),
    );
    return true;
  } catch {
    return false;
  }
}
