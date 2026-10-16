// app/booking/tracking.tsx — 1.5: bản đồ + bottom sheet theo trạng thái đơn
// (đã hẹn giờ / đang tìm tài xế / không tìm thấy / tài xế đang đến / đang thực hiện / hoàn thành / đã huỷ).
// Nguồn: GET /v1/customer/orders/:id. Cập nhật realtime qua socket /customer: order.updated (tải lại đơn) +
// partner.location (di chuyển ghim tài xế ngay); mỗi lần kết nối lại / push về đơn này cũng tải lại; dự phòng poll 30s.
// Đang có tài xế chạy: báo server "đang xem" mỗi 20 s (POST /orders/:id/watch) → tài xế gửi GPS 30 s / lần thay vì 5 phút
// (anh Jacob 16/10/2026); xe bám đường + bản đồ phóng gần: LiveTrackingMap.
// ETA: theo tuyến đường xe → điểm kế (thời gian Goong); chưa có tuyến thì ước lượng đường chim bay ~25 km/h — luôn ghi "khoảng".
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Linking, ActivityIndicator, StyleSheet, useWindowDimensions, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Button, Icons, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/booking';
import { circleEdgePoints, estimateEtaMinutes, getOrder, groupOfOrder, isActiveStatus, queueOrder, radiusLabel, retryOrder, searchPhaseAt, watchOrder, type OrderDetail, type OrderSearch, type SearchPhase } from '@/services/orders';
import { nearbySupply, type SupplyMarkerData } from '@/services/supply';
import type { ZMapMarker } from '@/components/map/types';
import { ensureCatalog } from '@/services/catalog';
import { errorMessage, isApiError } from '@/services/zuum';
import { useRealtime, useRealtimeRefetch } from '@/hooks/useRealtime';
import { useOrderPushRefresh } from '@/hooks/useNotifications';
import { cancelFeePending, mmss, useFreeCancelCountdown } from '@/hooks/useCancelCountdown';
import { RoundIconButton, SupplyMarkerView, TrackingSheet, mapBottomPadding, type MapStop } from '@/components/booking';
import { LiveTrackingMap } from '@/components/booking/LiveTrackingMap';
import type { PartnerFix } from '@/components/booking/useLiveVehicle';
import { SUPPORT_HOTLINE as SUPPORT_PHONE } from '@/constants/content';
import { decodePolyline } from '@/components/map/polyline';
import { orderArt } from '@/components/activity/orderUtils';
import { useAnimatedSupply } from '@/components/booking/useAnimatedSupply';

const FALLBACK_POLL_MS = 30_000;
/** báo "đang xem" — server giữ 45 s */
const WATCH_EVERY_MS = 20_000;
/** hỏi "tài xế quanh bạn" mỗi bao lâu khi đang tìm */
const SUPPLY_POLL_MS = 5_000;
/** lề để vòng quét nằm gọn trong phần bản đồ nhìn thấy (trên: nút đóng) */
const RADAR_FIT_MARGIN = { top: 110, right: 36, bottom: 36, left: 36 };

/** chỉ nhận vị trí đo sau vị trí đang có (socket / REST / watch có thể về lệch thứ tự) */
const newerFix = (cur: PartnerFix | null, next: PartnerFix | null): PartnerFix | null =>
  !next ? cur : !cur || Date.parse(next.at) >= Date.parse(cur.at) ? next : cur;

export default function TrackingScreen() {
  const { orderId: orderIdParam, from } = useLocalSearchParams<{ orderId?: string; from?: string }>();
  const orderId = typeof orderIdParam === 'string' && orderIdParam ? orderIdParam : null;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [partnerLoc, setPartnerLoc] = useState<PartnerFix | null>(null);
  const [routeEta, setRouteEta] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [queueing, setQueueing] = useState(false);
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
      setPartnerLoc((cur) => (data.partnerLocation ? newerFix(cur, data.partnerLocation) : null));
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
    if (p.orderId === orderId) setPartnerLoc((cur) => newerFix(cur, { lat: p.lat, lng: p.lng, heading: p.heading, at: p.at }));
  });
  useRealtimeRefetch(() => void load());

  // Dự phòng khi socket chập chờn: poll chậm lúc đơn còn chạy
  const active = order ? isActiveStatus(order.status) || order.status === 'no_driver_found' : true;
  useEffect(() => {
    if (!orderId || !active) return;
    const t = setInterval(() => void load(), FALLBACK_POLL_MS);
    return () => clearInterval(t);
  }, [orderId, active, load]);

  const partnerRunning = !!order?.partner && (order.status === 'assigned' || order.status === 'arrived_pickup' || order.status === 'picked_up');
  const showPartner = !!partnerLoc && partnerRunning;
  const eta = order && showPartner ? (routeEta ?? estimateEtaMinutes(order, partnerLoc)) : null;

  // Khách đang xem đơn có tài xế chạy → báo server mỗi 20 s (tài xế gửi GPS 30 s / lần); app ở nền thì thôi báo
  useEffect(() => {
    if (!orderId || !partnerRunning) return;
    let alive = true;
    const ping = async () => {
      if (AppState.currentState !== 'active') return;
      try {
        const r = await watchOrder(orderId);
        if (alive && r.partnerLocation) setPartnerLoc((cur) => newerFix(cur, r.partnerLocation));
      } catch {
        /* lần sau báo lại */
      }
    };
    void ping();
    const t = setInterval(() => void ping(), WATCH_EVERY_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void ping();
    });
    return () => {
      alive = false;
      clearInterval(t);
      sub.remove();
    };
  }, [orderId, partnerRunning]);

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
  // icon theo đúng gói đang đặt (danh sách đã lọc theo serviceId)
  const serviceArt = order ? orderArt(order) : undefined;
  // xe trượt mượt giữa hai lần hỏi, đầu xe theo hướng chạy (xe mô phỏng chạy trên đường thật — server)
  const animatedSupply = useAnimatedSupply(supply, SUPPLY_POLL_MS);
  const supplyMarkers = useMemo<ZMapMarker[]>(
    () =>
      animatedSupply.map((m) => ({
        id: `supply-${m.key}`,
        at: { lat: m.lat, lng: m.lng },
        anchor: 'center',
        children: <SupplyMarkerView marker={m} heading={m.heading} serviceArt={serviceArt} />,
      })),
    [animatedSupply, serviceArt],
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
    // xe tài xế: LiveTrackingMap vẽ (đúng loại xe, bám đường, xoay theo hướng chạy)
    return list;
  }, [order]);
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
  // anh Jacob: không có thợ → hỏi khách có xếp hàng chờ không (thợ rảnh thấy trong tab "Hàng chờ" và nhận)
  const queue = async () => {
    if (!orderId || queueing) return;
    setQueueing(true);
    try {
      setOrder(await queueOrder(orderId));
      setToast('Đã xếp hàng — báo ngay khi có thợ nhận việc');
    } catch (e) {
      setToast(errorMessage(e, 'Không xếp hàng chờ được'));
    } finally {
      setQueueing(false);
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
      <LiveTrackingMap
        order={order}
        fix={showPartner ? partnerLoc : null}
        live={showPartner}
        onEta={setRouteEta}
        stops={stops}
        routePath={routePath}
        bottomPadding={mapBottomPadding(sheetH, height)}
        extraMarkers={supplyMarkers}
        radar={radar}
        fitOverride={fitOverride}
      />
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
              onQueue={order.allowedActions.includes('queue') ? () => void queue() : undefined}
              queueing={queueing}
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
