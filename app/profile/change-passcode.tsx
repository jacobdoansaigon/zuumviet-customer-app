// Đổi mật khẩu — Figma ĐỔI MẬT KHẨU: header tím "Đổi mật khẩu"; "Mã bảo vệ tài khoản mới" + SĐT đậm;
// 6 ô passcode; nút "Cập nhật mã bảo vệ" → Hồ sơ + toast "Cập nhật mật khẩu mới thành công".
// BE (POST /site/customeraccounts/changepassword) bắt buộc mã cũ → thêm bước 1 "Nhập mã hiện tại" trước bước nhập mã mới.
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, CodeInput, Toast } from '@/components/ui';
import { authApi, getStoredCustomer, formatPhoneDisplay, getErrorMessage } from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const PASSCODE_LENGTH = 6;

export default function ChangePasscodeScreen() {
  useStatusBarStyle('light');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'current' | 'new'>('current');
  const [current, setCurrent] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    getStoredCustomer().then((c) => setPhone(formatPhoneDisplay(c?.phone, c?.country_code || '84')));
  }, []);

  const value = step === 'current' ? current : code;
  const canSubmit = value.length === PASSCODE_LENGTH && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (step === 'current') {
      setStep('new');
      return;
    }
    if (code === current) {
      setCode('');
      setToast('Mã mới phải khác mã hiện tại');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(current, code);
      router.replace({ pathname: '/account', params: { toast: 'passcode' } });
    } catch (e) {
      const msg = getErrorMessage(e);
      // BE: error_password_old_invalid / error_password_old_required → quay lại bước nhập mã cũ
      if (/password_old/i.test(msg)) {
        setStep('current');
        setCurrent('');
        setCode('');
        setToast('Mã hiện tại không đúng, vui lòng nhập lại');
      } else {
        setCode('');
        setToast(msg);
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
            {phone}
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
          {step === 'current' ? 'Nhập mã passcode đang dùng để xác nhận là chính bạn.' : 'Mã passcode gồm 6 chữ số, dùng để đăng nhập bằng mật khẩu.'}
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
