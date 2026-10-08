// Chỉnh sửa hồ sơ — Figma CHỈNH SỬA HỒ SƠ: header tím; avatar 64 + huy hiệu camera; "Họ và tên (*)",
// "Email", "Số điện thoại (bạn không thể cập nhật)" disabled; nút đáy "Cập nhật" (xám → tím).
// Action sheet ảnh: "Chụp ảnh" / "Chọn ảnh từ thư viện" / "Huỷ bỏ" → tải ảnh (purpose avatar) → PATCH /me {avatarFileId}.
// Họ tên / email: PATCH /v1/customer/me {fullName, email (null = xoá)}.
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, TextField, Avatar, Toast } from '@/components/ui';
import { PhotoActionSheet } from '@/components/profile';
import { displayName, formatPhone, refreshProfile, updateProfile, useProfile } from '@/services/session';
import { uploadFile } from '@/services/upload';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EditProfileScreen() {
  useStatusBarStyle('light');
  const profile = useProfile();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const [filled, setFilled] = useState(!!profile);

  useEffect(() => {
    void refreshProfile().catch(() => undefined);
  }, []);

  // hồ sơ tải xong sau khi mở màn → điền form 1 lần
  useEffect(() => {
    if (profile && !filled) {
      setFullName(profile.fullName);
      setEmail(profile.email ?? '');
      setFilled(true);
    }
  }, [profile, filled]);

  const name = fullName.trim();
  const emailTrim = email.trim();
  const emailOk = emailTrim.length === 0 || EMAIL_RE.test(emailTrim);
  const changed = !!profile && (name !== profile.fullName || emailTrim !== (profile.email ?? ''));
  const canSave = !!profile && name.length >= 2 && emailOk && changed && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ fullName: name, email: emailTrim || null });
      router.replace({ pathname: '/account', params: { toast: 'profile' } });
    } catch (e) {
      setToast({ msg: errorMessage(e), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async (uri: string, mimeType?: string | null) => {
    setUploading(true);
    try {
      const fileId = await uploadFile(uri, 'avatar', mimeType);
      await updateProfile({ avatarFileId: fileId });
      setToast({ msg: 'Đã cập nhật ảnh đại diện', tone: 'success' });
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Không cập nhật được ảnh đại diện'), tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Chỉnh sửa hồ sơ" variant="dark" left="back" />}
      footer={<Button title="Cập nhật" flat onPress={() => void handleSave()} disabled={!canSave} loading={saving} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <View>
            <Avatar uri={profile?.avatarUrl} name={name || displayName(profile, 'K')} size={64} editable onPress={() => !uploading && setPhotoOpen(true)} />
            {uploading ? (
              <View style={styles.avatarBusy}>
                <ActivityIndicator color={Colors.white} />
              </View>
            ) : null}
          </View>
          <AppText size={12} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
            {uploading ? 'Đang tải ảnh lên...' : 'Chạm để thay ảnh đại diện'}
          </AppText>
        </View>

        <TextField label="Họ và tên" required value={fullName} onChangeText={setFullName} placeholder="Họ và tên" autoCapitalize="words" containerStyle={styles.field} />
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
        <TextField label="Số điện thoại (bạn không thể cập nhật)" value={formatPhone(profile?.phone)} disabled clearable={false} containerStyle={styles.field} />
        {profile?.code ? (
          <TextField label="Mã tài khoản (mã giới thiệu)" value={profile.code} disabled clearable={false} containerStyle={styles.field} />
        ) : null}
      </View>

      <PhotoActionSheet
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onPicked={(uri, mimeType) => void changeAvatar(uri, mimeType)}
        onError={(msg) => setToast({ msg, tone: 'error' })}
      />
      <Toast visible={!!toast} message={toast?.msg ?? ''} tone={toast?.tone ?? 'success'} onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarBusy: { position: 'absolute', top: 0, left: 0, width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: Spacing.lg },
});
