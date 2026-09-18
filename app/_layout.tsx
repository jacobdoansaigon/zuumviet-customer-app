import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';

function AppWithNotifications() {
  useNotifications({
    onTokenReady: async (token) => {
      // Register FCM token to backend
      try {
        // Push token wiring optional until notify service is on Railway
        // await customerApi.registerPushToken(token);
      } catch {
        // silent — token will be retried on next open
      }
    },
  });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="map/index"
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppWithNotifications />
    </SafeAreaProvider>
  );
}
