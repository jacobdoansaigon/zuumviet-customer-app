// OTP → login hoặc form đăng ký khách
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import {
  authApi,
  ApiError,
  saveSession,
  saveOtpSession,
  normalizePhoneVn,
} from '@/services/api';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

function paramStr(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return String(v[0] ?? fallback);
  return v != null && v !== '' ? String(v) : fallback;
}

export default function OtpScreen() {
  const raw = useLocalSearchParams<{
    phone?: string;
    otpId?: string;
    otpDebug?: string;
    intent?: string;
    otpGroup?: string;
  }>();

  const phone = normalizePhoneVn(paramStr(raw.phone));
  const isRegister = paramStr(raw.intent) === 'register';
  const otpGroup =
    paramStr(raw.otpGroup) || (isRegister ? 'otp_register' : 'otp_general');

  const [otpId, setOtpId] = useState(Number(paramStr(raw.otpId)) || 0);
  const [otp, setOtp] = useState(paramStr(raw.otpDebug));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const inputRef = useRef<TextInput>(null);

  const formattedPhone = useMemo(() => {
    if (!phone) return '';
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  }, [phone]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      const res = await authApi.sendOtp(phone, otpGroup, '84');
      setOtpId(res.id);
      setOtp(res.otp_debug ?? '');
      setCountdown(RESEND_TIMEOUT);
      await saveOtpSession({
        phone,
        country_code: '84',
        otp_group: otpGroup,
        otp_id: res.id,
        otp_debug: res.otp_debug,
        intent: isRegister ? 'register' : 'login',
      });
    } catch (e) {
      Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Gửi lại OTP thất bại');
    }
  };

  const goRegister = async (otpIdVal: number, authCode: string, group: string) => {
    if (!authCode) {
      Alert.alert('Lỗi OTP', 'Thiếu auth_code sau xác thực. Gửi lại OTP.');
      return;
    }
    await saveOtpSession({
      phone,
      country_code: '84',
      otp_id: otpIdVal,
      otp_auth_code: authCode,
      otp_group: group,
      intent: 'register',
    });
    // Không đưa auth_code lên URL (dễ mất / cắt). Chỉ phone để hiển thị.
    router.replace({
      pathname: '/(auth)/register',
      params: { phone },
    });
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || !otpId) return;
    setLoading(true);
    try {
      const verified = await authApi.verifyOtp({
        phone,
        otpId,
        otpCode: otp,
        otpGroup,
        countryCode: '84',
      });

      const group = verified.group || otpGroup;
      const authCode = verified.auth_code;

      if (!authCode) {
        throw new ApiError(422, 'OTP verify không trả auth_code');
      }

      // Đăng ký: sau verify → form (không phụ thuộc loginotp)
      if (isRegister) {
        await goRegister(verified.id, authCode, group);
        return;
      }

      const login = await authApi.loginByOtp({
        phone,
        otpId: verified.id,
        otpCode: otp,
        otpAuthCode: authCode,
        otpGroup: group,
        countryCode: '84',
      });

      if ('need_register' in login && login.need_register) {
        await goRegister(login.otp_id, login.otp_auth_code, login.otp_group);
        return;
      }

      const token = (login as { token: string }).token;
      await saveSession(token, login as typeof login & { token: string });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(
        'Xác thực thất bại',
        e instanceof ApiError ? e.message : 'OTP không đúng hoặc hết hạn'
      );
    } finally {
      setLoading(false);
    }
  };

  const digits = otp.split('').concat(Array(OTP_LENGTH - otp.length).fill(''));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isRegister ? 'Xác thực đăng ký' : 'Nhập mã xác thực'}
        </Text>
        <Text style={styles.subtitle}>
          Mã OTP đã được gửi đến số{'\n'}
          <Text style={styles.phoneHighlight}>+84 {formattedPhone}</Text>
        </Text>
        {paramStr(raw.otpDebug) || otp ? (
          <Text style={styles.debugHint}>
            OTP_DEBUG: {paramStr(raw.otpDebug) || otp}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.otpRow}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
      >
        {digits.map((d, i) => (
          <View
            key={i}
            style={[
              styles.otpBox,
              otp.length === i && styles.otpBoxActive,
              d ? styles.otpBoxFilled : null,
            ]}
          >
            <Text style={styles.otpDigit}>{d}</Text>
          </View>
        ))}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        style={styles.hiddenInput}
        autoFocus
      />

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Không nhận được mã? </Text>
        {countdown > 0 ? (
          <Text style={styles.resendCountdown}>Gửi lại sau {countdown}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Gửi lại</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.ctaContainer}>
        <Button
          title="Xác nhận"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length !== OTP_LENGTH}
          variant={otp.length === OTP_LENGTH ? 'primary' : 'secondary'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  header: { gap: Spacing.sm, marginBottom: Spacing['3xl'] },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.base * 1.6,
  },
  phoneHighlight: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  debugHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: { borderColor: Colors.primary },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  otpDigit: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  resendText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  resendCountdown: { fontSize: Typography.fontSize.sm, color: Colors.gray500 },
  resendLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    left: Spacing['2xl'],
    right: Spacing['2xl'],
  },
});
