// Splash / Welcome screen — ZUUMCUSTOMER
// Design: Figma [Driver] Sign In + Sign Up > Welcome screen

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.appName}>ZUUMCUSTOMER</Text>
      </View>

      {/* Illustration placeholder */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationPlaceholder}>
          {/* Illustration: people around a car — replace with actual SVG/Image */}
          <Text style={styles.illustrationEmoji}>🚗</Text>
          <Text style={styles.illustrationSubEmoji}>🧑‍🤝‍🧑</Text>
        </View>
      </View>

      {/* Headline */}
      <View style={styles.headlineContainer}>
        <Text style={styles.headline}>Hãy cùng zuumviet</Text>
        <Text style={styles.subtitle}>
          Công việc tự do, thăng tiến dễ dàng, thu nhập{'\n'}gia tăng, nhận nhiều khoản thưởng
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title="Đăng nhập bằng số điện thoại"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
        />

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>Khi Đăng nhập hoặc Đăng ký, Tôi đã đồng ý với </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://zuumviet.vn/terms')}>
            <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
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

  // Logo
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
    // Location pin shape via border
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
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

  // Illustration
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  illustrationSubEmoji: {
    fontSize: 48,
  },

  // Headline
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

  // CTA
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
    textAlign: 'center',
  },
  termsLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
