// Đăng nhập — Figma "Login1/Login2" (0-6812 / 0-6887): header lavender "Đăng nhập", logo, label
// "Số điện thoại của tôi là" (*), PhoneInput, link "Đăng nhập bằng mật khẩu", nút flat "Tiếp tục".
// Luồng: gửi OTP (purpose login) → /(auth)/otp. SĐT chưa có tài khoản: sau OTP server trả needRegister → đăng ký.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Button, PhoneInput, Logo, Screen, ErrorSheet } from '@/components/ui';
import { clearAuthFlow, requestOtp } from '@/services/authFlow';
import { looksLikeVnPhone } from '@/services/passcode';
import { errorMessage, takeExpiryMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function LoginScreen() {
  useStatusBarStyle('dark');
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const sessionExpired = reason === 'expired';
  // hết phiên vì tài khoản bị khoá → hiện đúng lý do server trả
  const [expiredMessage] = useState(() => (sessionExpired ? takeExpiryMessage() : null));

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');

  const isValid = looksLikeVnPhone(phone);

  // bắt đầu lại từ đầu: bỏ phiên OTP / verificationToken của lần trước (nếu có)
  useEffect(() => {
    void clearAuthFlow();
  }, []);

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await requestOtp(phone, 'login');
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (e) {
      setError(errorMessage(e, 'Không gửi được mã OTP, vui lòng thử lại'));
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
    router.push({ pathname: '/(auth)/passcode', params: { phone } });
  };

  return (
    <Screen
      header={<AppHeader title="Đăng nhập" variant="light" left="back" />}
      footer={<Button title="Tiếp tục" flat onPress={handleContinue} disabled={!isValid || loading} loading={loading} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <View style={styles.logo}>
          <Logo size={56} />
        </View>

        {sessionExpired ? (
          <AppText size={13} color={Colors.error} align="center" style={styles.expired}>
            {expiredMessage ?? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'}
          </AppText>
        ) : null}

        <View style={styles.labelRow}>
          <AppText size={14} weight="medium" color={Colors.text}>
            Số điện thoại của tôi là
          </AppText>
          <AppText size={13} color={Colors.error}>
            (*)
          </AppText>
        </View>
        <PhoneInput
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            if (hint) setHint('');
          }}
          autoFocus
        />
        {hint ? (
          <AppText size={12} color={Colors.error} style={{ marginTop: Spacing.sm }}>
            {hint}
          </AppText>
        ) : null}

        <Pressable onPress={goPasscode} hitSlop={8} style={styles.link}>
          <AppText weight="bold" size={15} color={Colors.primary} align="center">
            Đăng nhập bằng mật khẩu
          </AppText>
        </Pressable>
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
  expired: { marginBottom: Spacing.base },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  link: { marginTop: Spacing.xl, alignSelf: 'center', paddingVertical: Spacing.xs },
});
