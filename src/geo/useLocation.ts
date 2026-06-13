// useRealLocation — demande la position réelle (une fois) et ré-ancre les offres
// autour. Corrige le bug "tout est à Paris" : la carte suit l'utilisateur.
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useStore } from '@/store/useStore';
import { ensureLocationPermission } from './proximity';

export function useRealLocation() {
  const userLoc = useStore((s) => s.userLoc);
  const setUserLoc = useStore((s) => s.setUserLoc);
  useEffect(() => {
    if (userLoc) return; // déjà localisé cette session
    let cancelled = false;
    (async () => {
      const ok = await ensureLocationPermission();
      if (!ok || cancelled) return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* garde le centre par défaut */
      }
    })();
    return () => { cancelled = true; };
  }, [userLoc, setUserLoc]);
}
