// Account — tài khoản khách hàng

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { authApi, getStoredCustomer, type CustomerProfile } from '@/services/api';

type MenuItem = {
  icon: string;
  label: string;
  badge?: string;
  onPress: () => void;
};

export default function AccountScreen() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    getStoredCustomer().then(setCustomer);
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authApi.logout();
          router.replace('/');
        },
      },
    ]);
  };

  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Tài khoản',
      items: [
        { icon: '👤', label: 'Thông tin cá nhân', onPress: () => {} },
        { icon: '📍', label: 'Địa chỉ đã lưu', onPress: () => {} },
        { icon: '⭐', label: 'Tài xế yêu thích', onPress: () => {} },
      ],
    },
    {
      title: 'Cài đặt',
      items: [
        { icon: '🔔', label: 'Thông báo', onPress: () => {} },
        { icon: '🌐', label: 'Ngôn ngữ', badge: 'Tiếng Việt', onPress: () => {} },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        { icon: '🎧', label: 'Liên hệ hỗ trợ', onPress: () => {} },
        { icon: '📋', label: 'Điều khoản dịch vụ', onPress: () => {} },
        { icon: 'ℹ️', label: 'Về ứng dụng', badge: 'v1.0.0', onPress: () => {} },
      ],
    },
  ];

  const displayName =
    customer?.full_name || customer?.fullname || 'Khách hàng';
  const phone = customer?.phone
    ? `+${customer.country_code || '84'} ${customer.phone}`
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            {phone ? <Text style={styles.phone}>{phone}</Text> : null}
          </View>
        </View>

        {menuGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.row}
                onPress={item.onPress}
              >
                <Text style={styles.rowIcon}>{item.icon}</Text>
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.badge ? (
                  <Text style={styles.badge}>{item.badge}</Text>
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryBg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  phone: { marginTop: 4, color: Colors.textSecondary },
  group: { marginBottom: Spacing.lg },
  groupTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  rowIcon: { fontSize: 18, marginRight: Spacing.md },
  rowLabel: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.text },
  badge: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  chevron: { color: Colors.gray400, fontSize: 22 },
  logout: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.md,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: Typography.fontWeight.semibold,
  },
});
