// Auth stack — các màn tự vẽ AppHeader (variant light), nên tắt header mặc định
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.white },
        animation: 'slide_from_right',
      }}
    />
  );
}
