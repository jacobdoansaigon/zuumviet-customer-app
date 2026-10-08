// Nhập mã OTP — Figma OTP 1.3/1.4/1.5 + lỗi 1.6/1.7/1.8:
//   "Nhập mã OTP" / "Nhập 6 mã số được gửi tới:" + SĐT đậm / 6 ô số tím / "Gửi lại mã OTP sau 00:30"
//   Sai mã: icon đỏ + lý do server trả (còn mấy lần thử) + link "Gửi lại mã OTP"
//   ErrorSheet "Lỗi đăng nhập": không nhận được OTP (gọi tổng đài) / nhập sai quá số lần
// Luồng: xác minh → verificationToken →
//   intent login: POST /auth/login/otp → token (→ /me → /home) | needRegister (→ /register, dùng lại token)
//   intent reset (quên passcode): → /set-passcode?mode=reset (đặt passcode mới bằng token, KHÔNG đăng nhập trước)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, CodeInput, Screen, ErrorSheet, Toast, Icon, Icons } from '@/components/ui';
import { clearAuthFlow, getAuthFlow, requestOtp, secondsUntilResend, verifyOtp, type AuthFlow } from '@/services/authFlow';
import { completeLogin, formatPhone } from '@/services/session';
import { api, errorMessage, getDeviceId, isApiError } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { enterApp } from '@/services/authNav';
import { SUPPORT_HOTLINE, SUPPORT_HOTLINE_LABEL } from '@/constants/content';

const OTP_LENGTH = 6;

const MSG_NO_OTP = `Bạn không nhận được mã OTP? Gọi tổng đài ZuumViet ${SUPPORT_HOTLINE_LABEL} để được hỗ trợ.`;

type SheetState = { kind: 'support' | 'locked' | 'missing' | 'generic'; message: string } | null;

function formatCountdown(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function OtpScreen() {
  useStatusBarStyle('dark');
  const [flow, setFlow] = useState<AuthFlow | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [wrongOtp, setWrongOtp] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const submittingRef = useRef(false);

  // Phiên OTP lưu ở services/authFlow (web tải lại trang vẫn còn)
  useEffect(() => {
    let alive = true;
    void getAuthFlow().then((f) => {
      if (!alive) return;
      if (!f) {
        setSheet({ kind: 'missing', message: 'Phiên OTP không còn. Vui lòng nhập lại số điện thoại để nhận mã mới.' });
        return;
      }
      setFlow(f);
      setCountdown(secondsUntilResend(f));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const isReset = flow?.intent === 'reset';

  const handleResend = async () => {
    if (!flow || countdown > 0 || loading) return;
    setWrongOtp(null);
    setOtp('');
    try {
      const next = await requestOtp(flow.phone, flow.intent);
      setFlow(next);
      setCountdown(secondsUntilResend(next));
      const n = resendCount + 1;
      setResendCount(n);
      // Figma 1.6: gửi lại nhiều lần vẫn không nhận được → đề nghị Tư vấn viên gọi hỗ trợ
      if (n >= 2) setSheet({ kind: 'support', message: MSG_NO_OTP });
    } catch (e) {
      setSheet({ kind: 'generic', message: errorMessage(e, 'Gửi lại mã OTP thất bại') });
    }
  };

  const handleVerify = useCallback(
    async (code: string) => {
      if (submittingRef.current || code.length !== OTP_LENGTH) return;
      const current = flow ?? (await getAuthFlow());
      if (!current) {
        setOtp('');
        setSheet({ kind: 'missing', message: 'Phiên OTP không còn. Vui lòng nhập lại số điện thoại để nhận mã mới.' });
        return;
      }
      submittingRef.current = true;
      setLoading(true);
      setWrongOtp(null);
      try {
        const verified = await verifyOtp(current, code);
        setFlow(verified);
        if (verified.intent === 'reset') {
          router.replace({ pathname: '/(auth)/set-passcode', params: { mode: 'reset' } });
          return;
        }
        const res = await api('POST /v1/public/customer/auth/login/otp', {
          body: { verificationToken: verified.verificationToken, deviceId: await getDeviceId() },
        });
        if ('needRegister' in res) {
          router.replace('/(auth)/register');
          return;
        }
        await completeLogin(res);
        await clearAuthFlow();
        enterApp('/home');
      } catch (e) {
        setOtp('');
        if (isApiError(e, 'otp.invalid')) {
          setWrongOtp(errorMessage(e));
        } else if (isApiError(e, 'otp.too_many_attempts', 'otp.expired', 'otp.already_used')) {
          setSheet({ kind: 'locked', message: errorMessage(e) });
        } else {
          setSheet({ kind: 'generic', message: errorMessage(e, 'Không xác minh được mã OTP, vui lòng thử lại') });
        }
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [flow],
  );

  // onFilled ổn định để CodeInput không gọi lại khi handler đổi identity
  const verifyRef = useRef(handleVerify);
  verifyRef.current = handleVerify;
  const onFilled = useCallback((code: string) => {
    void verifyRef.current(code);
  }, []);

  const closeSheet = () => {
    const k = sheet?.kind;
    setSheet(null);
    if (k === 'missing') router.replace('/(auth)/login');
  };

  const onSheetAction = () => {
    const k = sheet?.kind;
    setSheet(null);
    if (k === 'support') {
      Linking.openURL(`tel:${SUPPORT_HOTLINE}`).catch(() => setToast(`Không gọi được trên thiết bị này — tổng đài ${SUPPORT_HOTLINE_LABEL}`));
      return;
    }
    if (k === 'missing') router.replace('/(auth)/login');
  };

  const sheetAction = sheet?.kind === 'support' ? 'Gọi tổng đài' : sheet?.kind === 'generic' ? 'Thử lại' : 'Đồng ý';

  return (
    <Screen header={<AppHeader title={isReset ? 'Quên mã passcode' : 'Đăng nhập'} variant="light" left="back" />}>
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          Nhập mã OTP
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          Nhập 6 mã số được gửi tới:{' '}
          <AppText size={14} weight="bold" color={Colors.text}>
            {formatPhone(flow?.phone)}
          </AppText>
        </AppText>

        <View style={styles.codes}>
          <CodeInput
            value={otp}
            onChangeText={(v) => {
              setOtp(v);
              if (wrongOtp) setWrongOtp(null);
            }}
            length={OTP_LENGTH}
            autoFocus
            error={!!wrongOtp}
            onFilled={onFilled}
          />
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.base }} /> : null}

        {wrongOtp ? (
          <View style={styles.errorRow}>
            <Icon name={Icons.alert} size={16} color={Colors.error} />
            <AppText size={13} color={Colors.error} style={{ marginLeft: 6 }}>
              {wrongOtp}
            </AppText>
          </View>
        ) : null}

        <View style={styles.resend}>
          {countdown > 0 ? (
            <AppText size={14} color={Colors.textMuted} align="center">
              Gửi lại mã OTP sau{' '}
              <AppText size={14} weight="semiBold" color={Colors.textMuted}>
                {formatCountdown(countdown)}
              </AppText>
            </AppText>
          ) : (
            <Pressable onPress={handleResend} hitSlop={8} disabled={loading || !flow}>
              <AppText weight="bold" size={15} color={Colors.primary} align="center">
                Gửi lại mã OTP
              </AppText>
            </Pressable>
          )}
        </View>

        {flow?.debugCode ? (
          // Bản dev: server trả debugCode — chạm để điền nhanh
          <Pressable onPress={() => setOtp(flow.debugCode ?? '')} style={styles.debug} hitSlop={6}>
            <AppText size={12} color={Colors.textMuted} align="center">
              Mã OTP (debug): {flow.debugCode}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ErrorSheet
        visible={!!sheet}
        title={isReset ? 'Lỗi xác minh' : 'Lỗi đăng nhập'}
        message={sheet?.message ?? ''}
        actionLabel={sheetAction}
        onClose={closeSheet}
        onAction={onSheetAction}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.base, paddingHorizontal: Spacing.base },
  resend: { marginTop: Spacing.xl, alignItems: 'center' },
  debug: { marginTop: Spacing.xl },
});
