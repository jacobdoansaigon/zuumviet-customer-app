// Lịch sử giao dịch — Figma "Lịch sử GD": GET /v1/customer/wallet/entries (20/trang, cuộn cuối để tải thêm),
// tự tải lại khi ví đổi (realtime wallet.updated).
import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, EmptyState, Icons, Screen } from '@/components/ui';
import { listWalletEntries, type WalletEntry } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { useRealtime } from '@/hooks/useRealtime';
import { TransactionRow } from '@/components/wallet/TransactionRow';

const PAGE_SIZE = 20;

export default function WalletHistoryScreen() {
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
      const res = await listWalletEntries(1, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setPage(1);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được lịch sử giao dịch'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await listWalletEntries(page + 1, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.items.filter((e) => !prev.some((p) => p.id === e.id))]);
      setTotal(res.total);
      setPage(res.page);
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

  return (
    <Screen header={<AppHeader variant="dark" title="Lịch sử giao dịch" />} keyboardAvoiding={false}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransactionRow entry={item} onPress={() => router.push({ pathname: '/wallet/transaction/[id]', params: { id: item.id } })} />}
          contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListHeaderComponent={
            error ? (
              <AppText size={13} color={Colors.error} style={styles.error}>
                {error}
              </AppText>
            ) : null
          }
          ListEmptyComponent={<EmptyState title="Rất tiếc bạn chưa có giao dịch nào!" icon={Icons.wallet} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} /> : null}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: Spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  error: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
});
