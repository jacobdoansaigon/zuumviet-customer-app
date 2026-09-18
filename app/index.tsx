// Splash — ZUUMCUSTOMER (khách đặt giao hàng)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.appName}>ZUUMCUSTOMER</Text>
      </View>

      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationEmoji}>📦</Text>
        <Text style={styles.illustrationSub}>Giao hàng tận nơi</Text>
      </View>

      <View style={styles.headlineContainer}>
        <Text style={styles.headline}>Đặt giao hàng dễ dàng</Text>
        <Text style={styles.subtitle}>
          Gửi hàng nhanh trong thành phố — theo dõi tài xế{'\n'}
          và nhận hàng đúng điểm đến.
        </Text>
      </View>

      <View style={styles.ctaContainer}>
        <Button
          title="Đăng nhập bằng số điện thoại"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
        />

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>Khi tiếp tục, bạn đồng ý với </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://zuumviet.vn/terms')}>
            <Text style={styles.termsLink}>Điều khoản</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> và </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://zuumviet.vn/privacy')}>
            <Text style={styles.termsLink}>Chính sách bảo mật</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  appName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  illustrationEmoji: { fontSize: 80 },
  illustrationSub: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  headlineContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  headline: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.6,
  },
  ctaContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  termsLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
