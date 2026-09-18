// Orders — fetch from /site/deliveryorders
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import {
  orderApi,
  ORDER_STATUS,
  ApiError,
  type DeliveryOrder,
} from '@/services/api';

type TabValue = 'all' | 'active' | 'completed' | 'cancelled';

const TAB_OPTIONS: { label: string; value: TabValue }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang giao', value: 'active' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã huỷ', value: 'cancelled' },
];

const STATUS_LABEL: Record<number, string> = {
  [ORDER_STATUS.NEW]: 'Mới',
  [ORDER_STATUS.ASSIGNING]: 'Đang tìm tài xế',
  [ORDER_STATUS.ACCEPTED]: 'Tài xế đã nhận',
  [ORDER_STATUS.BOARDED]: 'Đã đến lấy',
  [ORDER_STATUS.PICKED]: 'Đã lấy hàng',
  [ORDER_STATUS.STARTED]: 'Bắt đầu',
  [ORDER_STATUS.DELIVERING]: 'Đang giao',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.FAIL]: 'Thất bại',
  [ORDER_STATUS.CUSTOMER_CANCELLED]: 'Bạn đã huỷ',
  [ORDER_STATUS.DRIVER_CANCELLED]: 'Tài xế huỷ',
};

function statusColor(status: number) {
  if (status === ORDER_STATUS.COMPLETED) return Colors.success;
  if (
    status === ORDER_STATUS.CUSTOMER_CANCELLED ||
    status === ORDER_STATUS.DRIVER_CANCELLED ||
    status === ORDER_STATUS.FAIL
  ) {
    return Colors.error;
  }
  if (status >= ORDER_STATUS.ACCEPTED && status <= ORDER_STATUS.DELIVERING) {
    return Colors.primary;
  }
  return Colors.warning;
}

function matchesTab(order: DeliveryOrder, tab: TabValue) {
  const s = Number(order.status);
  if (tab === 'all') return true;
  if (tab === 'completed') return s === ORDER_STATUS.COMPLETED;
  if (tab === 'cancelled') {
    return (
      s === ORDER_STATUS.CUSTOMER_CANCELLED ||
      s === ORDER_STATUS.DRIVER_CANCELLED ||
      s === ORDER_STATUS.FAIL
    );
  }
  // active
  return s >= ORDER_STATUS.ACCEPTED && s <= ORDER_STATUS.DELIVERING;
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getOrders();
      setOrders(res.items ?? []);
    } catch (e) {
      Alert.alert(
        'Không tải được đơn',
        e instanceof ApiError ? e.message : 'Kiểm tra API / đăng nhập'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = orders.filter((o) => matchesTab(o, activeTab));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
      </View>

      <View style={styles.tabsContainer}>
        {TAB_OPTIONS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.value && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>
              {loading ? 'Đang tải...' : 'Không có đơn hàng'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: DeliveryOrder }) {
  const status = Number(order.status);
  const pickup =
    (order.pickup_address as string) ||
    (order.from_address as string) ||
    'Điểm lấy hàng';
  const delivery =
    (order.delivery_address as string) ||
    (order.to_address as string) ||
    'Điểm giao hàng';
  const fee =
    order.total_fee != null
      ? `${Number(order.total_fee).toLocaleString('vi-VN')}đ`
      : order.shipping_fee != null
        ? `${Number(order.shipping_fee).toLocaleString('vi-VN')}đ`
        : '—';

  const canCancel =
    status > 0 &&
    status < ORDER_STATUS.COMPLETED &&
    status !== ORDER_STATUS.CUSTOMER_CANCELLED &&
    status !== ORDER_STATUS.DRIVER_CANCELLED;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/map?orderId=${order.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor(status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor(status) }]}>
            {STATUS_LABEL[status] ?? `Status ${status}`}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {pickup}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeAddress} numberOfLines={1}>
            {delivery}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.fee}>{fee}</Text>
        {canCancel ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              Alert.alert('Huỷ đơn', `Huỷ đơn #${order.id}?`, [
                { text: 'Không', style: 'cancel' },
                {
                  text: 'Huỷ đơn',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await orderApi.cancelOrder(order.id);
                      Alert.alert('Đã huỷ', 'Đơn đã được huỷ.');
                    } catch (err) {
                      Alert.alert(
                        'Lỗi',
                        err instanceof ApiError ? err.message : 'Không huỷ được'
                      );
                    }
                  },
                },
              ]);
            }}
          >
            <Text style={styles.cancelLink}>Huỷ đơn</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryBg },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  list: { padding: Spacing['2xl'], gap: Spacing.md, flexGrow: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 64 },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  route: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 4,
  },
  routeAddress: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fee: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  cancelLink: {
    color: Colors.error,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.sm,
  },
});
