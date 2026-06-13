// useRealLocation — position réelle FIABLE (lastKnown instantané + position
// précise avec timeout). Ré-ancre les offres autour de l'utilisateur, donc la
// distance affichée correspond toujours à la vraie position (fix Lille/Paris).
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
      // 1) dernière position connue : instantané, ancre tout de suite
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) setUserLoc({ lat: last.coords.latitude, lng: last.coords.longitude });
      } catch { /* ignore */ }
      // 2) position précise, avec garde-fou de 8 s
      try {
        const cur = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((res) => setTimeout(() => res(null), 8000)),
        ]);
        if (cur && !cancelled) setUserLoc({ lat: cur.coords.latitude, lng: cur.coords.longitude });
      } catch { /* garde lastKnown ou défaut */ }
    })();
    return () => { cancelled = true; };
  }, [userLoc, setUserLoc]);
}
