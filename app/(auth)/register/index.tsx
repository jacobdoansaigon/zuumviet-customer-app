// Đăng ký khách — 1 bước: họ tên + mật khẩu (sau OTP)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import {
  authApi,
  ApiError,
  getOtpSession,
  saveSession,
} from '@/services/api';

/** TYPE_NORMAL = 1 trên BE */
const CUSTOMER_TYPE_NORMAL = 1;

export default function RegisterScreen() {
  const params = useLocalSearchParams<{
    phone?: string;
    otpId?: string;
    otpAuthCode?: string;
    otpGroup?: string;
  }>();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit =
    fullName.trim().length >= 2 &&
    password.length >= 6 &&
    password === passwordConfirm;

  const handleRegister = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const session = await getOtpSession<{
        phone?: string;
        country_code?: string;
        otp_id?: number;
        otp_auth_code?: string;
        otp_group?: string;
      }>();

      const phone = params.phone || session?.phone || '';
      const otpId = Number(params.otpId || session?.otp_id || 0);
      const otpAuthCode =
        params.otpAuthCode || session?.otp_auth_code || '';
      const otpGroup =
        params.otpGroup || session?.otp_group || 'otp_general';

      if (!phone || !otpId || !otpAuthCode) {
        Alert.alert('Thiếu OTP', 'Vui lòng xác thực OTP lại từ đầu.');
        router.replace('/(auth)/login');
        return;
      }

      await authApi.register({
        full_name: fullName.trim(),
        phone,
        country_code: '84',
        password,
        email: '',
        type: CUSTOMER_TYPE_NORMAL,
        otp_id: otpId,
        otp_auth_code: otpAuthCode,
        otp_group: otpGroup,
        ref_aff_code: '',
        avatar: 0,
        gender: 0,
        birthday: 0,
        region_id: 0,
        sub_region_id: 0,
      });

      const byPass = await authApi.loginPassword(phone, password, '84');
      await saveSession(byPass.token, byPass);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(
        'Đăng ký thất bại',
        e instanceof ApiError ? e.message : 'Vui lòng thử lại'
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
        <Text style={styles.title}>Đăng ký khách hàng</Text>
        <Text style={styles.sub}>
          Nhập họ tên và mật khẩu để hoàn tất tạo tài khoản.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu (≥ 6 ký tự)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nhập lại mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
            placeholder="••••••"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        <Button
          title={loading ? 'Đang tạo...' : 'Đăng ký khách hàng'}
          onPress={handleRegister}
          disabled={!canSubmit || loading}
          loading={loading}
          variant={canSubmit ? 'primary' : 'secondary'}
          style={{ marginTop: Spacing.xl }}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  sub: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  field: { gap: Spacing.sm, marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
});
