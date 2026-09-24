// app/booking/tracking.tsx — 1.5: bản đồ + bottom sheet theo trạng thái đơn
// (đang tìm tài xế / lên lịch / không tìm thấy / tìm thấy / đang giao / hoàn thành / đã huỷ).
// orderId thật → poll orderApi.getOrderDetail mỗi 5s (BE lỗi 2 lần → chuyển mô phỏng); orderId mock / không có → mô phỏng tiến trình.
// QA: ?demo=notfound | ?demo=scheduled
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Linking, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, BottomSheet, Icons, ListRow, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { orderApi, ORDER_STATUS } from '@/services/api';
import { SERVICE_GROUPS } from '@/constants/mockBooking';
import {
  useBooking,
  getStoredOrder,
  createDemoOrder,
  advanceMockOrder,
  isMockOrderId,
  isTerminalStatus,
  normalizeApiOrder,
  rememberOrder,
  updateStoredOrder,
  getTrackingPhase,
} from '@/services/bookingStore';
import { BookingMap, RoundIconButton, TrackingSheet, type MapStop } from '@/components/booking';

const MOCK_STEP_MS = 6000;
const POLL_MS = 5000;
const DEMO_ID = 'mock-demo';
const SUPPORT_PHONE = '19001234';

export default function TrackingScreen() {
  const { orderId: orderIdParam, demo, from } = useLocalSearchParams<{ orderId?: string; demo?: string; from?: string }>();
  const orderId = orderIdParam && orderIdParam.length > 0 ? orderIdParam : DEMO_ID;
  const state = useBooking();
  const order = state.orders[orderId] ?? null;
  const [usingMock, setUsingMock] = useState(isMockOrderId(orderId));
  const [retried, setRetried] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Đơn mock / demo: tạo nếu chưa có; demo=notfound → sau 4s báo không tìm thấy
  useEffect(() => {
    if (!isMockOrderId(orderId)) return;
    if (!getStoredOrder(orderId)) createDemoOrder(orderId, demo);
    if (demo === 'notfound' && !retried) {
      const t = setTimeout(() => updateStoredOrder(orderId, { status: ORDER_STATUS.FAIL }), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [orderId, demo, retried]);

  // Mô phỏng tiến trình đơn (đơn hẹn giờ giữ trạng thái "lên lịch" lâu hơn)
  useEffect(() => {
    if (!usingMock) return;
    if (demo === 'notfound' && !retried) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      const cur = getStoredOrder(orderId);
      if (!cur || isTerminalStatus(cur.status)) return;
      t = setTimeout(
        () => {
          advanceMockOrder(orderId);
          schedule();
        },
        cur.status === 2 ? MOCK_STEP_MS * 3 : MOCK_STEP_MS,
      );
    };
    schedule();
    return () => {
      if (t) clearTimeout(t);
    };
  }, [usingMock, orderId, demo, retried, runKey]);

  // Đơn thật: poll BE
  useEffect(() => {
    if (usingMock) return;
    let cancelled = false;
    let failures = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      try {
        const data = await orderApi.getOrderDetail(orderId);
        if (cancelled) return;
        failures = 0;
        const next = rememberOrder(normalizeApiOrder(data, getStoredOrder(orderId)));
        if (isTerminalStatus(next.status) && timer) clearInterval(timer);
      } catch {
        failures += 1;
        if (failures >= 2 && !cancelled) {
          // BE không phản hồi → mô phỏng để UI vẫn demo được (đánh dấu isMock)
          if (!getStoredOrder(orderId)) createDemoOrder(orderId, demo);
          else updateStoredOrder(orderId, { isMock: true });
          setUsingMock(true);
        }
      }
    };
    void load();
    timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [usingMock, orderId, demo]);

  const stops = useMemo<MapStop[]>(() => {
    if (!order) return [];
    const group = SERVICE_GROUPS[order.service];
    const L = group.labels;
    const list: MapStop[] = [
      { id: 'pickup', lat: order.pickup.lat, lng: order.pickup.lng, type: 'pickup', label: L.mapPickupLabel },
      ...order.stops.map<MapStop>((s, i) => ({ id: `drop-${i}`, lat: s.lat, lng: s.lng, type: 'dropoff', label: group.maxStops > 1 ? `${L.mapDropLabel} ${i + 1}` : L.mapDropLabel })),
    ];
    const phase = getTrackingPhase(order);
    if (order.driver && (phase === 'accepted' || phase === 'delivering')) {
      const target = phase === 'accepted' ? order.pickup : (order.stops.find((s) => s.status !== 'completed') ?? order.pickup);
      const from = phase === 'accepted' ? { lat: order.pickup.lat + 0.006, lng: order.pickup.lng - 0.005 } : order.pickup;
      list.push({ id: 'driver', lat: (from.lat + target.lat) / 2, lng: (from.lng + target.lng) / 2, type: 'driver', label: order.driver.name });
    }
    return list;
  }, [order]);

  const goHome = () => {
    try {
      if (from === 'booking' && router.canDismiss()) router.dismissAll();
    } catch {
      /* ignore */
    }
    router.replace('/home');
  };
  const close = () => {
    if (from === 'booking' || !router.canGoBack()) goHome();
    else router.back();
  };
  const retry = () => {
    updateStoredOrder(orderId, { status: ORDER_STATUS.ASSIGNING, driver: null });
    setRetried(true);
    setUsingMock(true);
    setRunKey((k) => k + 1);
    setToast('Đang tìm lại tài xế gần bạn...');
  };
  const call = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => setToast('Không thể thực hiện cuộc gọi trên thiết bị này'));
  };

  const phase = order ? getTrackingPhase(order) : null;
  const cancellable = phase === 'searching' || phase === 'scheduled' || phase === 'accepted';

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} bottomPadding={sheetH} />
      <RoundIconButton icon={Icons.close} onPress={close} style={[styles.close, { top: insets.top + Spacing.md }]} accessibilityLabel="Đóng" />
      {order?.isMock ? (
        <View style={[styles.mockTag, { top: insets.top + Spacing.md + 8 }]}>
          <AppText size={11} weight="semiBold" color={Colors.textSecondary}>
            Đơn mô phỏng
          </AppText>
        </View>
      ) : null}

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <ScrollView style={{ maxHeight: height * 0.68 }} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.md }} showsVerticalScrollIndicator={false}>
          {order ? (
            <TrackingSheet
              order={order}
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
              onMore={() => setMenu(true)}
              onRetry={retry}
              onCall={() => call(order.driver?.phone)}
              onChat={() => setToast('Tính năng nhắn tin với tài xế sẽ sớm ra mắt')}
              onRate={() => router.push(`/orders/${orderId}/rate`)}
              onHome={goHome}
            />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.primary} />
              <AppText size={14} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
                Đang tải đơn hàng...
              </AppText>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomSheet visible={menu} onClose={() => setMenu(false)} contentStyle={{ paddingHorizontal: 0, paddingBottom: Spacing.sm }}>
        {cancellable ? (
          <ListRow
            icon={Icons.closeCircle}
            iconColor={Colors.error}
            label="Huỷ đơn hàng"
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/booking/cancel', params: { orderId } });
            }}
          />
        ) : null}
        <ListRow
          icon={Icons.headset}
          label="Liên hệ hỗ trợ"
          sublabel={`Tổng đài ${SUPPORT_PHONE}`}
          onPress={() => {
            setMenu(false);
            call(SUPPORT_PHONE);
          }}
        />
        <ListRow icon={Icons.share} label="Chia sẻ lộ trình" divider={false} onPress={() => { setMenu(false); setToast('Đã sao chép liên kết theo dõi đơn'); }} />
      </BottomSheet>

      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} style={{ bottom: sheetH + Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.mapBg },
  close: { position: 'absolute', left: Spacing.screen },
  mockTag: {
    position: 'absolute',
    right: Spacing.screen,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadow.lg,
  },
  loading: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
});
