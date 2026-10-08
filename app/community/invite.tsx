// Mời thành viên tham gia — Figma Hệ thống 1.4: "Yêu cầu Thành viên nhập mã giới thiệu để kết nối với bạn",
// mã lớn (mã tài khoản KH… của tôi, GET /v1/customer/affiliate) bold 28, nút "Chia sẻ".
// Mã QR: chưa có thư viện QR thật trong app → không hiện ảnh QR giả.
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Share, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, Toast, Icons } from '@/components/ui';
import { isMember, loadAffiliate, useAffiliate } from '@/services/affiliate';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityInviteScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const code = isMember(aff) ? aff.code : null;
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!aff) void loadAffiliate().catch(() => undefined);
  }, [aff]);

  const message = code
    ? `Tham gia cộng đồng ZuumViet cùng tôi! Khi đăng ký ứng dụng ZuumViet, nhập mã giới thiệu ${code} (hoặc vào Cộng đồng → Nhập mã người giới thiệu).`
    : '';

  const handleShare = async () => {
    if (!code) return;
    try {
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: { text: string }) => Promise<void> }) : undefined;
        if (nav?.share) {
          await nav.share({ text: message });
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          setToast('Đã sao chép mã giới thiệu');
          return;
        }
        setToast(`Mã giới thiệu của bạn: ${code}`);
        return;
      }
      await Share.share({ message });
    } catch {
      setToast('Không thể chia sẻ lúc này');
    }
  };

  return (
    <Screen
      header={<AppHeader title="Mời thành viên tham gia" variant="light" left="back" />}
      footer={<Button title="Chia sẻ" flat onPress={() => void handleShare()} iconLeft={Icons.share} disabled={!code} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <AppText size={15} color={Colors.textSecondary} align="center" style={{ lineHeight: 22 }}>
          Yêu cầu Thành viên nhập mã giới thiệu để kết nối với bạn
        </AppText>

        <View style={styles.codeBox}>
          {code ? (
            <AppText weight="bold" size={28} color={Colors.primary} align="center" style={{ letterSpacing: 4 }}>
              {code}
            </AppText>
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </View>

        {isMember(aff) ? (
          <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.lg }}>
            Thành viên cấp 1 hiện có: {aff.counts.f1}/{aff.policy.maxF1}
          </AppText>
        ) : null}

        <AppText size={12} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg }}>
          Người được mời nhập mã khi đăng ký tài khoản ZuumViet, hoặc trong Cộng đồng → Nhập mã người giới thiệu
        </AppText>
      </View>
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'], paddingBottom: Spacing['2xl'], alignItems: 'center' },
  codeBox: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    minWidth: 180,
  },
});
