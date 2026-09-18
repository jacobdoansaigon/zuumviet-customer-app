// Đăng ký tài xế — Step 4: Xác nhận & gọi API register
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { authApi, ApiError, getOtpSession, saveSession } from '@/services/api';

export default function RegisterStep4() {
  const params = useLocalSearchParams();
  const [autoAccept, setAutoAccept] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!termsAccepted) {
      Alert.alert('Lưu ý', 'Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lưu ý', 'Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const otpSession = await getOtpSession<{
        phone?: string;
        otp_id?: number;
        otp_auth_code?: string;
        otp_group?: string;
      }>();

      const phone = (params.phone as string) || otpSession?.phone || '';
      const otpId = Number(params.otpId || otpSession?.otp_id || 0);
      const otpAuthCode =
        (params.otpAuthCode as string) || otpSession?.otp_auth_code || '';
      const otpGroup =
        (params.otpGroup as string) || otpSession?.otp_group || 'otp_general';

      const dob = String(params.dateOfBirth || '');
      let birthday = 0;
      const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        birthday = Math.floor(
          new Date(+m[3], +m[2] - 1, +m[1]).getTime() / 1000
        );
      }

      const gender =
        params.gender === 'female' ? 2 : params.gender === 'male' ? 1 : 0;

      await authApi.register({
        full_name: params.fullName,
        phone,
        country_code: '84',
        email: params.email || '',
        password,
        avatar: 0,
        gender,
        birthday,
        geofence_id: 0,
        ref_aff_code: params.referralCode || '',
        otp_id: otpId,
        otp_group: otpGroup,
        otp_auth_code: otpAuthCode,
      });

      const logged = await authApi.loginPassword(phone, password, '84');
      await saveSession(logged.token, logged);

      Alert.alert(
        '🎉 Đăng ký thành công!',
        'Bạn đã được đăng nhập.',
        [{ text: 'Vào trang chủ', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      Alert.alert(
        'Đăng ký thất bại',
        e instanceof ApiError ? e.message : 'Vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepIndicator total={4} current={4} />
      <Text style={styles.title}>Xác nhận đăng ký</Text>
      <Text style={styles.subtitle}>Kiểm tra lại thông tin trước khi gửi</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="Họ tên" value={params.fullName as string} />
        <SummaryRow label="Ngày sinh" value={params.dateOfBirth as string} />
        <SummaryRow
          label="Phương tiện"
          value={`${params.vehicleSubtype || ''} (${params.vehicleType || ''})`}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Tạo mật khẩu (*)</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Tối thiểu 6 ký tự"
          placeholderTextColor={Colors.placeholder}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>⚡ Tự động nhận cuốc xe</Text>
          <Text style={styles.toggleDesc}>Có thể đổi sau trong Cài đặt.</Text>
        </View>
        <Switch
          value={autoAccept}
          onValueChange={setAutoAccept}
          trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
          thumbColor={autoAccept ? Colors.primary : Colors.gray500}
        />
      </View>

      <View style={styles.termsCard}>
        <Switch
          value={termsAccepted}
          onValueChange={setTermsAccepted}
          trackColor={{ false: Colors.gray300, true: Colors.success }}
          thumbColor={termsAccepted ? Colors.success : Colors.gray500}
        />
        <Text style={styles.termsText}>
          Tôi đồng ý Điều khoản dịch vụ và Chính sách bảo mật
        </Text>
      </View>

      <Button
        title={loading ? 'Đang gửi...' : '🚀 Gửi đăng ký'}
        onPress={handleSubmit}
        loading={loading}
        disabled={!termsAccepted || password.length < 6}
        variant={termsAccepted && password.length >= 6 ? 'primary' : 'secondary'}
      />
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value || '—'}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  value: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  fieldGroup: { gap: Spacing.xs },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  toggleInfo: { flex: 1, gap: 4 },
  toggleTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  toggleDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});
