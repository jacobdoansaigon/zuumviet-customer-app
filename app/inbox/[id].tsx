// Chi tiết thông báo — Figma Hộp thư 1.3 (0-9058): header lavender tiêu đề + thùng rác, banner hero vàng-kem,
// ngày xám, nội dung, nút đáy theo loại (xem đơn / xem vé / ví / cộng đồng). Mở là đánh dấu đã đọc.
// Mở từ push khi danh sách chưa tải → tải trang đầu rồi tìm.
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, EmptyState, Dialog, Icon, Icons, Toast, type IconName } from '@/components/ui';
import { inboxTarget, loadInbox, markRead, removeNotification, useInbox, type InboxType } from '@/services/inbox';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { formatDateTimeTitle } from '@/components/activity/orderUtils';

const HERO: Record<InboxType, { icon: IconName; title: string }> = {
  order: { icon: Icons.scooter, title: 'Cập nhật đơn hàng' },
  wallet: { icon: Icons.wallet, title: 'Ví ZuumViet' },
  campaign: { icon: Icons.ticket, title: 'Ưu đãi dành riêng cho bạn' },
  system: { icon: 'ion:megaphone-outline', title: 'Thông báo hệ thống' },
  offer: { icon: 'ion:megaphone-outline', title: 'Thông báo' },
  partner_review: { icon: 'ion:megaphone-outline', title: 'Thông báo' },
};

export default function InboxDetailScreen() {
  useStatusBarStyle('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const inbox = useInbox();
  const item = inbox.items?.find((m) => m.id === id) ?? null;
  const [loading, setLoading] = useState(inbox.items === null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (inbox.items !== null) return;
    loadInbox()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [inbox.items]);

  useEffect(() => {
    if (item && !item.readAt) void markRead(item.id).catch(() => undefined);
  }, [item]);

  if (!item) {
    return (
      <Screen header={<AppHeader title="Hộp thư" variant="light" left="back" />}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <EmptyState icon={Icons.inbox} title="Thông báo không còn tồn tại" actionLabel="Quay lại" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  const hero = HERO[item.type];
  const target = inboxTarget(item);

  const footer = target.orderId ? (
    <Button title="Xem đơn hàng" flat onPress={() => router.push({ pathname: '/booking/tracking', params: { orderId: target.orderId! } })} />
  ) : target.bookingId ? (
    <Button title="Xem vé xe" flat onPress={() => router.push({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: target.bookingId! } })} />
  ) : item.type === 'wallet' || target.screen === 'wallet' ? (
    <Button title="Xem ví" flat onPress={() => router.push('/wallet')} />
  ) : target.screen === 'community' ? (
    <Button title="Xem cộng đồng" flat onPress={() => router.push('/community')} />
  ) : undefined;

  const doDelete = async () => {
    setConfirmDelete(false);
    try {
      await removeNotification(item.id);
      router.back();
    } catch (e) {
      setToast(errorMessage(e, 'Không xoá được thông báo'));
    }
  };

  return (
    <Screen
      header={<AppHeader title={item.title} variant="light" left="back" right={{ icon: Icons.trash, onPress: () => setConfirmDelete(true), label: 'Xoá thông báo' }} />}
      footer={footer}
      footerPadded={false}
      scroll
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name={hero.icon} size={34} color={Colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText size={12} weight="semiBold" color="#A5700A">
            {hero.title}
          </AppText>
          <AppText weight="bold" size={16} color={Colors.text} numberOfLines={2} style={{ marginTop: 2 }}>
            {item.title}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <AppText size={13} color={Colors.textSecondary}>
          {formatDateTimeTitle(Date.parse(item.createdAt))}
        </AppText>
        <AppText weight="bold" size={18} color={Colors.text} style={styles.title}>
          {item.title}
        </AppText>
        {item.body
          .split(/\n+/)
          .filter(Boolean)
          .map((p, i) => (
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
          { label: 'Xoá', variant: 'danger', onPress: () => void doDelete() },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="error" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
