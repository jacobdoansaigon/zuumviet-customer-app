// Đăng ký khách — họ tên + mật khẩu (OTP đã verify, đọc từ AsyncStorage)

import React, { useEffect, useState } from 'react';
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
  normalizePhoneVn,
  type OtpSessionData,
} from '@/services/api';

const CUSTOMER_TYPE_NORMAL = 1;

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

export default function RegisterScreen() {
  const raw = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<OtpSessionData | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getOtpSession<OtpSessionData>();
      if (!s?.otp_id || !s?.otp_auth_code) {
        Alert.alert(
          'Thiếu OTP',
          'Vui lòng xác thực OTP trước khi đăng ký.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.replace({
                  pathname: '/(auth)/login',
                  params: { intent: 'register' },
                }),
            },
          ]
        );
        return;
      }
      setSession(s);
      setPhone(normalizePhoneVn(s.phone || phone));
      setSessionReady(true);
    })();
  }, []);

  const canSubmit =
    sessionReady &&
    fullName.trim().length >= 2 &&
    password.length >= 6 &&
    password === passwordConfirm;

  const handleRegister = async () => {
    if (!canSubmit || loading || !session) return;
    setLoading(true);
    try {
      const otpId = Number(session.otp_id);
      const otpAuthCode = String(session.otp_auth_code || '');
      const otpGroup = session.otp_group || 'otp_register';
      const phoneNorm = normalizePhoneVn(session.phone || phone);

      if (!phoneNorm || !otpId || !otpAuthCode) {
        throw new ApiError(422, 'Thiếu thông tin OTP — làm lại từ Đăng ký');
      }

      await authApi.register({
        full_name: fullName.trim(),
        phone: phoneNorm,
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

      try {
        const byPass = await authApi.loginPassword(phoneNorm, password, '84');
        await saveSession(byPass.token, byPass);
        router.replace('/(tabs)');
      } catch (loginErr) {
        // Account đã tạo — vẫn cho vào app qua login lại
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản đã tạo. Vui lòng đăng nhập bằng số điện thoại.',
          [
            {
              text: 'Đăng nhập',
              onPress: () =>
                router.replace({
                  pathname: '/(auth)/login',
                  params: { intent: 'login' },
                }),
            },
          ]
        );
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Không đăng ký được. Thử lại hoặc gửi OTP mới.';
      Alert.alert('Đăng ký thất bại', msg);
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
          SĐT +84 {phone || '…'} đã xác thực OTP. Nhập họ tên và mật khẩu.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={Colors.placeholder}
            autoCapitalize="words"
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
    gap: 0,
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
