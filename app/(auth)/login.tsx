// Login screen — Phone number → OTP
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
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { authApi, ApiError, saveOtpSession } from '@/services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phone.length === 10;

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
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Không gửi được OTP. Kiểm tra EXPO_PUBLIC_API_URL / mạng.';
      Alert.alert('Lỗi', msg);
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
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Số điện thoại của tôi là</Text>
              <Text style={styles.required}>(*)</Text>
            </View>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              placeholder="077 996 3333"
            />
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.ctaContainer}>
          <Button
            title={loading ? 'Đang gửi OTP...' : 'Tiếp tục'}
            onPress={handleContinue}
            variant={isValid ? 'primary' : 'secondary'}
            disabled={!isValid || loading}
            loading={loading}
          />
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Đăng ký khách hàng →</Text>
            </TouchableOpacity>
          </View>
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
  form: { gap: Spacing.lg },
  fieldGroup: { gap: Spacing.sm },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  required: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  ctaContainer: { gap: Spacing.md, marginTop: Spacing.xl },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
