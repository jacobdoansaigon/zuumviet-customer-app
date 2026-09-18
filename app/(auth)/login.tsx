// Login — SĐT → OTP (khách hàng)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { authApi, ApiError, saveOtpSession } from '@/services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phone.length >= 9 && phone.length <= 11;

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const otp = await authApi.sendOtp(phone, 'otp_general', '84');
      await saveOtpSession({
        phone,
        country_code: '84',
        otp_group: 'otp_general',
        otp_id: otp.id,
        otp_debug: otp.otp_debug,
      });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone,
          otpId: String(otp.id),
          otpDebug: otp.otp_debug ?? '',
        },
      });
    } catch (e) {
      Alert.alert(
        'Lỗi',
        e instanceof ApiError
          ? e.message
          : 'Không gửi được OTP. Kiểm tra mạng / API.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={styles.appName}>ZUUMCUSTOMER</Text>
          <Text style={styles.hint}>Đăng nhập hoặc tạo tài khoản khách</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            placeholder="09xx xxx xxx"
          />
        </View>

        <View style={{ flex: 1 }} />

        <Button
          title={loading ? 'Đang gửi OTP...' : 'Nhận mã OTP'}
          onPress={handleContinue}
          variant={isValid ? 'primary' : 'secondary'}
          disabled={!isValid || loading}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  appName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  fieldGroup: { gap: Spacing.sm },
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
});
