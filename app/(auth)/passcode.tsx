// Nhập mã passcode — Figma "passcode" (0-6957 / 1008-112): 6 ô bảo mật, "Nhập mã passcode của số điện thoại"
// + SĐT đậm, link "Quên mã passcode" → OTP (purpose reset_passcode) → đặt passcode mới.
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, CodeInput, Screen, ErrorSheet, Icon, Icons } from '@/components/ui';
import { requestOtp } from '@/services/authFlow';
import { completeLogin, formatPhone } from '@/services/session';
import { PASSCODE_LENGTH } from '@/services/passcode';
import { api, errorMessage, getDeviceId, isApiError } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { enterApp } from '@/services/authNav';

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

export default function PasscodeScreen() {
  useStatusBarStyle('dark');
  const raw = useLocalSearchParams<{ phone?: string }>();
  const phone = paramStr(raw.phone);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const login = useCallback(
    async (passcode: string) => {
      if (submittingRef.current) return;
      if (!phone) {
        setSheetError('Thiếu số điện thoại. Vui lòng quay lại nhập số điện thoại.');
        return;
      }
      submittingRef.current = true;
      setLoading(true);
      setWrong(false);
      try {
        const tokens = await api('POST /v1/public/customer/auth/login/passcode', {
          body: { phone, passcode, deviceId: await getDeviceId() },
        });
        await completeLogin(tokens);
        enterApp('/home');
      } catch (e) {
        setCode('');
        if (isApiError(e, 'auth.invalid_credentials')) setWrong(true);
        else setSheetError(errorMessage(e, 'Không đăng nhập được, vui lòng thử lại'));
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [phone],
  );

  const loginRef = useRef(login);
  loginRef.current = login;
  const onFilled = useCallback((c: string) => {
    void loginRef.current(c);
  }, []);

  const handleForgot = async () => {
    if (sendingOtp) return;
    if (!phone) {
      setSheetError('Thiếu số điện thoại. Vui lòng quay lại nhập số điện thoại.');
      return;
    }
    setSendingOtp(true);
    try {
      await requestOtp(phone, 'reset');
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (e) {
      setSheetError(errorMessage(e, 'Không gửi được mã OTP, vui lòng thử lại'));
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <Screen header={<AppHeader title="Đăng nhập" variant="light" left="back" />}>
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          Nhập mã passcode
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          Nhập mã passcode của số điện thoại{' '}
          <AppText size={14} weight="bold" color={Colors.text}>
            {formatPhone(phone)}
          </AppText>
        </AppText>

        <View style={styles.codes}>
          <CodeInput
            value={code}
            onChangeText={(v) => {
              setCode(v);
              if (wrong) setWrong(false);
            }}
            length={PASSCODE_LENGTH}
            secure
            autoFocus
            error={wrong}
            onFilled={onFilled}
          />
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.base }} /> : null}

        {wrong ? (
          <View style={styles.errorRow}>
            <Icon name={Icons.alert} size={16} color={Colors.error} />
            <AppText size={13} color={Colors.error} style={{ marginLeft: 6 }}>
              Mã passcode không chính xác
            </AppText>
          </View>
        ) : null}

        <Pressable onPress={handleForgot} hitSlop={8} style={styles.link} disabled={sendingOtp}>
          <AppText weight="bold" size={15} color={sendingOtp ? Colors.textMuted : Colors.primary} align="center">
            {sendingOtp ? 'Đang gửi mã OTP...' : 'Quên mã passcode'}
          </AppText>
        </Pressable>
      </View>

      <ErrorSheet
        visible={!!sheetError}
        title="Lỗi đăng nhập"
        message={sheetError ?? ''}
        actionLabel="Thử lại"
        onClose={() => setSheetError(null)}
        onAction={() => setSheetError(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.base },
  link: { marginTop: Spacing.xl, alignSelf: 'center', paddingVertical: Spacing.xs },
});
