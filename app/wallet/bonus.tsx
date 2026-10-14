// Lịch sử Ví thưởng — GET /v1/customer/wallet/bonus (số dư + bút toán, 20/trang, cuộn cuối để tải thêm):
// "Thưởng cộng đồng tuần …" (+), "Chuyển sang ví chính" (−). Đầu danh sách: số dư Ví thưởng + câu trung tính về thưởng
// cộng đồng (không nêu tỷ lệ) + nút "Chuyển sang ví chính" (components/wallet/BonusTransfer.tsx). Tự tải lại khi ví đổi.
import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Button, EmptyState, Icons, Screen } from '@/components/ui';
import { loadBonusWallet, refreshWallet, useWallet, type WalletEntry } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { useRealtime } from '@/hooks/useRealtime';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { useBonusTransfer } from '@/components/wallet/BonusTransfer';
import { COMMUNITY_REWARD_NOTE } from '@/services/affiliate';
import { formatVnd } from '@/components/wallet/walletUtils';

const PAGE_SIZE = 20;

export default function BonusWalletScreen() {
  const wallet = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [items, setItems] = useState<WalletEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      // store ví cũng phải có (nút chuyển đọc số dư Ví thưởng từ đó) — mở thẳng màn này từ thông báo / link
      const [res] = await Promise.all([loadBonusWallet(1, PAGE_SIZE), refreshWallet()]);
      setBalance(res.balance);
      setItems(res.entries.items);
      setTotal(res.entries.total);
      setPage(1);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được Ví thưởng'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await loadBonusWallet(page + 1, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.entries.items.filter((e) => !prev.some((p) => p.id === e.id))]);
      setTotal(res.entries.total);
      setPage(res.entries.page);
    } catch (e) {
      setError(errorMessage(e, 'Không tải thêm được giao dịch'));
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useRealtime('wallet.updated', () => void load());

  const transfer = useBonusTransfer(() => void load());
  // số dư mới nhất: store ví (cập nhật ngay sau khi chuyển) rồi mới đến lần tải danh sách
  const bonus = wallet?.bonus ?? balance ?? 0;

  const header = (
    <View>
      <View style={styles.summary}>
        <AppText size={14} color={Colors.textSecondary}>
          Số dư Ví thưởng
        </AppText>
        <AppText weight="bold" size={30} color={Colors.primary} style={styles.amount}>
          đ{formatVnd(bonus)}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} style={{ lineHeight: 19 }}>
          {COMMUNITY_REWARD_NOTE}
        </AppText>
        <Button title="Chuyển sang ví chính" iconLeft={Icons.swap} onPress={transfer.start} disabled={bonus <= 0} loading={transfer.sending} size="md" style={{ marginTop: Spacing.md }} />
      </View>
      {error ? (
        <AppText size={13} color={Colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}
      {items.length ? (
        <AppText weight="bold" size={15} style={styles.sectionTitle}>
          Lịch sử Ví thưởng
        </AppText>
      ) : null}
    </View>
  );

  return (
    <Screen header={<AppHeader variant="dark" title="Ví thưởng" />} keyboardAvoiding={false}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransactionRow entry={item} onPress={() => router.push({ pathname: '/wallet/transaction/[id]', params: { id: item.id } })} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="Ví thưởng chưa có giao dịch nào" icon={Icons.wallet} compact />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} /> : null}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
      {transfer.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: Spacing.xl },
  summary: {
    margin: Spacing.screen,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.primaryBg,
  },
  amount: { lineHeight: 38, marginTop: 2, marginBottom: Spacing.xs },
  sectionTitle: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xs },
  error: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
});
