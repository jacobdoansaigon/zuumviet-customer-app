import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerBackTitle: '',
        headerTintColor: Colors.primary,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.white },
        contentStyle: { backgroundColor: Colors.white },
      }}
    />
  );
}
