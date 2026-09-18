// Đăng ký khách — form + xử lý autofill web + SĐT đã tồn tại

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import {
  authApi,
  ApiError,
  getOtpSession,
  saveSession,
  normalizePhoneVn,
  type OtpSessionData,
} from '@/services/api';

const CUSTOMER_TYPE_NORMAL = 1;

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function readAutofillValue(
  e: NativeSyntheticEvent<TextInputFocusEventData>
): string {
  const ne = e.nativeEvent as TextInputFocusEventData & { text?: string };
  if (ne?.text != null && String(ne.text).length > 0) return String(ne.text);
  const target = (e as unknown as { target?: { value?: string } }).target;
  if (target?.value != null) return String(target.value);
  return '';
}

export default function RegisterScreen() {
  const raw = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<OtpSessionData | null>(null);
  const [formError, setFormError] = useState('');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

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
            setFormError(
              'Số này đã có tài khoản. Hãy đăng nhập bằng OTP hoặc mật khẩu.'
            );
            notify(
              'Đã có tài khoản',
              'SĐT này đã đăng ký. Chuyển sang đăng nhập.'
            );
            router.replace({
              pathname: '/(auth)/login',
              params: { intent: 'login' },
            });
            return;
          }
        } catch {
          // check API fail — vẫn cho thử đăng ký
        }
      }

      if (!s?.otp_id || !s?.otp_auth_code) {
        setFormError(
          'Thiếu phiên OTP. Vui lòng bấm Đăng ký lại và xác thực OTP.'
        );
        setSessionReady(false);
        return;
      }
      setSession(s);
      setSessionReady(true);
    })();
  }, []);

  const handleRegister = async () => {
    setFormError('');
    const name = fullName.trim();
    const pass = password;
    const pass2 = passwordConfirm;

    if (!sessionReady || !session) {
      setFormError('Thiếu phiên OTP. Quay lại Đăng ký và xác thực OTP.');
      notify('Thiếu OTP', 'Quay lại bước Đăng ký khách hàng và nhận OTP mới.');
      return;
    }
    if (name.length < 2) {
      setFormError('Nhập họ tên (ít nhất 2 ký tự).');
      return;
    }
    if (pass.length < 6) {
      setFormError(
        'Mật khẩu chưa đủ 6 ký tự — nếu trình duyệt tự điền, hãy gõ lại mật khẩu trong ô.'
      );
      return;
    }
    if (pass !== pass2) {
      setFormError('Hai mật khẩu không khớp — gõ lại cả hai ô (tránh autofill lệch).');
      return;
    }

    setLoading(true);
    try {
      const otpId = Number(session.otp_id);
      const otpAuthCode = String(session.otp_auth_code || '');
      const otpGroup = session.otp_group || 'otp_register';
      const phoneNorm = normalizePhoneVn(session.phone || phone);

      await authApi.register({
        full_name: name,
        phone: phoneNorm,
        country_code: '84',
        password: pass,
        email: '',
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

      try {
        const byPass = await authApi.loginPassword(phoneNorm, pass, '84');
        await saveSession(byPass.token, byPass);
        router.replace('/(tabs)');
      } catch {
        notify(
          'Đăng ký thành công',
          'Tài khoản đã tạo. Hãy đăng nhập bằng số điện thoại.'
        );
        router.replace({
          pathname: '/(auth)/login',
          params: { intent: 'login' },
        });
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Không đăng ký được. Thử lại hoặc gửi OTP mới.';
      if (msg.includes('phone_existed') || msg.includes('existed')) {
        setFormError('SĐT đã có tài khoản — hãy Đăng nhập.');
        notify('Đã có tài khoản', 'Chuyển sang đăng nhập.');
        router.replace({
          pathname: '/(auth)/login',
          params: { intent: 'login' },
        });
        return;
      }
      setFormError(msg);
      notify('Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Đăng ký khách hàng</Text>
        <Text style={styles.sub}>
          SĐT +84 {phone || '…'} — nhập họ tên và mật khẩu (gõ tay, tránh autofill
          lệch).
        </Text>

        {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={Colors.placeholder}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu (≥ 6 ký tự)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            onBlur={(e) => {
              const v = readAutofillValue(e);
              if (v) setPassword(v);
            }}
            secureTextEntry
            placeholder="Gõ mật khẩu (không dùng Strong Password)"
            placeholderTextColor={Colors.placeholder}
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nhập lại mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            onBlur={(e) => {
              const v = readAutofillValue(e);
              if (v) setPasswordConfirm(v);
            }}
            secureTextEntry
            placeholder="Gõ lại mật khẩu"
            placeholderTextColor={Colors.placeholder}
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>

        <Button
          title={loading ? 'Đang tạo...' : 'Đăng ký khách hàng'}
          onPress={handleRegister}
          disabled={loading}
          loading={loading}
          variant="primary"
        />

        <Text
          style={styles.loginLink}
          onPress={() =>
            router.replace({
              pathname: '/(auth)/login',
              params: { intent: 'login' },
            })
          }
        >
          Đã có tài khoản? Đăng nhập →
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  sub: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    color: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  field: { gap: Spacing.sm, marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  loginLink: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
