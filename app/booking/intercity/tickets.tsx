// app/booking/intercity/tickets.tsx — "Vé xe của tôi": vé xe / xe ghép đã đặt (GET /v1/customer/intercity/bookings,
// 20/trang, không gồm vé hết hạn giữ chỗ). Bấm 1 vé → vé điện tử (huỷ được khi còn ≥ 24 giờ trước giờ chạy).
import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppHeader, AppText, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { BOOKING_STATUS_LABEL, listBookings, TRIP_KIND_LABEL, vnDateLabel, vnTime, type IntercityBooking } from '@/services/intercity';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';

const PAGE_SIZE = 20;

export default function MyTicketsScreen() {
  const [items, setItems] = useState<IntercityBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await listBookings(1, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setPage(1);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được vé của bạn'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await listBookings(page + 1, PAGE_SIZE);
      setItems((prev) => [...prev, ...res.items.filter((b) => !prev.some((p) => p.id === b.id))]);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(errorMessage(e, 'Không tải thêm được vé'));
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen header={<AppHeader title="Vé xe của tôi" variant="dark" left="back" />} keyboardAvoiding={false}>
      {loading && !items.length ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={[styles.list, !items.length && styles.listEmpty]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor={Colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListHeaderComponent={
            error ? (
              <AppText size={13} color={Colors.error} style={{ marginBottom: Spacing.sm }}>
                {error}
              </AppText>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="mci:bus" title="Bạn chưa đặt vé xe nào" />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} /> : null}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const bad = item.status === 'cancelled' || item.status === 'expired';
            return (
              <Pressable onPress={() => router.push({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: item.id } })} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
                <View style={styles.iconBox}>
                  <Icon name={item.trip.kind === 'bus' ? 'mci:bus' : 'mci:car-multiple'} size={26} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText size={11} weight="semiBold" color={bad ? Colors.error : item.status === 'confirmed' ? Colors.successDark : Colors.primary}>
                    {TRIP_KIND_LABEL[item.trip.kind]} · {BOOKING_STATUS_LABEL[item.status]}
                  </AppText>
                  <AppText size={15} weight="bold" numberOfLines={1}>
                    {item.trip.from.name} → {item.trip.to.name}
                  </AppText>
                  <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                    {vnDateLabel(item.trip.departAt)} · {vnTime(item.trip.departAt)} · ghế {item.seatIds.join(', ')}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText size={14} weight="bold" color={Colors.primary}>
                    {formatVnd(item.price?.total ?? item.unitPrice * item.seatIds.length)}
                  </AppText>
                  <AppText size={11} color={Colors.textSecondary}>
                    {item.code}
                  </AppText>
                </View>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  iconBox: { width: 36, alignItems: 'center', marginRight: Spacing.md },
});
