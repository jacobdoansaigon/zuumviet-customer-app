// Đăng nhập — Figma "Login1/Login2" (0-6812 / 0-6887): header lavender "Đăng nhập", logo, label
// "Số điện thoại của tôi là" (*), PhoneInput, link "Đăng nhập bằng mật khẩu", nút flat "Tiếp tục".
// Giữ nguyên luồng: gửi OTP (otp_general | otp_register) → lưu OTP session → /(auth)/otp.
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Button, PhoneInput, Logo, Screen, ErrorSheet } from '@/components/ui';
import { authApi, ApiError, saveOtpSession, normalizePhoneVn } from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function LoginScreen() {
  useStatusBarStyle('dark');
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const isRegister = intent === 'register';
  const otpGroup = isRegister ? 'otp_register' : 'otp_general';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');

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
      const msg = e instanceof ApiError ? e.message : 'Không gửi được OTP. Kiểm tra mạng / API.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goPasscode = () => {
    if (!isValid) {
      setHint('Nhập số điện thoại để đăng nhập bằng mật khẩu');
      return;
    }
    setHint('');
    router.push({ pathname: '/(auth)/passcode', params: { phone: phoneNorm } });
  };

  return (
    <Screen
      header={<AppHeader title={isRegister ? 'Đăng ký' : 'Đăng nhập'} variant="light" left="back" />}
      footer={
        <Button
          title="Tiếp tục"
          flat
          onPress={handleContinue}
          disabled={!isValid || loading}
          loading={loading}
        />
      }
      footerPadded={false}
    >
      <View style={styles.body}>
        <View style={styles.logo}>
          <Logo size={56} />
        </View>

        <View style={styles.labelRow}>
          <AppText size={14} weight="medium" color={Colors.text}>
            Số điện thoại của tôi là
          </AppText>
          <AppText size={13} color={Colors.error}>
            (*)
          </AppText>
        </View>
        <PhoneInput value={phone} onChangeText={(t) => { setPhone(t); if (hint) setHint(''); }} autoFocus />
        {hint ? (
          <AppText size={12} color={Colors.error} style={{ marginTop: Spacing.sm }}>
            {hint}
          </AppText>
        ) : null}

        {!isRegister ? (
          <Pressable onPress={goPasscode} hitSlop={8} style={styles.link}>
            <AppText weight="bold" size={15} color={Colors.primary} align="center">
              Đăng nhập bằng mật khẩu
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ErrorSheet
        visible={!!error}
        title="Lỗi đăng nhập"
        message={error ?? ''}
        actionLabel="Thử lại"
        onClose={() => setError(null)}
        onAction={() => setError(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen },
  logo: { alignItems: 'center', marginTop: Spacing['2xl'], marginBottom: Spacing['2xl'] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  link: { marginTop: Spacing.xl, alignSelf: 'center', paddingVertical: Spacing.xs },
});
