// Login / bắt đầu đăng ký — SĐT → OTP

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { authApi, ApiError, saveOtpSession, normalizePhoneVn } from '@/services/api';

export default function LoginScreen() {
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const isRegister = intent === 'register';
  const otpGroup = isRegister ? 'otp_register' : 'otp_general';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneNorm = normalizePhoneVn(phone);
  const isValid = phoneNorm.length >= 9 && phoneNorm.length <= 10;

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const otp = await authApi.sendOtp(phoneNorm, otpGroup, '84');
      await saveOtpSession({
        phone: phoneNorm,
        country_code: '84',
        otp_group: otpGroup,
        otp_id: otp.id,
        otp_debug: otp.otp_debug,
        intent: isRegister ? 'register' : 'login',
      });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: phoneNorm,
          otpId: String(otp.id),
          otpDebug: otp.otp_debug ?? '',
          intent: isRegister ? 'register' : 'login',
          otpGroup,
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
          <Text style={styles.hint}>
            {isRegister
              ? 'Đăng ký tài khoản khách hàng'
              : 'Đăng nhập bằng số điện thoại'}
          </Text>
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
          title={
            loading
              ? 'Đang gửi OTP...'
              : isRegister
                ? 'Đăng ký — nhận mã OTP'
                : 'Đăng nhập — nhận mã OTP'
          }
          onPress={handleContinue}
          variant={isValid ? 'primary' : 'secondary'}
          disabled={!isValid || loading}
          loading={loading}
        />

        <View style={styles.switchRow}>
          {isRegister ? (
            <>
              <Text style={styles.switchText}>Đã có tài khoản? </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/login',
                    params: { intent: 'login' },
                  })
                }
              >
                <Text style={styles.switchLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.switchText}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/login',
                    params: { intent: 'register' },
                  })
                }
              >
                <Text style={styles.switchLink}>Đăng ký khách hàng</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    textAlign: 'center',
  },
  fieldGroup: { gap: Spacing.sm },
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  switchText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  switchLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
