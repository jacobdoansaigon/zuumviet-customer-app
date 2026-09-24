// Hoạt động của tôi — tab "Hoạt Động" (Figma Hoạt động 1.1 rỗng / 1.2 danh sách)
// Dữ liệu: orderApi.getOrders (BE thật) → fallback mock khi API lỗi/rỗng trong __DEV__ (components/activity/activityApi.ts)
import React, { useMemo, useState } from 'react';
import { View, FlatList, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Banner, Chip, EmptyState, Icons, Screen } from '@/components/ui';
import type { ActivityOrder } from '@/constants/mockOrders';
import { ActiveTripCard, HistoryTripCard } from '@/components/activity/ActivityCard';
import { useActivityOrders } from '@/components/activity/useActivityOrders';
import {
  ACTIVITY_FILTERS,
  filterOrders,
  isActiveStatus,
  type ActivityFilter,
} from '@/components/activity/orderUtils';

type Row =
  | { kind: 'section'; key: string; title: string }
  | { kind: 'active'; key: string; order: ActivityOrder }
  | { kind: 'history'; key: string; order: ActivityOrder };

export default function OrdersScreen() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const { orders, loading, refreshing, refresh, error, source } = useActivityOrders();

  const rows = useMemo<Row[]>(() => {
    const visible = filterOrders(orders, filter);
    const active = visible
      .filter((o) => isActiveStatus(o.status))
      .sort((a, b) => (a.scheduledAt ?? a.createdAt) - (b.scheduledAt ?? b.createdAt));
    const history = visible
      .filter((o) => !isActiveStatus(o.status))
      .sort((a, b) => b.createdAt - a.createdAt);

    const out: Row[] = [];
    if (active.length) {
      out.push({ kind: 'section', key: 's-active', title: 'Đang trên đường | Đặt lịch trình' });
      active.forEach((o) => out.push({ kind: 'active', key: `a-${o.id}`, order: o }));
    }
    if (history.length) {
      out.push({ kind: 'section', key: 's-history', title: 'Lịch sử chuyến đi' });
      history.forEach((o) => out.push({ kind: 'history', key: `h-${o.id}`, order: o }));
    }
    return out;
  }, [orders, filter]);

  const initialLoading = loading && orders.length === 0;

  return (
    <Screen
      header={<AppHeader title="Hoạt động của tôi" variant="light" left="none" />}
      edges={['left', 'right']}
      keyboardAvoiding={false}
    >
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ACTIVITY_FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      </View>

      {error && source === 'api' ? <Banner tone="error" message={error} style={styles.banner} /> : null}
      {source === 'mock' ? (
        <AppText size={11} color={Colors.textMuted} style={styles.devNote}>
          Dữ liệu mẫu — {error ? `API lỗi: ${error}` : 'API chưa có chuyến đi'}
        </AppText>
      ) : null}

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={[styles.list, rows.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={<EmptyState title="Rất tiếc bạn chưa có chuyến đi nào!" icon={Icons.scooter} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => {
            if (item.kind === 'section') {
              return (
                <AppText size={14} weight="semiBold" color={Colors.text} style={styles.section}>
                  {item.title}
                </AppText>
              );
            }
            if (item.kind === 'active') {
              return (
                <ActiveTripCard
                  order={item.order}
                  onPress={() => router.push(`/booking/tracking?orderId=${encodeURIComponent(item.order.id)}`)}
                />
              );
            }
            return <HistoryTripCard order={item.order} onPress={() => router.push(`/orders/${item.order.id}`)} />;
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsWrap: { backgroundColor: Colors.white },
  chips: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, gap: Spacing.sm },
  banner: { marginHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  devNote: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  section: { marginTop: Spacing.xs },
});
