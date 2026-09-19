// OTP → login hoặc form đăng ký khách (web-safe errors)
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import {
  authApi,
  ApiError,
  saveSession,
  saveOtpSession,
  getOtpSession,
  normalizePhoneVn,
  type OtpSessionData,
} from '@/services/api';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

function paramStr(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return String(v[0] ?? fallback);
  return v != null && v !== '' ? String(v) : fallback;
}

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function OtpScreen() {
  const raw = useLocalSearchParams<{
    phone?: string;
    otpId?: string;
    otpDebug?: string;
    intent?: string;
    otpGroup?: string;
  }>();

  const [phone, setPhone] = useState(normalizePhoneVn(paramStr(raw.phone)));
  const [isRegister, setIsRegister] = useState(paramStr(raw.intent) === 'register');
  const [otpGroup, setOtpGroup] = useState(
    paramStr(raw.otpGroup) ||
      (paramStr(raw.intent) === 'register' ? 'otp_register' : 'otp_general')
  );

  const [otpId, setOtpId] = useState(Number(paramStr(raw.otpId)) || 0);
  const [otp, setOtp] = useState(paramStr(raw.otpDebug));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Khôi phục otp_id / group từ AsyncStorage nếu URL mất param (hay gặp trên web)
  useEffect(() => {
    (async () => {
      const s = await getOtpSession<OtpSessionData>();
      if (!s) return;
      if (!phone && s.phone) setPhone(normalizePhoneVn(s.phone));
      if (!otpId && s.otp_id) setOtpId(Number(s.otp_id));
      if (s.otp_group) setOtpGroup(s.otp_group);
      if (s.intent === 'register') setIsRegister(true);
      if (!otp && s.otp_debug) setOtp(String(s.otp_debug));
    })();
  }, []);

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
    setError('');
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
      const msg = e instanceof ApiError ? e.message : 'Gửi lại OTP thất bại';
      setError(msg);
      notify('Lỗi', msg);
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
    router.replace({
      pathname: '/(auth)/register',
      params: { phone },
    });
  };

  const goHomeAfterLogin = () => {
    // /home — không dùng /(tabs) hay / vì conflict với welcome app/index
    try {
      if (typeof window !== 'undefined') {
        window.location.assign('/home');
        return;
      }
    } catch {
      /* fall through */
    }
    router.replace('/home');
  };

  const handleVerify = async () => {
    setError('');
    if (otp.length !== OTP_LENGTH) {
      setError('Nhập đủ 6 số OTP.');
      return;
    }

    // Khôi phục session nếu state mất otp_id (race / mất query trên web)
    let activeOtpId = otpId;
    let activePhone = phone;
    let activeGroup = otpGroup;
    let activeRegister = isRegister;
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
          activeRegister = true;
          setIsRegister(true);
        }
      }
    }

    if (!activeOtpId) {
      setError('Thiếu mã phiên OTP. Quay lại bước nhập SĐT và gửi OTP mới.');
      notify('Thiếu OTP', 'Quay lại và nhấn nhận mã OTP lại.');
      return;
    }
    if (!activePhone) {
      setError('Thiếu số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      const verified = await authApi.verifyOtp({
        phone: activePhone,
        otpId: activeOtpId,
        otpCode: otp,
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
        intent: activeRegister ? 'register' : 'login',
      });

      if (activeRegister) {
        await goRegister(verified.id, authCode, group);
        return;
      }

      const login = await authApi.loginByOtp({
        phone: activePhone,
        otpId: verified.id,
        otpCode: otp,
        otpAuthCode: authCode,
        otpGroup: group,
        countryCode: '84',
      });

      if (login == null || typeof login !== 'object') {
        throw new ApiError(500, 'Login OTP không trả JSON hợp lệ');
      }

      if ('need_register' in login && (login as { need_register?: boolean }).need_register) {
        const nr = login as {
          otp_id: number;
          otp_auth_code: string;
          otp_group: string;
        };
        await goRegister(nr.otp_id, nr.otp_auth_code, nr.otp_group);
        return;
      }

      const token = (login as { token?: string }).token;
      if (!token) {
        throw new ApiError(500, 'Login OTP không trả token');
      }
      await saveSession(token, login as typeof login & { token: string });
      goHomeAfterLogin();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'OTP không đúng, hết hạn, hoặc lỗi mạng.';
      setError(msg);
      notify('Xác thực thất bại', msg);
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
        {otp ? <Text style={styles.debugHint}>OTP_DEBUG: {otp}</Text> : null}
        {otpId ? (
          <Text style={styles.metaHint}>otp_id: {otpId} · group: {otpGroup}</Text>
        ) : (
          <Text style={styles.errorBanner}>
            Thiếu otp_id — hãy quay lại và gửi OTP mới.
          </Text>
        )}
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

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
          title={loading ? 'Đang xác thực...' : 'Xác nhận'}
          onPress={handleVerify}
          loading={loading}
          disabled={loading}
          variant="primary"
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
  header: { gap: Spacing.sm, marginBottom: Spacing.xl },
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
  metaHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    color: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    lineHeight: 20,
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
