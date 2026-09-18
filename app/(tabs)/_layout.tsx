// Bottom tabs — ZUUMCUSTOMER
// Tabs: Home | Orders | Wallet | Community | Account

import { Tabs } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { Text } from 'react-native';

type TabIconProps = {
  focused: boolean;
  emoji: string;
};

function TabIcon({ focused, emoji }: TabIconProps) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.white,
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📦" />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Ví',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💰" />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👥" />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
