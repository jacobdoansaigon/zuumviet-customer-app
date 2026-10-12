// app/booking/tracking.tsx — 1.5: bản đồ + bottom sheet theo trạng thái đơn
// (đã hẹn giờ / đang tìm tài xế / không tìm thấy / tài xế đang đến / đang thực hiện / hoàn thành / đã huỷ).
// Nguồn: GET /v1/customer/orders/:id. Cập nhật realtime qua socket /customer: order.updated (tải lại đơn) +
// partner.location (di chuyển ghim tài xế ngay); mỗi lần kết nối lại / push về đơn này cũng tải lại; dự phòng poll 30s.
// ETA: ước lượng đường chim bay từ vị trí tài xế ở ~25 km/h (API chưa có ETA) — luôn ghi "khoảng".
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Linking, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button, Icons, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/booking';
import { circleEdgePoints, estimateEtaMinutes, getOrder, groupOfOrder, isActiveStatus, radiusLabel, retryOrder, searchPhaseAt, type OrderDetail, type OrderSearch, type SearchPhase } from '@/services/orders';
import { nearbySupply, type SupplyMarkerData } from '@/services/supply';
import type { ZMapMarker } from '@/components/map/types';
import { ensureCatalog } from '@/services/catalog';
import { errorMessage, isApiError } from '@/services/zuum';
import { useRealtime, useRealtimeRefetch } from '@/hooks/useRealtime';
import { useOrderPushRefresh } from '@/hooks/useNotifications';
import { cancelFeePending, mmss, useFreeCancelCountdown } from '@/hooks/useCancelCountdown';
import { BookingMap, RoundIconButton, SupplyMarkerView, TrackingSheet, mapBottomPadding, type MapStop } from '@/components/booking';
import { SUPPORT_HOTLINE as SUPPORT_PHONE } from '@/constants/content';
import { decodePolyline } from '@/components/map/polyline';

const FALLBACK_POLL_MS = 30_000;
/** hỏi "tài xế quanh bạn" mỗi bao lâu khi đang tìm */
const SUPPLY_POLL_MS = 5_000;
/** lề để vòng quét nằm gọn trong phần bản đồ nhìn thấy (trên: nút đóng) */
const RADAR_FIT_MARGIN = { top: 110, right: 36, bottom: 36, left: 36 };

type LatLng = { lat: number; lng: number };

export default function TrackingScreen() {
  const { orderId: orderIdParam, from } = useLocalSearchParams<{ orderId?: string; from?: string }>();
  const orderId = typeof orderIdParam === 'string' && orderIdParam ? orderIdParam : null;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [partnerLoc, setPartnerLoc] = useState<LatLng | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

  // ---- đang tìm: vòng quét (500 m → 1 km → 2 km…) theo lịch server trả, tính bằng đồng hồ máy từ `elapsedSeconds` ----
  const search = order?.status === 'searching' ? order.search : null;
  const clock = useRef<{ search: OrderSearch; startedLocal: number } | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!search) return;
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [search]);
  const phase = useMemo<SearchPhase | null>(() => {
    if (!search) return null;
    // mỗi lần tải lại đơn → chỉnh lại mốc theo elapsedSeconds mới (trôi vài giây giữa máy và server)
    if (clock.current?.search !== search) clock.current = { search, startedLocal: Date.now() - search.elapsedSeconds * 1000 };
    return searchPhaseAt(search, (Date.now() - clock.current.startedLocal) / 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tick]);
  const radar = phase && order ? { center: { lat: order.pickup.lat, lng: order.pickup.lng }, radiusMeters: phase.radiusMeters } : null;
  const fitOverride = radar
    ? { key: `radar:${radar.radiusMeters}:${radar.center.lat.toFixed(4)},${radar.center.lng.toFixed(4)}`, points: circleEdgePoints(radar.center, radar.radiusMeters * 1.08), margin: RADAR_FIT_MARGIN }
    : null;

  // icon tài xế / thợ quanh điểm đón trong vòng quét (server trộn thật + mô phỏng), hỏi lại mỗi 5 s và khi vòng nới rộng
  const [supply, setSupply] = useState<SupplyMarkerData[]>([]);
  const supplyRadius = phase?.radiusMeters ?? 0;
  const serviceId = order?.service.id;
  const pickupKey = order ? `${order.pickup.lat},${order.pickup.lng}` : '';
  useEffect(() => {
    if (!supplyRadius || !order) {
      setSupply([]);
      return;
    }
    let alive = true;
    const { lat, lng } = order.pickup;
    const run = async () => {
      try {
        const res = await nearbySupply({ lat, lng, radiusMeters: supplyRadius, ...(serviceId ? { serviceId } : {}) });
        if (alive) setSupply(res.items);
      } catch {
        /* giữ icon cũ, thử lại lần sau */
      }
    };
    void run();
    const t = setInterval(() => void run(), SUPPLY_POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplyRadius, serviceId, pickupKey]);
  const supplyMarkers = useMemo<ZMapMarker[]>(
    () => supply.map((m) => ({ id: `supply-${m.key}`, at: { lat: m.lat, lng: m.lng }, anchor: 'center', children: <SupplyMarkerView marker={m} /> })),
    [supply],
  );

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
  // tuyến đã báo giá (theo đường) — đơn cũ không có thì nối thẳng
  const routePath = useMemo(() => decodePolyline(order?.routePolyline), [order?.routePolyline]);

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
  // phần mở rộng đang mở (có thanh huỷ): đếm ngược huỷ miễn phí; qua mốc → tải lại đơn để hiện phí mới
  const freeLeft = useFreeCancelCountdown(expanded && cancellable ? order?.cancelFreeUntil : null, () => void load());
  const cancelFee = freeLeft != null ? 0 : (order?.cancelFeeIfNow ?? 0);
  const cancelSublabel =
    freeLeft != null
      ? `Miễn phí huỷ trong ${mmss(freeLeft)}`
      : cancelFee > 0
        ? `Phí huỷ nếu huỷ bây giờ: ${cancelFee.toLocaleString('vi-VN')}đ`
        : order && cancelFeePending(order, freeLeft)
          ? 'Đã hết thời gian huỷ miễn phí'
          : 'Miễn phí huỷ lúc này';

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} routePath={routePath} bottomPadding={mapBottomPadding(sheetH, height)} extraMarkers={supplyMarkers} radar={radar} fitOverride={fitOverride} />
      <RoundIconButton icon={Icons.close} onPress={close} style={[styles.close, { top: insets.top + Spacing.md }]} accessibilityLabel="Đóng" />

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <ScrollView style={{ maxHeight: height * 0.68 }} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.md }} showsVerticalScrollIndicator={false}>
          {order ? (
            <TrackingSheet
              order={order}
              etaMinutes={eta}
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
              onRetry={() => void retry()}
              retrying={retrying}
              searchHint={phase ? `Đang quét trong bán kính ${radiusLabel(phase.radiusMeters)}` : null}
              onCancel={cancellable ? () => router.push({ pathname: '/booking/cancel', params: { orderId: order.id } }) : undefined}
              cancelHint={cancellable ? cancelSublabel : null}
              onSupport={() => call(SUPPORT_PHONE)}
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
