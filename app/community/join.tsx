// Nhập mã người giới thiệu — Figma Hệ thống OTP 0.2..0.6: "Nhập mã giới thiệu" bold, ô mã (mã tài khoản KH… của
// người giới thiệu), link "Tôi không có mã giới thiệu ?", nút "Tiếp tục" → xem trước người giới thiệu
// (GET /affiliate/referrer-preview: tên, cấp, số F1, đã đủ chưa) → "Đồng ý" → POST /affiliate/referrer.
// Chỉ nhập được khi canSetReferrer (chưa có người giới thiệu, còn trong thời hạn chính sách).
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, Dialog, Avatar, Toast, TextField } from '@/components/ui';
import { isMember, loadAffiliate, previewReferrer, setReferrer, useAffiliate, type ReferrerPreview } from '@/services/affiliate';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityJoinScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ReferrerPreview | null>(null);
  const [noCode, setNoCode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!aff) void loadAffiliate().catch(() => undefined);
  }, [aff]);

  const allowed = isMember(aff) && aff.canSetReferrer && !aff.referrer;
  const normalized = code.trim().toUpperCase();
  const ownCode = isMember(aff) && normalized === aff.code;

  const submit = async () => {
    if (normalized.length < 3 || checking) return;
    if (ownCode) {
      setError('Không thể nhập mã của chính bạn');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const p = await previewReferrer(normalized);
      if (p.full) setError(`${p.fullName} đã đủ thành viên cấp 1 — vui lòng dùng mã khác`);
      else setPreview(p);
    } catch (e) {
      setError(errorMessage(e, 'Mã giới thiệu không hợp lệ'));
    } finally {
      setChecking(false);
    }
  };

  const confirmJoin = async () => {
    if (!preview || saving) return;
    setSaving(true);
    try {
      await setReferrer(preview.code);
      setPreview(null);
      router.replace('/community');
    } catch (e) {
      setPreview(null);
      setToast(errorMessage(e, 'Không nhập được mã giới thiệu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Nhập mã giới thiệu" variant="light" left="back" />}
      footer={<Button title="Tiếp tục" flat onPress={() => void submit()} disabled={!allowed || normalized.length < 3} loading={checking} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          Nhập mã giới thiệu
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          Nhập mã tài khoản của người giới thiệu (vd KH000123) để kết nối vào cộng đồng của họ
        </AppText>

        <TextField
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\s/g, '').toUpperCase());
            if (error) setError(null);
          }}
          placeholder="KH000123"
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          bold
          error={error ?? undefined}
          editable={allowed}
          containerStyle={styles.codes}
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        {aff && !allowed ? (
          <AppText size={13} color={Colors.error} align="center" style={{ marginTop: Spacing.md }}>
            {isMember(aff) && aff.referrer ? `Bạn đã có người giới thiệu: ${aff.referrer.fullName}` : 'Đã hết thời hạn nhập mã người giới thiệu'}
          </AppText>
        ) : null}

        <Pressable onPress={() => setNoCode(true)} hitSlop={8} style={styles.link}>
          <AppText size={14} color={Colors.textSecondary} align="center">
            Tôi không có mã giới thiệu ?
          </AppText>
        </Pressable>
      </View>

      {/* Xem trước người giới thiệu (OTP 0.5) */}
      <Dialog
        visible={!!preview}
        onClose={() => setPreview(null)}
        dismissable={!saving}
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setPreview(null) },
          { label: saving ? 'Đang lưu…' : 'Đồng ý', onPress: () => void confirmJoin() },
        ]}
      >
        {preview ? (
          <View style={styles.successCard}>
            <Avatar name={preview.fullName} size={72} />
            <AppText weight="bold" size={20} color={Colors.text} align="center" style={{ marginTop: Spacing.md }}>
              {preview.fullName}
            </AppText>
            <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
              MS: {preview.code} · Thành viên {preview.level.name}
            </AppText>
            <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
              Thành viên cấp 1:{' '}
              <AppText size={14} weight="bold" color={Colors.text}>
                {preview.f1Count}
              </AppText>
            </AppText>
            <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.md, lineHeight: 19 }}>
              Bạn sẽ trở thành thành viên trong cộng đồng của {preview.fullName}. Không đổi được người giới thiệu sau khi xác nhận.
            </AppText>
          </View>
        ) : null}
      </Dialog>

      <Dialog
        visible={noCode}
        onClose={() => setNoCode(false)}
        title="Không có mã giới thiệu?"
        message="Hãy nhờ người dùng ZuumViet gửi mã tài khoản (mã giới thiệu) của họ. Không có mã, bạn vẫn sử dụng đầy đủ dịch vụ ZuumViet."
        actions={[{ label: 'Đã hiểu', onPress: () => setNoCode(false) }]}
      />

      <Toast visible={!!toast} message={toast ?? ''} tone="error" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  link: { marginTop: Spacing.xl, alignSelf: 'center', paddingVertical: Spacing.xs },
  successCard: { alignItems: 'center', paddingVertical: Spacing.sm },
});
