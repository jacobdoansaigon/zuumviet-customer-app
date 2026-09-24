// Đặt mã passcode — Figma set passcode (774-33790 / 1008-0 / 1008-220):
//   mode=register: "Nhập mã passcode" / "Mã bảo vệ tài khoản" + SĐT, 6 ô, nút "Hoàn thành hồ sơ"
//                  → authApi.register (password = passcode, payload giữ như bản cũ) → loginPassword → /home
//   mode=reset:    "Nhập mã passcode mới" / "Mã bảo vệ tài khoản mới", nút "Cập nhật passcode"
//                  → authApi.changePassword (fallback demo khi BE chưa có) → /account?toast=passcode
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Button, CodeInput, Screen, ErrorSheet, Icon, Icons } from '@/components/ui';
import {
  authApi,
  ApiError,
  getOtpSession,
  saveSession,
  normalizePhoneVn,
  formatPhoneDisplay,
  isDemoFallbackError,
  type OtpSessionData,
} from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const CUSTOMER_TYPE_NORMAL = 1;
const PASSCODE_LENGTH = 6;

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

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

type SheetState = { title: string; message: string; action: string; onAction?: () => void } | null;

export default function SetPasscodeScreen() {
  useStatusBarStyle('dark');
  const raw = useLocalSearchParams<{ mode?: string; phone?: string; name?: string; email?: string }>();
  const mode = paramStr(raw.mode) === 'reset' ? 'reset' : 'register';
  const isReset = mode === 'reset';
  const name = paramStr(raw.name).trim();
  const email = paramStr(raw.email).trim();

  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [session, setSession] = useState<OtpSessionData | null>(null);

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [code, setCode] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const s = await getOtpSession<OtpSessionData>();
      if (s) {
        setSession(s);
        if (!phone && s.phone) setPhone(normalizePhoneVn(s.phone));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goLogin = () => router.replace({ pathname: '/(auth)/login', params: { intent: 'login' } });

  const resetToStart = () => {
    setStep('enter');
    setFirst('');
    setCode('');
  };

  const submitRegister = async (passcode: string) => {
    if (!session?.otp_id || !session?.otp_auth_code) {
      setSheet({
        title: 'Thiếu phiên OTP',
        message: 'Vui lòng quay lại bước nhập số điện thoại và xác thực OTP.',
        action: 'Đồng ý',
        onAction: goLogin,
      });
      return;
    }
    if (name.length < 2) {
      setSheet({
        title: 'Thiếu họ tên',
        message: 'Vui lòng quay lại nhập họ và tên (ít nhất 2 ký tự).',
        action: 'Quay lại',
        onAction: () => router.back(),
      });
      return;
    }

    const otpId = Number(session.otp_id);
    const otpAuthCode = String(session.otp_auth_code || '');
    const otpGroup = session.otp_group || 'otp_register';
    const phoneNorm = normalizePhoneVn(session.phone || phone);

    try {
      await authApi.register({
        full_name: name,
        phone: phoneNorm,
        country_code: '84',
        password: passcode,
        email,
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
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Không đăng ký được. Thử lại hoặc gửi OTP mới.';
      if (msg.includes('phone_existed') || msg.includes('existed')) {
        setSheet({
          title: 'Đã có tài khoản',
          message: 'Số điện thoại này đã đăng ký. Chuyển sang đăng nhập.',
          action: 'Đăng nhập',
          onAction: goLogin,
        });
        return;
      }
      setSheet({ title: 'Đăng ký thất bại', message: msg, action: 'Thử lại', onAction: resetToStart });
      return;
    }

    try {
      const byPass = await authApi.loginPassword(phoneNorm, passcode, '84');
      await saveSession(byPass.token, byPass);
      hardNavigate('/home');
    } catch {
      setSheet({
        title: 'Đăng ký thành công',
        message: 'Tài khoản đã tạo. Hãy đăng nhập bằng số điện thoại.',
        action: 'Đăng nhập',
        onAction: goLogin,
      });
    }
  };

  const submitReset = async (passcode: string) => {
    try {
      await authApi.changePassword({ new_password: passcode });
    } catch (e) {
      if (!isDemoFallbackError(e)) {
        setSheet({
          title: 'Cập nhật thất bại',
          message: e instanceof ApiError ? e.message : 'Có lỗi xảy ra trong quá trình',
          action: 'Thử lại',
          onAction: resetToStart,
        });
        return;
      }
      // BE chưa có endpoint / chưa cấu hình API → chế độ demo: coi như thành công
    }
    hardNavigate('/account?toast=passcode');
  };

  const handleSubmit = useCallback(
    async (confirmCode: string) => {
      if (submittingRef.current) return;
      if (confirmCode.length !== PASSCODE_LENGTH) return;
      if (confirmCode !== first) {
        setMismatch(true);
        setCode('');
        return;
      }
      submittingRef.current = true;
      setLoading(true);
      try {
        if (isReset) await submitReset(confirmCode);
        else await submitRegister(confirmCode);
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [first, isReset, session, phone, name, email]
  );

  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;

  const onFilled = useCallback((v: string) => {
    if (step === 'enter') {
      setFirst(v);
      setCode('');
      setMismatch(false);
      setStep('confirm');
      return;
    }
    void submitRef.current(v);
  }, [step]);

  const title = isReset ? 'Nhập mã passcode mới' : 'Nhập mã passcode';
  const subtitle =
    step === 'confirm' ? 'Nhập lại mã passcode để xác nhận' : isReset ? 'Mã bảo vệ tài khoản mới' : 'Mã bảo vệ tài khoản';
  const buttonTitle = isReset ? 'Cập nhật passcode' : 'Hoàn thành hồ sơ';
  const canSubmit = step === 'confirm' && code.length === PASSCODE_LENGTH && !loading;

  return (
    <Screen
      header={<AppHeader title={isReset ? 'Đổi mật khẩu' : 'Đăng ký tài khoản mới'} variant="light" left="back" />}
      footer={<Button title={buttonTitle} flat onPress={() => void handleSubmit(code)} disabled={!canSubmit} loading={loading} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          {title}
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          {subtitle}
          {phone ? (
            <>
              {' '}
              <AppText size={14} weight="bold" color={Colors.text}>
                {formatPhoneDisplay(phone)}
              </AppText>
            </>
          ) : null}
        </AppText>

        <View style={styles.codes}>
          <CodeInput
            key={step}
            value={code}
            onChangeText={(v) => {
              setCode(v);
              if (mismatch) setMismatch(false);
            }}
            length={PASSCODE_LENGTH}
            secure
            autoFocus
            error={mismatch}
            onFilled={onFilled}
          />
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.base }} /> : null}

        {mismatch ? (
          <View style={styles.errorRow}>
            <Icon name={Icons.alert} size={16} color={Colors.error} />
            <AppText size={13} color={Colors.error} style={{ marginLeft: 6 }}>
              Mã passcode không khớp, vui lòng nhập lại
            </AppText>
          </View>
        ) : null}

        {step === 'confirm' && !mismatch ? (
          <AppText size={13} color={Colors.textMuted} align="center" style={styles.stepHint} onPress={resetToStart}>
            Nhập lại từ đầu
          </AppText>
        ) : null}
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
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.base },
  stepHint: { marginTop: Spacing.xl },
});
