// Nhập mã OTP — Figma OTP 1.3/1.4/1.5 + lỗi 1.6/1.7/1.8:
//   "Nhập mã OTP" / "Nhập 6 mã số được gửi tới:" + SĐT đậm / 6 ô số tím / "Gửi lại mã OTP sau 00:30"
//   Sai mã: icon đỏ + "Mã OTP không chính xác" + link "Gửi lại mã OTP"
//   ErrorSheet "Lỗi đăng nhập": không nhận được OTP (Yêu cầu gọi hỗ trợ) / vượt số lần (Đồng ý)
// Logic giữ nguyên từ bản cũ: khôi phục OTP session từ AsyncStorage (web mất query), verify → loginotp
// → need_register → /register ; intent=reset (quên passcode) → loginotp → /set-passcode?mode=reset.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, CodeInput, Screen, ErrorSheet, Toast, Icon, Icons } from '@/components/ui';
import {
  authApi,
  ApiError,
  saveSession,
  saveOtpSession,
  getOtpSession,
  normalizePhoneVn,
  formatPhoneDisplay,
  isNeedRegister,
  type OtpSessionData,
} from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30; // Figma: "00:30"
const MAX_ATTEMPTS = 5;

type Intent = 'login' | 'register' | 'reset';

const MSG_NO_OTP = 'Bạn không nhận được mã OTP. Bạn có muốn được Tư vấn viên gọi hỗ trợ?';
const MSG_LOCKED =
  'Bạn đã vượt quá số lần quy định xác thực OTP. Vì lý do bảo mật, tài khoản của bạn sẽ tạm thời bị khoá. Vui lòng trở lại sau 5 phút!';

type SheetState = { kind: 'support' | 'locked' | 'generic'; message: string } | null;

function paramStr(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return String(v[0] ?? fallback);
  return v != null && v !== '' ? String(v) : fallback;
}

function formatCountdown(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** web: location.assign để reset router state (tránh conflict welcome app/index) */
function hardNavigate(path: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
      window.location.assign(path);
      return;
    }
  } catch {
    /* fall through */
  }
  router.replace(path as never);
}

export default function OtpScreen() {
  useStatusBarStyle('dark');
  const raw = useLocalSearchParams<{
    phone?: string;
    otpId?: string;
    otpDebug?: string;
    intent?: string;
    otpGroup?: string;
  }>();

  const initialIntent = (paramStr(raw.intent) || 'login') as Intent;

  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [otpGroup, setOtpGroup] = useState(
    paramStr(raw.otpGroup) || (initialIntent === 'register' ? 'otp_register' : 'otp_general')
  );
  const [otpId, setOtpId] = useState(Number(paramStr(raw.otpId)) || 0);
  const [otpDebug, setOtpDebug] = useState(paramStr(raw.otpDebug));

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [wrongOtp, setWrongOtp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const submittingRef = useRef(false);

  const isRegister = intent === 'register';

  // Khôi phục otp_id / group từ AsyncStorage nếu URL mất param (hay gặp trên web)
  useEffect(() => {
    (async () => {
      const s = await getOtpSession<OtpSessionData>();
      if (!s) return;
      if (!phone && s.phone) setPhone(normalizePhoneVn(s.phone));
      if (!otpId && s.otp_id) setOtpId(Number(s.otp_id));
      if (s.otp_group) setOtpGroup(s.otp_group);
      if (s.intent === 'register') setIntent('register');
      if (!otpDebug && s.otp_debug) setOtpDebug(String(s.otp_debug));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setWrongOtp(false);
    setOtp('');
    try {
      const res = await authApi.sendOtp(phone, otpGroup, '84');
      setOtpId(res.id);
      setOtpDebug(res.otp_debug ?? '');
      setCountdown(RESEND_TIMEOUT);
      await saveOtpSession({
        phone,
        country_code: '84',
        otp_group: otpGroup,
        otp_id: res.id,
        otp_debug: res.otp_debug,
        intent: isRegister ? 'register' : 'login',
      });
      const n = resendCount + 1;
      setResendCount(n);
      if (n >= 2) {
        // Figma 1.6: gửi lại nhiều lần vẫn không nhận được → đề nghị Tư vấn viên gọi hỗ trợ
        setSheet({ kind: 'support', message: MSG_NO_OTP });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gửi lại OTP thất bại';
      setSheet({ kind: 'generic', message: msg });
    }
  };

  const goRegister = async (otpIdVal: number, authCode: string, group: string) => {
    await saveOtpSession({
      phone,
      country_code: '84',
      otp_id: otpIdVal,
      otp_auth_code: authCode,
      otp_group: group,
      intent: 'register',
    });
    router.replace({ pathname: '/(auth)/register', params: { phone } });
  };

  const handleVerify = useCallback(
    async (code: string) => {
      if (submittingRef.current) return;
      if (code.length !== OTP_LENGTH) return;

      // Khôi phục session nếu state mất otp_id (race / mất query trên web)
      let activeOtpId = otpId;
      let activePhone = phone;
      let activeGroup = otpGroup;
      let activeIntent: Intent = intent;
      if (!activeOtpId || !activePhone) {
        const s = await getOtpSession<OtpSessionData>();
        if (s) {
          if (!activeOtpId && s.otp_id) {
            activeOtpId = Number(s.otp_id);
            setOtpId(activeOtpId);
          }
          if (!activePhone && s.phone) {
            activePhone = normalizePhoneVn(s.phone);
            setPhone(activePhone);
          }
          if (s.otp_group) {
            activeGroup = s.otp_group;
            setOtpGroup(activeGroup);
          }
          if (s.intent === 'register') {
            activeIntent = 'register';
            setIntent('register');
          }
        }
      }

      if (!activeOtpId) {
        setOtp('');
        setSheet({ kind: 'generic', message: 'Thiếu mã phiên OTP. Quay lại bước nhập số điện thoại và gửi OTP mới.' });
        return;
      }
      if (!activePhone) {
        setOtp('');
        setSheet({ kind: 'generic', message: 'Thiếu số điện thoại. Quay lại bước nhập số điện thoại.' });
        return;
      }

      submittingRef.current = true;
      setLoading(true);
      setWrongOtp(false);
      try {
        const verified = await authApi.verifyOtp({
          phone: activePhone,
          otpId: activeOtpId,
          otpCode: code,
          otpGroup: activeGroup,
          countryCode: '84',
        });

        const group = verified.group || activeGroup;
        const authCode = verified.auth_code;
        if (!authCode) {
          throw new ApiError(422, 'OTP verify không trả auth_code');
        }

        await saveOtpSession({
          phone: activePhone,
          country_code: '84',
          otp_id: verified.id,
          otp_auth_code: authCode,
          otp_group: group,
          intent: activeIntent === 'register' ? 'register' : 'login',
        });

        if (activeIntent === 'register') {
          await goRegister(verified.id, authCode, group);
          return;
        }

        const login = await authApi.loginByOtp({
          phone: activePhone,
          otpId: verified.id,
          otpCode: code,
          otpAuthCode: authCode,
          otpGroup: group,
          countryCode: '84',
        });

        if (login == null || typeof login !== 'object') {
          throw new ApiError(500, 'Login OTP không trả JSON hợp lệ');
        }

        if (isNeedRegister(login)) {
          await goRegister(login.otp_id, login.otp_auth_code, login.otp_group);
          return;
        }

        const token = login.token;
        if (!token) {
          throw new ApiError(500, 'Login OTP không trả token');
        }
        await saveSession(token, login);

        if (activeIntent === 'reset') {
          // Quên passcode: đã đăng nhập bằng OTP → đặt passcode mới
          router.replace({ pathname: '/(auth)/set-passcode', params: { mode: 'reset', phone: activePhone } });
          return;
        }
        hardNavigate('/home');
      } catch (e) {
        setOtp('');
        const isClientErr = e instanceof ApiError && e.status >= 400 && e.status < 500;
        if (isClientErr) {
          const n = attempts + 1;
          setAttempts(n);
          if (n >= MAX_ATTEMPTS) {
            setSheet({ kind: 'locked', message: MSG_LOCKED });
          } else {
            setWrongOtp(true);
          }
        } else {
          const msg =
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'OTP không đúng, hết hạn, hoặc lỗi mạng.';
          setSheet({ kind: 'generic', message: msg });
        }
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [otpId, phone, otpGroup, intent, attempts]
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
    if (k === 'locked') {
      router.replace({ pathname: '/(auth)/login', params: { intent: isRegister ? 'register' : 'login' } });
    }
  };

  const onSheetAction = () => {
    const k = sheet?.kind;
    setSheet(null);
    if (k === 'support') {
      // TODO(BE): gọi API yêu cầu tư vấn viên liên hệ — hiện chỉ báo nhận yêu cầu
      setToast('Đã gửi yêu cầu. Tư vấn viên sẽ gọi hỗ trợ bạn trong ít phút.');
      return;
    }
    if (k === 'locked') {
      router.replace({ pathname: '/(auth)/login', params: { intent: isRegister ? 'register' : 'login' } });
    }
  };

  const sheetAction = sheet?.kind === 'support' ? 'Yêu cầu gọi hỗ trợ' : sheet?.kind === 'locked' ? 'Đồng ý' : 'Thử lại';

  return (
    <Screen header={<AppHeader title={isRegister ? 'Đăng ký' : 'Đăng nhập'} variant="light" left="back" />}>
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          Nhập mã OTP
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          Nhập 6 mã số được gửi tới:{' '}
          <AppText size={14} weight="bold" color={Colors.text}>
            {formatPhoneDisplay(phone)}
          </AppText>
        </AppText>

        <View style={styles.codes}>
          <CodeInput
            value={otp}
            onChangeText={(v) => {
              setOtp(v);
              if (wrongOtp) setWrongOtp(false);
            }}
            length={OTP_LENGTH}
            autoFocus
            error={wrongOtp}
            onFilled={onFilled}
          />
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.base }} /> : null}

        {wrongOtp ? (
          <View style={styles.errorRow}>
            <Icon name={Icons.alert} size={16} color={Colors.error} />
            <AppText size={13} color={Colors.error} style={{ marginLeft: 6 }}>
              Mã OTP không chính xác
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
            <Pressable onPress={handleResend} hitSlop={8} disabled={loading}>
              <AppText weight="bold" size={15} color={Colors.primary} align="center">
                Gửi lại mã OTP
              </AppText>
            </Pressable>
          )}
        </View>

        {otpDebug ? (
          // Môi trường dev/staging: BE trả otp_debug — chạm để điền nhanh
          <Pressable onPress={() => setOtp(otpDebug.replace(/\D/g, '').slice(0, OTP_LENGTH))} style={styles.debug} hitSlop={6}>
            <AppText size={12} color={Colors.textMuted} align="center">
              Mã OTP (debug): {otpDebug}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ErrorSheet
        visible={!!sheet}
        title="Lỗi đăng nhập"
        message={sheet?.message ?? ''}
        actionLabel={sheetAction}
        onClose={closeSheet}
        onAction={onSheetAction}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.base },
  resend: { marginTop: Spacing.xl, alignItems: 'center' },
  debug: { marginTop: Spacing.xl },
});
