import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAppFonts } from '@/design/theme';
import { colors } from '@/design/tokens';
import { setupNotifications } from '@/geo/notify';

export default function RootLayout() {
  useAppFonts(); // charge les polices ; on rend quoi qu'il arrive (fallback système)

  useEffect(() => {
    setupNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const offerId = resp.notification.request.content.data?.offerId;
      if (offerId) router.push({ pathname: '/offer/[id]', params: { id: String(offerId) } });
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(merchant)" />
          <Stack.Screen name="offer/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="redeem/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ar" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
