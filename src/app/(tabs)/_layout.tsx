import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Icon } from '@/components';
import { colors, font } from '@/design/theme';
import { useStore } from '@/store/useStore';
import { startProximityWatch, type ProximityWatch } from '@/geo/proximity';

export default function TabsLayout() {
  const consentLoc = useStore((s) => s.consent.location);
  const userLoc = useStore((s) => s.userLoc);

  // Notif passive de proximité : tant que la localisation est consentie, on
  // surveille la position en avant-plan et on alerte à ~400 m d'un magasin
  // partenaire — une offre qu'on n'aurait jamais vue autrement.
  useEffect(() => {
    if (!consentLoc) return;
    let watch: ProximityWatch | null = null;
    let cancelled = false;
    startProximityWatch(useStore.getState().offers, { radiusM: 400 })
      .then((w) => { if (cancelled) w.remove(); else watch = w; })
      .catch(() => { /* permission refusée : silencieux */ });
    return () => { cancelled = true; watch?.remove(); };
  }, [consentLoc, userLoc]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: font.bodyMedium, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: 'Découvrir', tabBarIcon: ({ color, size }) => <Icon name="search" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Carte', tabBarIcon: ({ color, size }) => <Icon name="map" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ title: 'Wishlist', tabBarIcon: ({ color, size }) => <Icon name="heart" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Icon name="profile" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
