// Đăng ký tài khoản mới — Figma register 1.2.3 (0-7465…): "Họ và tên" (*) + "Email" + "Mã giới thiệu" (tuỳ chọn),
// nút flat "Hoàn thành hồ sơ" → /set-passcode (đặt passcode 6 số rồi mới gọi POST /auth/register).
// Chỉ tới được màn này sau OTP khi server báo SĐT chưa có tài khoản (needRegister) — dùng lại verificationToken.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Spacing, Colors } from '@/constants/theme';
import { AppText, AppHeader, Button, TextField, Screen, ErrorSheet } from '@/components/ui';
import { getAuthFlow, hasValidVerification } from '@/services/authFlow';
import { formatPhone } from '@/services/session';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REFERRAL_RE = /^[A-Z0-9]{3,32}$/;

type SheetState = { title: string; message: string; action: string; onAction: () => void } | null;

export default function RegisterScreen() {
  useStatusBarStyle('dark');
  const [phone, setPhone] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [referral, setReferral] = useState('');
  const [referralError, setReferralError] = useState('');
  const [sheet, setSheet] = useState<SheetState>(null);

  const goLogin = () => router.replace('/(auth)/login');

  useEffect(() => {
    void getAuthFlow().then((flow) => {
      if (flow?.phone) setPhone(flow.phone);
      if (!hasValidVerification(flow) || flow.intent !== 'login') {
        setSheet({
          title: 'Phiên xác thực hết hạn',
          message: 'Vui lòng quay lại bước nhập số điện thoại và xác thực OTP.',
          action: 'Đồng ý',
          onAction: goLogin,
        });
        return;
      }
      setSessionReady(true);
    });
  }, []);

  const name = fullName.trim();
  const emailTrim = email.trim();
  const referralCode = referral.trim().toUpperCase();
  const emailOk = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);
  const referralOk = referralCode.length === 0 || REFERRAL_RE.test(referralCode);
  const canContinue = sessionReady && name.length >= 2 && emailOk && referralOk;

  const handleContinue = () => {
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    if (referralCode && !REFERRAL_RE.test(referralCode)) {
      setReferralError('Mã giới thiệu gồm chữ và số, vd KH000123');
      return;
    }
    if (!canContinue) return;
    router.push({
      pathname: '/(auth)/set-passcode',
      params: { mode: 'register', name, email: emailTrim, referralCode },
    });
  };

  return (
    <Screen
      header={<AppHeader title="Đăng ký tài khoản mới" variant="light" left="back" />}
      footer={<Button title="Hoàn thành hồ sơ" flat onPress={handleContinue} disabled={!canContinue} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        {phone ? (
          <AppText size={13} color={Colors.textSecondary} style={styles.phoneHint}>
            Số điện thoại{' '}
            <AppText size={13} weight="bold" color={Colors.text}>
              {formatPhone(phone)}
            </AppText>
          </AppText>
        ) : null}

        <TextField
          label="Họ và tên"
          required
          value={fullName}
          onChangeText={setFullName}
          placeholder="Họ và tên"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          containerStyle={styles.field}
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError('');
          }}
          onBlur={() => {
            if (emailTrim && !EMAIL_RE.test(emailTrim)) setEmailError('Email không hợp lệ');
          }}
          error={emailError || undefined}
          placeholder="email@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          containerStyle={styles.field}
        />
        <TextField
          label="Mã giới thiệu"
          value={referral}
          onChangeText={(t) => {
            setReferral(t.replace(/\s/g, '').toUpperCase());
            if (referralError) setReferralError('');
          }}
          error={referralError || undefined}
          helper={referralError ? undefined : 'Không bắt buộc — mã tài khoản của người giới thiệu bạn (vd KH000123)'}
          placeholder="KH000123"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          containerStyle={styles.field}
        />
      </View>

      <ErrorSheet
        visible={!!sheet}
        title={sheet?.title}
        message={sheet?.message ?? ''}
        actionLabel={sheet?.action}
        onAction={() => {
          const fn = sheet?.onAction;
          setSheet(null);
          fn?.();
        }}
        onClose={() => {
          const fn = sheet?.onAction;
          setSheet(null);
          fn?.();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl },
  phoneHint: { marginBottom: Spacing.base },
  field: { marginBottom: Spacing.lg },
});
