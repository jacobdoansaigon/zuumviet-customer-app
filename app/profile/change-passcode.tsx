// Đổi mật khẩu — Figma ĐỔI MẬT KHẨU: header tím "Đổi mật khẩu"; "Mã bảo vệ tài khoản mới" + SĐT đậm;
// 6 ô passcode; nút "Cập nhật mã bảo vệ" → Hồ sơ + toast "Cập nhật mật khẩu mới thành công".
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, CodeInput, Toast } from '@/components/ui';
import { authApi, getStoredCustomer, formatPhoneDisplay, isDemoFallbackError, getErrorMessage } from '@/services/api';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const PASSCODE_LENGTH = 6;

export default function ChangePasscodeScreen() {
  useStatusBarStyle('light');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    getStoredCustomer().then((c) => setPhone(formatPhoneDisplay(c?.phone, c?.country_code || '84')));
  }, []);

  const canSubmit = code.length === PASSCODE_LENGTH && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      try {
        await authApi.changePassword({ new_password: code });
      } catch (e) {
        // BE chưa có endpoint / chưa cấu hình API → chế độ demo
        if (!isDemoFallbackError(e)) throw e;
      }
      router.replace({ pathname: '/account', params: { toast: 'passcode' } });
    } catch (e) {
      setCode('');
      setToast(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Đổi mật khẩu" variant="dark" left="back" />}
      footer={<Button title="Cập nhật mã bảo vệ" flat onPress={handleSubmit} disabled={!canSubmit} loading={saving} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <AppText size={14} color={Colors.textSecondary} align="center" style={{ lineHeight: 21 }}>
          Mã bảo vệ tài khoản mới{' '}
          <AppText size={14} weight="bold" color={Colors.text}>
            {phone}
          </AppText>
        </AppText>

        <View style={styles.codes}>
          <CodeInput value={code} onChangeText={setCode} length={PASSCODE_LENGTH} secure autoFocus />
        </View>

        <AppText size={12} color={Colors.textMuted} align="center" style={{ marginTop: Spacing.xl }}>
          Mã passcode gồm 6 chữ số, dùng để đăng nhập bằng mật khẩu.
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
