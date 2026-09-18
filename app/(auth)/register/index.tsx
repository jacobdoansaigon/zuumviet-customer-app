// Đăng ký tài xế mới — Step 1: Thông tin cá nhân
// Design: Figma [Driver] Sign In + Sign Up > Đk tài xế

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function RegisterStep1() {
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | '',
    email: '',
    referralCode: '',
  });

  const isValid = form.fullName.trim().length >= 2 && form.dateOfBirth.length === 10;

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator total={4} current={1} />

        <Text style={styles.title}>Thông tin cá nhân</Text>
        <Text style={styles.subtitle}>Điền đầy đủ thông tin để đăng ký tài xế</Text>

        <View style={styles.form}>
          <Field
            label="Họ và tên (*)"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChangeText={(v) => update('fullName', v)}
          />
          <Field
            label="Ngày sinh (*)"
            placeholder="DD/MM/YYYY"
            value={form.dateOfBirth}
            onChangeText={(v) => update('dateOfBirth', v)}
            keyboardType="number-pad"
            maxLength={10}
          />

          {/* Gender select */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderRow}>
              {(['male', 'female'] as const).map((g) => (
                <Button
                  key={g}
                  title={g === 'male' ? '👨 Nam' : '👩 Nữ'}
                  onPress={() => update('gender', g)}
                  variant={form.gender === g ? 'primary' : 'outline'}
                  size="md"
                  fullWidth={false}
                  style={styles.genderBtn}
                />
              ))}
            </View>
          </View>

          <Field
            label="Email (không bắt buộc)"
            placeholder="example@email.com"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Mã giới thiệu (nếu có)"
            placeholder="ZUUM2024"
            value={form.referralCode}
            onChangeText={(v) => update('referralCode', v.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>

        <Button
          title="Tiếp theo →"
          onPress={() =>
            router.push({
              pathname: '/(auth)/register/step2',
              params: { ...form },
            })
          }
          disabled={!isValid}
          variant={isValid ? 'primary' : 'secondary'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, placeholder, value, onChangeText,
  keyboardType, autoCapitalize, maxLength,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; maxLength?: number;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        maxLength={maxLength}
      />
    </View>
  );
}

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
  form: { gap: Spacing.base },
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
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderBtn: { flex: 1 },
});
