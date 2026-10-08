// Đặt mã passcode — Figma set passcode (774-33790 / 1008-0 / 1008-220):
//   mode=register: "Nhập mã passcode" / "Mã bảo vệ tài khoản" + SĐT, 6 ô, nút "Hoàn thành hồ sơ"
//                  → POST /auth/register {verificationToken, fullName, passcode, email?, referralCode?} → /me → /home
//   mode=reset:    "Nhập mã passcode mới" / "Mã bảo vệ tài khoản mới", nút "Cập nhật passcode"
//                  → POST /auth/passcode/reset {verificationToken, newPasscode} → đăng nhập bằng passcode mới
// Passcode kiểm cùng luật với server (6 số, không 6 số giống nhau, không dãy liên tiếp) trước khi gửi.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Button, CodeInput, Screen, ErrorSheet, Dialog, Icon, Icons } from '@/components/ui';
import { clearAuthFlow, getAuthFlow, hasValidVerification, type AuthFlow } from '@/services/authFlow';
import { completeLogin, formatPhone } from '@/services/session';
import { PASSCODE_LENGTH, passcodeWeakness } from '@/services/passcode';
import { api, errorMessage, getDeviceId, isApiError } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { enterApp } from '@/services/authNav';

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

type SheetState = { title: string; message: string; action: string; onAction?: () => void } | null;

export default function SetPasscodeScreen() {
  useStatusBarStyle('dark');
  const raw = useLocalSearchParams<{ mode?: string; name?: string; email?: string; referralCode?: string }>();
  const isReset = paramStr(raw.mode) === 'reset';
  const name = paramStr(raw.name).trim();
  const email = paramStr(raw.email).trim();
  const referralCode = paramStr(raw.referralCode).trim().toUpperCase();

  const [flow, setFlow] = useState<AuthFlow | null>(null);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [code, setCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [referralNotice, setReferralNotice] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    void getAuthFlow().then(setFlow);
  }, []);

  // quên passcode: rời màn (bỏ dở) → huỷ verificationToken đã lưu. Đăng ký: màn đăng ký bên dưới còn dùng phiên.
  const navigation = useNavigation();
  useEffect(() => {
    if (!isReset) return;
    return navigation.addListener('beforeRemove', () => void clearAuthFlow());
  }, [navigation, isReset]);

  const goLogin = () => router.replace('/(auth)/login');

  const resetToStart = () => {
    setStep('enter');
    setFirst('');
    setCode('');
    setInputError(null);
  };

  const expiredSheet = () =>
    setSheet({
      title: 'Phiên xác thực hết hạn',
      message: 'Vui lòng quay lại bước nhập số điện thoại và xác thực OTP.',
      action: 'Đồng ý',
      onAction: goLogin,
    });

  const submitRegister = async (passcode: string) => {
    const current = flow ?? (await getAuthFlow());
    if (!hasValidVerification(current)) {
      expiredSheet();
      return;
    }
    if (name.length < 2) {
      setSheet({ title: 'Thiếu họ tên', message: 'Vui lòng quay lại nhập họ và tên (ít nhất 2 ký tự).', action: 'Quay lại', onAction: () => router.back() });
      return;
    }
    try {
      const tokens = await api('POST /v1/public/customer/auth/register', {
        body: {
          verificationToken: current.verificationToken,
          fullName: name,
          passcode,
          email: email || undefined,
          referralCode: referralCode || undefined,
          deviceId: await getDeviceId(),
        },
      });
      await completeLogin(tokens);
      await clearAuthFlow();
    } catch (e) {
      if (isApiError(e, 'auth.phone_taken')) {
        setSheet({ title: 'Đã có tài khoản', message: errorMessage(e), action: 'Đăng nhập', onAction: goLogin });
      } else if (isApiError(e, 'auth.verification_invalid')) {
        expiredSheet();
      } else {
        setSheet({ title: 'Đăng ký thất bại', message: errorMessage(e, 'Không đăng ký được, vui lòng thử lại'), action: 'Thử lại', onAction: resetToStart });
      }
      return;
    }

    // Mã giới thiệu sai / người giới thiệu đã đủ thành viên: server vẫn cho đăng ký (không gắn người giới thiệu) → báo
    if (referralCode) {
      try {
        const aff = await api('GET /v1/customer/affiliate');
        if ('referrer' in aff && !aff.referrer) {
          setReferralNotice(true);
          return;
        }
      } catch {
        /* không chặn vào app */
      }
    }
    enterApp('/home');
  };

  const submitReset = async (passcode: string) => {
    const current = flow ?? (await getAuthFlow());
    if (!hasValidVerification(current) || current.intent !== 'reset') {
      expiredSheet();
      return;
    }
    try {
      await api('POST /v1/public/customer/auth/passcode/reset', {
        body: { verificationToken: current.verificationToken, newPasscode: passcode },
      });
    } catch (e) {
      if (isApiError(e, 'auth.verification_invalid')) expiredSheet();
      else setSheet({ title: 'Cập nhật thất bại', message: errorMessage(e), action: 'Thử lại', onAction: resetToStart });
      return;
    }
    await clearAuthFlow();
    try {
      const tokens = await api('POST /v1/public/customer/auth/login/passcode', {
        body: { phone: current.phone, passcode, deviceId: await getDeviceId() },
      });
      await completeLogin(tokens);
      enterApp('/account?toast=passcode');
    } catch {
      setSheet({
        title: 'Đã đổi passcode',
        message: 'Passcode mới đã được lưu. Vui lòng đăng nhập lại bằng passcode mới.',
        action: 'Đăng nhập',
        onAction: goLogin,
      });
    }
  };

  const handleSubmit = useCallback(
    async (confirmCode: string) => {
      if (submittingRef.current || confirmCode.length !== PASSCODE_LENGTH) return;
      if (confirmCode !== first) {
        setInputError('Mã passcode không khớp, vui lòng nhập lại');
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
    [first, isReset, flow, name, email, referralCode],
  );

  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;

  const onFilled = useCallback(
    (v: string) => {
      if (step === 'enter') {
        const weakness = passcodeWeakness(v);
        if (weakness) {
          setInputError(weakness);
          setCode('');
          return;
        }
        setFirst(v);
        setCode('');
        setInputError(null);
        setStep('confirm');
        return;
      }
      void submitRef.current(v);
    },
    [step],
  );

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
          {flow?.phone ? (
            <>
              {' '}
              <AppText size={14} weight="bold" color={Colors.text}>
                {formatPhone(flow.phone)}
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
              if (inputError) setInputError(null);
            }}
            length={PASSCODE_LENGTH}
            secure
            autoFocus
            error={!!inputError}
            onFilled={onFilled}
          />
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.base }} /> : null}

        {inputError ? (
          <View style={styles.errorRow}>
            <Icon name={Icons.alert} size={16} color={Colors.error} />
            <AppText size={13} color={Colors.error} style={{ marginLeft: 6 }}>
              {inputError}
            </AppText>
          </View>
        ) : step === 'enter' ? (
          <AppText size={12} color={Colors.textMuted} align="center" style={styles.stepHint}>
            6 chữ số, không dùng 6 số giống nhau hoặc dãy liên tiếp (vd 123456)
          </AppText>
        ) : (
          <AppText size={13} color={Colors.textMuted} align="center" style={styles.stepHint} onPress={resetToStart}>
            Nhập lại từ đầu
          </AppText>
        )}
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

      <Dialog
        visible={referralNotice}
        dismissable={false}
        title="Đăng ký thành công"
        message={`Mã giới thiệu ${referralCode} không hợp lệ hoặc người giới thiệu đã đủ thành viên. Bạn có thể nhập mã khác trong mục Cộng đồng.`}
        actions={[{ label: 'Đồng ý', onPress: () => enterApp('/home') }]}
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
