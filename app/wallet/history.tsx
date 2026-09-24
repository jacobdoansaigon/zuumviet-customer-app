// Lịch sử giao dịch — Figma "Lịch sử GD"
import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, EmptyState, Icons, Screen } from '@/components/ui';
import { subscribeWallet, walletApi, type WalletTransaction } from '@/services/wallet';
import { TransactionRow } from '@/components/wallet/TransactionRow';

export default function WalletHistoryScreen() {
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      setItems(await walletApi.getTransactions());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => subscribeWallet(() => { load(); }), [load]);

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
          renderItem={({ item }) => (
            <TransactionRow tx={item} onPress={() => router.push(`/wallet/transaction/${item.id}`)} />
          )}
          contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={<EmptyState title="Rất tiếc bạn chưa có giao dịch nào!" icon={Icons.wallet} />}
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
});
