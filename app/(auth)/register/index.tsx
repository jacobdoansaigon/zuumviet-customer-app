// Đăng ký tài khoản mới — Figma register 1.2.3 (0-7465…): "Họ và tên" (*) + "Email", nút flat
// "Hoàn thành hồ sơ" → /set-passcode (passcode 6 số dùng làm mật khẩu khi gọi authApi.register).
// Giữ logic cũ: khôi phục OTP session, SĐT đã tồn tại → chuyển đăng nhập.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Spacing, Colors } from '@/constants/theme';
import { AppText, AppHeader, Button, TextField, Screen, ErrorSheet } from '@/components/ui';
import { authApi, getOtpSession, normalizePhoneVn, formatPhoneDisplay, type OtpSessionData } from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SheetState = { title: string; message: string; action: string; onAction: () => void } | null;

export default function RegisterScreen() {
  useStatusBarStyle('dark');
  const raw = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [sessionReady, setSessionReady] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sheet, setSheet] = useState<SheetState>(null);

  const goLogin = () => router.replace({ pathname: '/(auth)/login', params: { intent: 'login' } });

  useEffect(() => {
    (async () => {
      const s = await getOtpSession<OtpSessionData>();
      const phoneNorm = normalizePhoneVn(s?.phone || paramStr(raw.phone));
      setPhone(phoneNorm);

      // SĐT đã có tài khoản → không cần đăng ký lại
      if (phoneNorm) {
        try {
          const exists = await authApi.checkExists(phoneNorm, '84');
          if (exists?.id > 0) {
            setSheet({
              title: 'Đã có tài khoản',
              message: 'Số điện thoại này đã đăng ký. Hãy đăng nhập bằng OTP hoặc mật khẩu.',
              action: 'Đăng nhập',
              onAction: goLogin,
            });
            return;
          }
        } catch {
          // check API fail — vẫn cho thử đăng ký
        }
      }

      if (!s?.otp_id || !s?.otp_auth_code) {
        setSessionReady(false);
        setSheet({
          title: 'Thiếu phiên OTP',
          message: 'Vui lòng quay lại bước nhập số điện thoại và xác thực OTP.',
          action: 'Đồng ý',
          onAction: goLogin,
        });
        return;
      }
      setSessionReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = fullName.trim();
  const emailTrim = email.trim();
  const emailOk = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);
  const canContinue = sessionReady && name.length >= 2 && emailOk;

  const handleContinue = () => {
    if (!canContinue) return;
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    router.push({
      pathname: '/(auth)/set-passcode',
      params: { mode: 'register', phone, name, email: emailTrim },
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
              {formatPhoneDisplay(phone)}
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
