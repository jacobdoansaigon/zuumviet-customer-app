// Mời thành viên tham gia — Figma Hệ thống 1.4: "Yêu cầu Thành viên nhập mã giới thiệu để kết nối với bạn",
// mã lớn "345678" bold 28, "hoặc quét mã QR Code", ảnh QR, nút "Chia sẻ".
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Share, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, Toast, Icons } from '@/components/ui';
import { FakeQrCode } from '@/components/community';
import { MOCK_COMMUNITY } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityInviteScreen() {
  useStatusBarStyle('dark');
  const code = MOCK_COMMUNITY.myInviteCode;
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const message = `Tham gia cộng đồng ZuumViet cùng tôi! Nhập mã giới thiệu ${code} trong ứng dụng ZuumViet (Cộng đồng → Tham gia cộng đồng).`;

  const handleShare = async () => {
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
      footer={<Button title="Chia sẻ" flat onPress={handleShare} iconLeft={Icons.share} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <AppText size={15} color={Colors.textSecondary} align="center" style={{ lineHeight: 22 }}>
          Yêu cầu Thành viên nhập mã giới thiệu để kết nối với bạn
        </AppText>

        <View style={styles.codeBox}>
          <AppText weight="bold" size={28} color={Colors.primary} align="center" style={{ letterSpacing: 6 }}>
            {code}
          </AppText>
        </View>

        <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xl }}>
          hoặc quét mã QR Code
        </AppText>

        <View style={styles.qr}>
          <FakeQrCode value={`zuumviet://community/join?code=${code}`} size={200} />
        </View>

        <AppText size={12} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg }}>
          Người được mời mở ZuumViet → Cộng đồng → Tham gia cộng đồng và nhập mã
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
  },
  qr: { marginTop: Spacing.base },
});
