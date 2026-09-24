// Hộp thư — Figma Hộp thư 1.1/1.2 (0-8922 / 0-8966): header lavender "Hộp thư" + thùng rác,
// dòng: icon phong bì tím (chấm đỏ nếu chưa đọc, nền lavender nếu chưa đọc), tiêu đề bold 15,
// mô tả xám 13, thời gian 11 tím-xám, chevron. Empty: "Rất tiếc bạn chưa có thông báo nào!"
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Dialog, Icon, Icons, Toast } from '@/components/ui';
import { useInbox, inboxActions } from '@/services/inboxStore';
import type { InboxItem } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  const unread = !item.read;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && { opacity: 0.9 }]}>
      <View style={styles.iconWrap}>
        <Icon name={unread ? 'ion:mail' : 'ion:mail-open-outline'} size={24} color={Colors.primary} />
        {unread ? <View style={styles.dot} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size={15} color={Colors.text} numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
          {item.excerpt}
        </AppText>
        <AppText size={11} color={Colors.primaryLight} style={{ marginTop: 4 }}>
          {item.time}
        </AppText>
      </View>
      <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
    </Pressable>
  );
}

export default function InboxScreen() {
  useStatusBarStyle('dark');
  const items = useInbox();
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const open = (item: InboxItem) => {
    inboxActions.markRead(item.id);
    router.push(`/inbox/${item.id}`);
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
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Icons.inbox}
            title="Rất tiếc bạn chưa có thông báo nào!"
            actionLabel="Khôi phục thông báo mẫu"
            onAction={() => inboxActions.reset()}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <InboxRow item={item} onPress={() => open(item)} />}
          contentContainerStyle={styles.list}
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
              inboxActions.clearAll();
              setConfirmClear(false);
              setToast('Đã xoá tất cả thông báo');
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.xl },
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
  emptyWrap: { flex: 1, justifyContent: 'center' },
});
