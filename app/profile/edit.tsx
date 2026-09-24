// Chỉnh sửa hồ sơ — Figma CHỈNH SỬA HỒ SƠ: header tím; avatar 64 + huy hiệu camera; "Họ và tên (*)",
// "Email", "Số điện thoại (bạn không thể cập nhật)" disabled; nút đáy "Cập nhật" (xám → tím).
// Action sheet ảnh: "Chụp ảnh" / "Chọn ảnh từ thư viện" / "Huỷ bỏ". Toast teal/đỏ.
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, TextField, Avatar, Toast } from '@/components/ui';
import { PhotoActionSheet } from '@/components/profile';
import {
  customerApi,
  getStoredCustomer,
  updateStoredCustomer,
  isDemoFallbackError,
  getDisplayName,
  formatPhoneDisplay,
  type CustomerProfile,
} from '@/services/api';
import { localAvatarStore } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EditProfileScreen() {
  useStatusBarStyle('light');
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const localAvatar = localAvatarStore.use();

  useEffect(() => {
    getStoredCustomer().then((c) => {
      setCustomer(c);
      setFullName(getDisplayName(c, ''));
      setEmail(typeof c?.email === 'string' ? c.email : '');
    });
  }, []);

  const name = fullName.trim();
  const emailTrim = email.trim();
  const emailOk = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);
  const originalName = getDisplayName(customer, '');
  const originalEmail = typeof customer?.email === 'string' ? customer.email : '';
  const changed = name !== originalName || emailTrim !== originalEmail;
  const canSave = !!customer && name.length >= 2 && emailOk && changed && !saving;

  const avatarUri = localAvatar ?? (typeof customer?.avatar_url === 'string' ? customer.avatar_url : null);

  const handleSave = async () => {
    if (!canSave || !customer) return;
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      try {
        await customerApi.updateProfile(customer.id, { full_name: name, email: emailTrim });
      } catch (e) {
        // BE chưa có endpoint / chưa cấu hình API → vẫn lưu cục bộ (demo)
        if (!isDemoFallbackError(e)) throw e;
      }
      await updateStoredCustomer({ full_name: name, fullname: name, email: emailTrim });
      router.replace({ pathname: '/account', params: { toast: 'profile' } });
    } catch {
      setToast({ msg: 'Có lỗi xảy ra trong quá trình', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Chỉnh sửa hồ sơ" variant="dark" left="back" />}
      footer={<Button title="Cập nhật" flat onPress={handleSave} disabled={!canSave} loading={saving} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <Avatar uri={avatarUri} name={name || 'K'} size={64} editable onPress={() => setPhotoOpen(true)} />
          <AppText size={12} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
            Chạm để thay ảnh đại diện
          </AppText>
        </View>

        <TextField
          label="Họ và tên"
          required
          value={fullName}
          onChangeText={setFullName}
          placeholder="Họ và tên"
          autoCapitalize="words"
          containerStyle={styles.field}
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError('');
          }}
          onBlur={() => {
            if (emailTrim && !EMAIL_RE.test(emailTrim)) setEmailError('Email không hợp lệ');
          }}
          error={emailError || undefined}
          placeholder="email@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.field}
        />
        <TextField
          label="Số điện thoại (bạn không thể cập nhật)"
          value={formatPhoneDisplay(customer?.phone, customer?.country_code || '84')}
          disabled
          clearable={false}
          containerStyle={styles.field}
        />
      </View>

      <PhotoActionSheet
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onPicked={(uri) => {
          // TODO(BE): upload ảnh → avatar id; hiện lưu URI cục bộ để hiển thị
          localAvatarStore.set(uri);
          setToast({ msg: 'Cập nhật hồ sơ thành công', tone: 'success' });
        }}
        onError={(msg) => setToast({ msg, tone: 'error' })}
      />
      <Toast visible={!!toast} message={toast?.msg ?? ''} tone={toast?.tone ?? 'success'} onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  field: { marginBottom: Spacing.lg },
});
