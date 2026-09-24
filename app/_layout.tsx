// Root layout — ZUUMCUSTOMER: load font Mulish, SafeAreaProvider, StatusBar, Stack không header.
// Không liệt kê từng Stack.Screen để mọi route trong app/ đều hoạt động.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useNotifications } from '@/hooks/useNotifications';

function AppWithNotifications() {
  // Push chỉ cần trên native; web bỏ qua để tránh treo flow auth (xử lý trong hook)
  useNotifications({
    onTokenReady: async () => {},
  });

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
      <AppWithNotifications />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.primary },
});
