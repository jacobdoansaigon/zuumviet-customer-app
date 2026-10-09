// Root layout — ZuumViet (app khách): load font Mulish, SafeAreaProvider, StatusBar, Stack không header.
// Không liệt kê từng Stack.Screen để mọi route trong app/ đều hoạt động.
// Toàn app: push + đăng ký thiết bị (useNotifications), kết nối realtime khi đã đăng nhập (useRealtimeConnection),
// hết phiên đăng nhập (làm mới token thất bại) → về màn đăng nhập.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeConnection } from '@/hooks/useRealtime';
import { onSessionChange } from '@/services/zuum';

function AppShell() {
  useNotifications();
  useRealtimeConnection();

  useEffect(
    () =>
      onSessionChange((event) => {
        if (event === 'expired') router.replace({ pathname: '/(auth)/login', params: { reason: 'expired' } });
      }),
    [],
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.white },
        animation: 'slide_from_right',
      }}
    >
      {/* Màn chọn địa điểm của luồng đặt hàng mở dạng modal — chỉ override presentation */}
      <Stack.Screen name="booking/location" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  if (!fontsReady) {
    // Splash tạm (Figma "Flash": nền tím) trong lúc tải font — không dùng AppText để tránh lỗi font chưa load
    return <View style={styles.splash} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.primary },
});
