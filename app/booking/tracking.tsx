// app/booking/tracking.tsx — 1.5: bản đồ + bottom sheet theo trạng thái đơn
// (đã hẹn giờ / đang tìm tài xế / không tìm thấy / tài xế đang đến / đang thực hiện / hoàn thành / đã huỷ).
// Nguồn: GET /v1/customer/orders/:id. Cập nhật realtime qua socket /customer: order.updated (tải lại đơn) +
// partner.location (di chuyển ghim tài xế ngay); mỗi lần kết nối lại / push về đơn này cũng tải lại; dự phòng poll 30s.
// ETA: ước lượng đường chim bay từ vị trí tài xế ở ~25 km/h (API chưa có ETA) — luôn ghi "khoảng".
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Linking, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, BottomSheet, Button, Icons, ListRow, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/booking';
import { estimateEtaMinutes, getOrder, groupOfOrder, isActiveStatus, retryOrder, type OrderDetail } from '@/services/orders';
import { ensureCatalog } from '@/services/catalog';
import { errorMessage, isApiError } from '@/services/zuum';
import { useRealtime, useRealtimeRefetch } from '@/hooks/useRealtime';
import { useOrderPushRefresh } from '@/hooks/useNotifications';
import { BookingMap, RoundIconButton, TrackingSheet, type MapStop } from '@/components/booking';

const FALLBACK_POLL_MS = 30_000;
const SUPPORT_PHONE = '19001234';

type LatLng = { lat: number; lng: number };

export default function TrackingScreen() {
  const { orderId: orderIdParam, from } = useLocalSearchParams<{ orderId?: string; from?: string }>();
  const orderId = typeof orderIdParam === 'string' && orderIdParam ? orderIdParam : null;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [partnerLoc, setPartnerLoc] = useState<LatLng | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const failures = useRef(0);
  const pushTick = useOrderPushRefresh(orderId);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getOrder(orderId);
      failures.current = 0;
      setOrder(data);
      setLoadError(null);
      setPartnerLoc(data.partnerLocation ? { lat: data.partnerLocation.lat, lng: data.partnerLocation.lng } : null);
    } catch (e) {
      failures.current += 1;
      if (isApiError(e, 'order.not_found')) setLoadError(errorMessage(e));
      else if (failures.current === 2) setToast(`Không cập nhật được đơn: ${errorMessage(e)}`);
    }
  }, [orderId]);

  useEffect(() => {
    void ensureCatalog().catch(() => undefined);
  }, []);

  useEffect(() => {
    void load();
  }, [load, pushTick]);

  // Realtime: đơn đổi trạng thái → tải lại; vị trí tài xế → cập nhật ghim; (re)connect → tải lại (có thể đã lỡ sự kiện)
  useRealtime('order.updated', (p) => {
    if (p.orderId === orderId) void load();
  });
  useRealtime('partner.location', (p) => {
    if (p.orderId === orderId) setPartnerLoc({ lat: p.lat, lng: p.lng });
  });
  useRealtimeRefetch(() => void load());

  // Dự phòng khi socket chập chờn: poll chậm lúc đơn còn chạy
  const active = order ? isActiveStatus(order.status) || order.status === 'no_driver_found' : true;
  useEffect(() => {
    if (!orderId || !active) return;
    const t = setInterval(() => void load(), FALLBACK_POLL_MS);
    return () => clearInterval(t);
  }, [orderId, active, load]);

  const showPartner = !!partnerLoc && (order?.status === 'assigned' || order?.status === 'arrived_pickup' || order?.status === 'picked_up');
  const eta = order && showPartner ? estimateEtaMinutes(order, partnerLoc) : null;

  const stops = useMemo<MapStop[]>(() => {
    if (!order) return [];
    const group = SERVICE_GROUPS[groupOfOrder(order.service)];
    const L = group.labels;
    const list: MapStop[] = [
      { id: 'pickup', lat: order.pickup.lat, lng: order.pickup.lng, type: 'pickup', label: L.mapPickupLabel },
      ...order.stops.map<MapStop>((s, i) => ({
        id: `drop-${s.id}`,
        lat: s.lat,
        lng: s.lng,
        type: 'dropoff',
        label: order.stops.length > 1 ? `${L.mapDropLabel} ${i + 1}` : L.mapDropLabel,
      })),
    ];
    if (showPartner && partnerLoc) list.push({ id: 'driver', lat: partnerLoc.lat, lng: partnerLoc.lng, type: 'driver', label: order.partner?.fullName });
    return list;
  }, [order, partnerLoc, showPartner]);

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
  const retry = async () => {
    if (!orderId || retrying) return;
    setRetrying(true);
    try {
      setOrder(await retryOrder(orderId));
      setToast('Đang tìm lại tài xế gần bạn...');
    } catch (e) {
      setToast(errorMessage(e, 'Không bắt đầu lại được việc tìm tài xế'));
    } finally {
      setRetrying(false);
    }
  };
  const call = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => setToast('Không thể thực hiện cuộc gọi trên thiết bị này'));
  };

  const cancellable = !!order?.allowedActions.includes('cancel');

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} bottomPadding={sheetH} />
      <RoundIconButton icon={Icons.close} onPress={close} style={[styles.close, { top: insets.top + Spacing.md }]} accessibilityLabel="Đóng" />

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <ScrollView style={{ maxHeight: height * 0.68 }} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.md }} showsVerticalScrollIndicator={false}>
          {order ? (
            <TrackingSheet
              order={order}
              etaMinutes={eta}
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
              onMore={() => setMenu(true)}
              onRetry={() => void retry()}
              retrying={retrying}
              onCall={() => call(order.partner?.phone)}
              onChat={() => setToast('Tính năng nhắn tin với tài xế sắp ra mắt')}
              onRate={() => router.push(`/orders/${order.id}/rate`)}
              onHome={goHome}
            />
          ) : loadError || !orderId ? (
            <View style={styles.loading}>
              <AppText size={14} color={Colors.textSecondary} align="center">
                {loadError ?? 'Không tìm thấy đơn hàng'}
              </AppText>
              <Button title="Về trang chủ" variant="outline" onPress={goHome} style={{ marginTop: Spacing.md }} />
            </View>
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
        {cancellable && order ? (
          <ListRow
            icon={Icons.closeCircle}
            iconColor={Colors.error}
            label="Huỷ đơn hàng"
            sublabel={order.cancelFeeIfNow ? `Phí huỷ nếu huỷ bây giờ: ${order.cancelFeeIfNow.toLocaleString('vi-VN')}đ` : 'Miễn phí huỷ lúc này'}
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/booking/cancel', params: { orderId: order.id } });
            }}
          />
        ) : null}
        <ListRow
          icon={Icons.headset}
          label="Liên hệ hỗ trợ"
          sublabel={`Tổng đài ${SUPPORT_PHONE}`}
          divider={false}
          onPress={() => {
            setMenu(false);
            call(SUPPORT_PHONE);
          }}
        />
      </BottomSheet>

      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} style={{ bottom: sheetH + Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.mapBg },
  close: { position: 'absolute', left: Spacing.screen },
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
  loading: { alignItems: 'center', paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.screen },
});
