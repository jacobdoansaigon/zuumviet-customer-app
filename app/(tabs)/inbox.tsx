// Hộp thư — Figma Hộp thư 1.1/1.2 (0-8922 / 0-8966): header lavender "Hộp thư" + đọc hết + thùng rác,
// dòng: icon phong bì tím (chấm đỏ nếu chưa đọc, nền lavender nếu chưa đọc), tiêu đề bold 15,
// nội dung xám 13, thời gian 11 tím-xám, chevron. Empty: "Rất tiếc bạn chưa có thông báo nào!"
// Dữ liệu: GET /v1/customer/notifications (20/trang), thông báo mới qua realtime notification.new.
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Dialog, Icon, Icons, Toast, type IconName } from '@/components/ui';
import { clearInbox, loadInbox, loadMoreInbox, markAllRead, markRead, useInbox, type InboxItem, type InboxType } from '@/services/inbox';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { formatDayLabel, formatTime24 } from '@/components/activity/orderUtils';

const TYPE_ICON: Record<InboxType, { read: IconName; unread: IconName }> = {
  order: { read: Icons.scooter, unread: Icons.scooter },
  wallet: { read: Icons.wallet, unread: Icons.walletFilled },
  campaign: { read: Icons.ticket, unread: Icons.ticket },
  system: { read: 'ion:mail-open-outline', unread: 'ion:mail' },
  offer: { read: 'ion:mail-open-outline', unread: 'ion:mail' },
  partner_review: { read: 'ion:mail-open-outline', unread: 'ion:mail' },
};

function inboxTime(iso: string): string {
  const ms = Date.parse(iso);
  return `${formatDayLabel(ms)}, ${formatTime24(ms)}`;
}

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  const unread = !item.readAt;
  const icon = TYPE_ICON[item.type];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && { opacity: 0.9 }]}>
      <View style={styles.iconWrap}>
        <Icon name={unread ? icon.unread : icon.read} size={24} color={Colors.primary} />
        {unread ? <View style={styles.dot} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size={15} color={Colors.text} numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
          {item.body}
        </AppText>
        <AppText size={11} color={Colors.primaryLight} style={{ marginTop: 4 }}>
          {inboxTime(item.createdAt)}
        </AppText>
      </View>
      <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
    </Pressable>
  );
}

export default function InboxScreen() {
  useStatusBarStyle('dark');
  const inbox = useInbox();
  const items = inbox.items ?? [];
  const [confirmClear, setConfirmClear] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    try {
      await loadInbox();
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được hộp thư'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const open = (item: InboxItem) => {
    void markRead(item.id).catch(() => undefined);
    router.push({ pathname: '/inbox/[id]', params: { id: item.id } });
  };

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      setToast({ msg: ok, tone: 'success' });
    } catch (e) {
      setToast({ msg: errorMessage(e), tone: 'error' });
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title="Hộp thư"
          variant="light"
          left="none"
          right={items.length ? { icon: Icons.trash, onPress: () => setConfirmClear(true), label: 'Xoá tất cả' } : undefined}
        />
      }
    >
      {inbox.unread > 0 ? (
        <Pressable onPress={() => void run(markAllRead, 'Đã đánh dấu đã đọc tất cả')} style={styles.readAll} hitSlop={6}>
          <Icon name={Icons.checkCircle} size={16} color={Colors.primary} />
          <AppText size={13} weight="semiBold" color={Colors.primary} style={{ marginLeft: 6 }}>
            Đánh dấu đã đọc tất cả ({inbox.unread})
          </AppText>
        </Pressable>
      ) : null}
      {inbox.items === null && !error ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon={Icons.inbox} title={error ?? 'Rất tiếc bạn chưa có thông báo nào!'} actionLabel={error ? 'Thử lại' : undefined} onAction={error ? () => void load() : undefined} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <InboxRow item={item} onPress={() => open(item)} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={Colors.primary}
            />
          }
          onEndReached={async () => {
            if (loadingMore || items.length >= inbox.total) return;
            setLoadingMore(true);
            await loadMoreInbox().catch(() => undefined);
            setLoadingMore(false);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Dialog
        visible={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Xoá tất cả thông báo?"
        message="Toàn bộ thông báo trong Hộp thư sẽ bị xoá và không thể khôi phục."
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setConfirmClear(false) },
          {
            label: 'Xoá',
            variant: 'danger',
            onPress: () => {
              setConfirmClear(false);
              void run(clearInbox, 'Đã xoá tất cả thông báo');
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast?.msg ?? ''} tone={toast?.tone ?? 'success'} onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.xl },
  readAll: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  rowUnread: { backgroundColor: Colors.primaryBg },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
