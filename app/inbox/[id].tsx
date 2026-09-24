// Chi tiết thông báo — Figma Hộp thư 1.3 (0-9058): header lavender tiêu đề + thùng rác,
// banner hero vàng-kem, ngày xám, nội dung, nút đáy "Áp dụng" (thông báo ưu đãi).
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, EmptyState, Dialog, Icon, Icons, Toast } from '@/components/ui';
import { useInbox, inboxActions } from '@/services/inboxStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function InboxDetailScreen() {
  useStatusBarStyle('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useInbox();
  const item = items.find((m) => m.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  if (!item) {
    return (
      <Screen header={<AppHeader title="Hộp thư" variant="light" left="back" />}>
        <EmptyState icon={Icons.inbox} title="Thông báo không còn tồn tại" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const heroIcon = item.type === 'promo' ? Icons.ticket : item.type === 'order' ? Icons.scooter : 'ion:megaphone-outline';
  const heroTitle = item.type === 'promo' ? 'Ưu đãi dành riêng cho bạn' : item.type === 'order' ? 'Cập nhật chuyến đi' : 'Thông báo hệ thống';

  const footer =
    item.type === 'promo' ? (
      <Button
        title="Áp dụng"
        flat
        onPress={() => setToast(`Đã lưu mã ${item.promoCode ?? ''} cho đơn hàng tiếp theo`.trim())}
      />
    ) : item.type === 'order' ? (
      <Button title="Xem hoạt động" flat onPress={() => router.push('/orders')} />
    ) : undefined;

  return (
    <Screen
      header={
        <AppHeader
          title={item.title}
          variant="light"
          left="back"
          right={{ icon: Icons.trash, onPress: () => setConfirmDelete(true), label: 'Xoá thông báo' }}
        />
      }
      footer={footer}
      footerPadded={false}
      scroll
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name={heroIcon} size={34} color={Colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText size={12} weight="semiBold" color="#A5700A">
            {heroTitle}
          </AppText>
          {item.promoCode ? (
            <AppText weight="bold" size={22} color={Colors.text} style={{ marginTop: 2, letterSpacing: 1 }}>
              {item.promoCode}
            </AppText>
          ) : (
            <AppText weight="bold" size={16} color={Colors.text} numberOfLines={2} style={{ marginTop: 2 }}>
              {item.title}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <AppText size={13} color={Colors.textSecondary}>
          {item.date}
        </AppText>
        <AppText weight="bold" size={18} color={Colors.text} style={styles.title}>
          {item.title}
        </AppText>
        {item.body.map((p, i) => (
          <AppText key={i} size={15} color={Colors.gray800} style={styles.paragraph}>
            {p}
          </AppText>
        ))}
      </View>

      <Dialog
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xoá thông báo này?"
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setConfirmDelete(false) },
          {
            label: 'Xoá',
            variant: 'danger',
            onPress: () => {
              setConfirmDelete(false);
              inboxActions.remove(item.id);
              router.back();
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.xl,
    minHeight: 120,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'] },
  title: { marginTop: Spacing.sm, lineHeight: 24 },
  paragraph: { marginTop: Spacing.base, lineHeight: 22 },
});
