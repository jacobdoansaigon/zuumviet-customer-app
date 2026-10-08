// Đổi mật khẩu — Figma ĐỔI MẬT KHẨU: header tím "Đổi mật khẩu"; "Mã bảo vệ tài khoản mới" + SĐT đậm;
// 6 ô passcode; nút "Cập nhật mã bảo vệ" → Hồ sơ + toast "Cập nhật mật khẩu mới thành công".
// POST /v1/customer/me/passcode {currentPasscode, newPasscode} — bước 1 nhập mã hiện tại, bước 2 mã mới (kiểm luật
// passcode như server). Server thu hồi mọi phiên khác, giữ phiên đang dùng.
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, CodeInput, Toast } from '@/components/ui';
import { formatPhone, useProfile } from '@/services/session';
import { PASSCODE_LENGTH, passcodeWeakness } from '@/services/passcode';
import { api, errorMessage, isApiError } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function ChangePasscodeScreen() {
  useStatusBarStyle('light');
  const profile = useProfile();
  const [step, setStep] = useState<'current' | 'new'>('current');
  const [current, setCurrent] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const value = step === 'current' ? current : code;
  const canSubmit = value.length === PASSCODE_LENGTH && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (step === 'current') {
      setStep('new');
      return;
    }
    const weakness = passcodeWeakness(code);
    if (weakness) {
      setCode('');
      setToast(weakness);
      return;
    }
    if (code === current) {
      setCode('');
      setToast('Mã mới phải khác mã hiện tại');
      return;
    }
    setSaving(true);
    try {
      await api('POST /v1/customer/me/passcode', { body: { currentPasscode: current, newPasscode: code } });
      router.replace({ pathname: '/account', params: { toast: 'passcode' } });
    } catch (e) {
      if (isApiError(e, 'auth.invalid_passcode')) {
        setStep('current');
        setCurrent('');
        setCode('');
        setToast('Mã hiện tại không đúng, vui lòng nhập lại');
      } else {
        setCode('');
        setToast(errorMessage(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title="Đổi mật khẩu"
          variant="dark"
          left="back"
          onLeftPress={() => {
            if (step === 'new') {
              setStep('current');
              setCode('');
            } else router.back();
          }}
        />
      }
      footer={<Button title={step === 'current' ? 'Tiếp tục' : 'Cập nhật mã bảo vệ'} flat onPress={handleSubmit} disabled={!canSubmit} loading={saving} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <AppText size={14} color={Colors.textSecondary} align="center" style={{ lineHeight: 21 }}>
          {step === 'current' ? 'Mã bảo vệ hiện tại của ' : 'Mã bảo vệ tài khoản mới '}
          <AppText size={14} weight="bold" color={Colors.text}>
            {formatPhone(profile?.phone)}
          </AppText>
        </AppText>

        <View style={styles.codes}>
          {step === 'current' ? (
            <CodeInput key="current" value={current} onChangeText={setCurrent} length={PASSCODE_LENGTH} secure autoFocus />
          ) : (
            <CodeInput key="new" value={code} onChangeText={setCode} length={PASSCODE_LENGTH} secure autoFocus />
          )}
        </View>

        <AppText size={12} color={Colors.textMuted} align="center" style={{ marginTop: Spacing.xl }}>
          {step === 'current'
            ? 'Nhập mã passcode đang dùng để xác nhận là chính bạn.'
            : 'Mã passcode gồm 6 chữ số, không dùng 6 số giống nhau hoặc dãy liên tiếp (vd 123456).'}
        </AppText>
      </View>
      <Toast visible={!!toast} message={toast ?? ''} tone="error" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  codes: { marginTop: Spacing.xl },
});
