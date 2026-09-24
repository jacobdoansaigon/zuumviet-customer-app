// Bottom tabs — Figma: 5 tab, nền trắng, viền trên mảnh, active tím, inactive #8C8C8C, label 11
// Trang Chủ | Hoạt Động | Cộng đồng | Hộp Thư (badge đỏ số chưa đọc) | Hồ Sơ
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Sizes } from '@/constants/theme';
import { Icon, Icons, type IconName } from '@/components/ui';
import { useUnreadCount } from '@/services/inboxStore';

type TabDef = {
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
};

const TABS: TabDef[] = [
  { name: 'home', title: 'Trang Chủ', icon: Icons.home, iconFocused: Icons.homeFilled },
  { name: 'orders', title: 'Hoạt Động', icon: Icons.activity, iconFocused: 'ion:shuffle' },
  { name: 'community', title: 'Cộng đồng', icon: Icons.community, iconFocused: 'mci:graph' },
  { name: 'inbox', title: 'Hộp Thư', icon: Icons.inbox, iconFocused: 'ion:file-tray' },
  { name: 'account', title: 'Hồ Sơ', icon: Icons.profile, iconFocused: Icons.profileFilled },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 6 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontFamily: Fonts.semiBold, marginTop: 0 },
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Sizes.tabBar + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: Colors.white },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused }) => (
              <Icon name={focused ? t.iconFocused : t.icon} size={24} color={focused ? Colors.tabActive : Colors.tabInactive} />
            ),
            ...(t.name === 'inbox' && unread > 0
              ? {
                  tabBarBadge: unread > 99 ? '99+' : unread,
                  tabBarBadgeStyle: {
                    backgroundColor: Colors.error,
                    color: Colors.white,
                    fontSize: 10,
                    fontFamily: Fonts.bold,
                    minWidth: 16,
                    height: 16,
                    lineHeight: 16,
                    borderRadius: 8,
                  },
                }
              : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
