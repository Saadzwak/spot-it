import { Tabs } from 'expo-router';
import { Icon } from '@/components';
import { colors, font } from '@/design/theme';

export default function TabsLayout() {
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
        options={{ title: 'Découvrir', tabBarIcon: ({ color, size }) => <Icon name="cards" color={color as string} size={size} /> }}
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
