// Account screen — Tài khoản tài xế
// Design: Figma [Driver] Tài khoản tài xế

import React from 'react';
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
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { authApi } from '@/services/api';

type MenuItem = {
  icon: string;
  label: string;
  badge?: string;
  onPress: () => void;
};

export default function AccountScreen() {
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
        { icon: '🚗', label: 'Phương tiện của tôi', onPress: () => {} },
        { icon: '📄', label: 'Giấy tờ & tài liệu', onPress: () => {} },
        { icon: '⭐', label: 'Đánh giá của tôi', onPress: () => {} },
      ],
    },
    {
      title: 'Cài đặt',
      items: [
        { icon: '🔔', label: 'Thông báo', onPress: () => {} },
        { icon: '🔒', label: 'Bảo mật', onPress: () => {} },
        { icon: '🌐', label: 'Ngôn ngữ', badge: 'Tiếng Việt', onPress: () => {} },
      ],
    },
    {
      title: 'Hỗ trợ',
      items: [
        { icon: '🎧', label: 'Liên hệ hỗ trợ', onPress: () => {} },
        { icon: '📋', label: 'Điều khoản dịch vụ', onPress: () => {} },
        { icon: '🛡️', label: 'Chính sách bảo mật', onPress: () => {} },
        { icon: 'ℹ️', label: 'Về ứng dụng', badge: 'v1.0.0', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🧑</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Nguyễn Văn A</Text>
            <Text style={styles.profilePhone}>0352 237 832</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>5.0</Text>
              <Text style={styles.ratingCount}>(120 đánh giá)</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Completion badge */}
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>🏆 Tài xế xuất sắc</Text>
          <Text style={styles.completionDesc}>Hoàn thành 1.234 đơn hàng</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '85%' }]} />
          </View>
          <Text style={styles.completionHint}>Còn 180 đơn để đạt Tài xế Vàng</Text>
        </View>

        {/* Menu groups */}
        {menuGroups.map((group) => (
          <View key={group.title} style={styles.menuGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.menuCard}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < group.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <Text style={styles.menuBadge}>{item.badge}</Text>
                    )}
                    <Text style={styles.menuChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  content: {
    padding: Spacing['2xl'],
    gap: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  profilePhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingStar: { fontSize: 14 },
  ratingValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  ratingCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  editBtn: {
    padding: Spacing.sm,
  },
  editBtnText: { fontSize: 20 },

  // Completion
  completionCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  completionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  completionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryDark,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  completionHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Menu
  menuGroup: { gap: Spacing.sm },
  groupTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  menuChevron: {
    fontSize: 20,
    color: Colors.gray400,
  },

  // Logout
  logoutBtn: {
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.error,
  },
});
