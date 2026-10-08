// Hoạt động của tôi — tab "Hoạt Động" (Figma Hoạt động 1.1 rỗng / 1.2 danh sách)
// Dữ liệu: GET /v1/customer/orders?scope=active (đang chạy, kể cả hẹn giờ) + scope=history (phân trang, cuộn để tải thêm).
// Đơn đang chạy / không tìm thấy tài xế → màn theo dõi (tìm lại được); còn lại → chi tiết chuyến.
import React, { useMemo, useState } from 'react';
import { View, FlatList, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Banner, Chip, EmptyState, Icons, Screen } from '@/components/ui';
import type { OrderListItem } from '@/services/orders';
import { ActiveTripCard, HistoryTripCard } from '@/components/activity/ActivityCard';
import { useActivityOrders } from '@/components/activity/useActivityOrders';
import { ACTIVITY_FILTERS, filterOrders, type ActivityFilter } from '@/components/activity/orderUtils';

type Row =
  | { kind: 'section'; key: string; title: string }
  | { kind: 'active'; key: string; order: OrderListItem }
  | { kind: 'history'; key: string; order: OrderListItem };

const when = (o: OrderListItem) => Date.parse(o.scheduledAt ?? o.createdAt);

export default function OrdersScreen() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const { active, history, hasMore, loading, refreshing, loadingMore, error, refresh, loadMore } = useActivityOrders();

  const rows = useMemo<Row[]>(() => {
    const a = filterOrders(active, filter).sort((x, y) => when(x) - when(y));
    const h = filterOrders(history, filter);
    const out: Row[] = [];
    if (a.length) {
      out.push({ kind: 'section', key: 's-active', title: 'Đang trên đường | Đặt lịch trình' });
      a.forEach((o) => out.push({ kind: 'active', key: `a-${o.id}`, order: o }));
    }
    if (h.length) {
      out.push({ kind: 'section', key: 's-history', title: 'Lịch sử chuyến đi' });
      h.forEach((o) => out.push({ kind: 'history', key: `h-${o.id}`, order: o }));
    }
    return out;
  }, [active, history, filter]);

  const initialLoading = loading && active.length === 0 && history.length === 0;

  return (
    <Screen header={<AppHeader title="Hoạt động của tôi" variant="light" left="none" />} edges={['left', 'right']} keyboardAvoiding={false}>
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ACTIVITY_FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      </View>

      {error ? <Banner tone="error" message={error} style={styles.banner} /> : null}

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={[styles.list, rows.length === 0 && styles.listEmpty]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={<EmptyState title="Rất tiếc bạn chưa có chuyến đi nào!" icon={Icons.scooter} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
            ) : hasMore && rows.length ? (
              <AppText size={12} color={Colors.textMuted} align="center" style={{ marginTop: Spacing.md }} onPress={() => void loadMore()}>
                Xem thêm
              </AppText>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === 'section') {
              return (
                <AppText size={14} weight="semiBold" color={Colors.text} style={styles.section}>
                  {item.title}
                </AppText>
              );
            }
            if (item.kind === 'active') {
              return <ActiveTripCard order={item.order} onPress={() => router.push({ pathname: '/booking/tracking', params: { orderId: item.order.id } })} />;
            }
            return (
              <HistoryTripCard
                order={item.order}
                onPress={() =>
                  item.order.status === 'no_driver_found'
                    ? router.push({ pathname: '/booking/tracking', params: { orderId: item.order.id } })
                    : router.push({ pathname: '/orders/[id]', params: { id: item.order.id } })
                }
              />
            );
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  section: { marginTop: Spacing.xs },
});
