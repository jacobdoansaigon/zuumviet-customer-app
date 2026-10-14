// app/booking/index.tsx — GH 1.1 / VT 1.1: bản đồ toàn màn + bottom sheet chọn dịch vụ + lộ trình → "Xác nhận".
// Params: service=<nhóm catalog>, reorder=<orderId> (đặt lại từ đơn cũ: điền sẵn điểm đón/điểm đến thật của đơn).
// Danh sách dịch vụ lấy từ catalog API (GET /v1/public/catalog) theo nhóm; giá trên danh sách là ước tính "~"
// theo bảng giá catalog — giá thật do server báo ở màn xác nhận. Chưa đủ điểm đón + điểm đến → chỉ hiện lộ trình.
// Xe máy / Xe hơi: tab đổi qua lại ngay trong màn; "Tất cả dịch vụ" gộp gói của cả 2.
// Xe đường dài: điểm đến xong → 3 phương án: Thuê cả xe (đơn thường) / Xe ghép & Mua vé xe (chuyến bán theo ghế,
// chỉ bật khi điểm đến khớp 1 tỉnh/thành đang bán vé — không khớp thì gợi ý bến xe gần nhất).
// Chọn điểm đón bằng bản đồ (khi chưa có điểm đến): ghim logo ZuumViet đứng giữa khung, khách kéo bản đồ / chạm một điểm
// (kể cả tên địa điểm có sẵn trên nền) → dừng 1 giây mới đổi toạ độ mũi ghim ra địa chỉ (1 request / lần dừng) và điền
// vào ô điểm đón; nút định vị đưa bản đồ về vị trí GPS; vị trí đã lưu (Nhà / Công ty…) hiện trên bản đồ, chạm để chọn;
// chip "Cổng / lối vào" ghi vào pickup.note cho tài xế.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText, Chip, Icon, Icons, ServiceOption, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS, URBAN_RIDE_KEYS, toServiceKey } from '@/constants/booking';
import { useBooking, startBooking, syncOptionWithCatalog, hydrateSender, prefillRoute, switchRideOption, selectLaborOption, setOptions, addReceiver, removeReceiver, pruneIncompleteReceivers, completeReceivers, maxStopsOf, estimateFor, formatVnd, pickupFromGps, setSenderPlace, refreshQuote, refreshPreviews, previewFor, buildQuoteRequest, type Place, buildPreviewRoute, previewRoute, formatRouteDistance, formatRouteDuration } from '@/services/bookingStore';
import { decodePolyline } from '@/components/map/polyline';
import type { LatLng, ZMapHandle, ZMapMarker } from '@/components/map/types';
import { mapsAvailable } from '@/services/maps';
import { reversePlace, type PlaceEntrance } from '@/services/places';
import { loadSavedAddresses, useSavedAddresses, SAVED_KIND_LABEL, type SavedAddress } from '@/services/addresses';
import { ensureCatalog, optionsFor, useCatalog, type ServiceOptionView } from '@/services/catalog';
import { ensureIntercityCities, matchIntercityCity, nearestCity, useIntercityCities } from '@/services/intercity';
import { getOrder } from '@/services/orders';
import { errorMessage } from '@/services/zuum';
import {
  BookingMap,
  RoundIconButton,
  StopList,
  ServiceInfoDialog,
  HandymanJobDialog,
  FlatFooter,
  PickupPin,
  PICKUP_PIN_HEIGHT,
  SavedPlaceMarker,
  useCurrentLocation,
  getCurrentLatLng,
  EntranceChips,
  ReceiverGates,
  gateLabel,
  samePlace,
  useEntrances,
  mapBottomPadding,
  type MapStop,
  type HandymanJobDetail,
  EMPTY_JOB_DETAIL,
} from '@/components/booking';

/** kéo bản đồ dừng bao lâu mới đổi toạ độ ghim ra địa chỉ (gom nhiều lần dừng ngắn thành 1 request) */
const PIN_SETTLE_MS = 1000;

/** Phương án bán theo ghế đang mở — 'carpool' (Xe ghép) tạm ẩn theo anh Jacob 2026-10-12; mở lại: thêm vào mảng */
const INTERCITY_TRIP_KINDS: readonly ('bus' | 'carpool')[] = ['bus'];

export default function BookingScreen() {
  const { service, reorder } = useLocalSearchParams<{ service?: string; reorder?: string }>();
  const serviceKey = toServiceKey(service);
  const state = useBooking();
  const catalog = useCatalog();
  const cities = useIntercityCities();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const location = useCurrentLocation();
  const [expanded, setExpanded] = useState(false);
  const [info, setInfo] = useState<ServiceOptionView | null>(null);
  const [jobOption, setJobOption] = useState<ServiceOptionView | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const [rootH, setRootH] = useState(0);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // ---- chọn điểm đón bằng ghim giữa bản đồ ----
  const mapRef = useRef<ZMapHandle>(null);
  const resolveSeq = useRef(0);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  // cổng / lối vào của địa điểm tại điểm đón (API bản đồ) — chỉ có với siêu thị, bệnh viện, trường, chung cư…; anchor = điểm của địa điểm
  const savedAddresses = useSavedAddresses();

  const loadCatalog = useCallback(() => {
    setCatalogError(null);
    ensureCatalog()
      .then(() => syncOptionWithCatalog())
      .catch((e) => setCatalogError(errorMessage(e, 'Không tải được danh sách dịch vụ')));
  }, []);

  useEffect(() => {
    startBooking(serviceKey);
    loadCatalog();
    void hydrateSender();
  }, [serviceKey, loadCatalog]);

  useEffect(() => {
    if (catalog) syncOptionWithCatalog();
  }, [catalog]);

  // "Đặt lại" đơn cũ: điểm đón + điểm đến lấy đúng toạ độ của đơn, chọn lại đúng dịch vụ nếu còn bán
  useEffect(() => {
    if (!reorder) return;
    let alive = true;
    getOrder(reorder)
      .then((o) => {
        if (!alive) return;
        const pickup: Place = { title: o.pickup.address, address: o.pickup.address, lat: o.pickup.lat, lng: o.pickup.lng, source: 'history' };
        const stops: Place[] = o.stops.map((s) => ({ title: s.address, address: s.address, lat: s.lat, lng: s.lng, source: 'history' }));
        prefillRoute(pickup, stops);
        if (o.service.category === serviceKey) switchRideOption(serviceKey, o.service.id);
      })
      .catch((e) => setToast(errorMessage(e, 'Không tải được đơn cũ')));
    return () => {
      alive = false;
    };
  }, [reorder, serviceKey]);

  // Chưa có điểm đón: dùng vị trí GPS hiện tại (đổi ra địa chỉ qua API)
  useEffect(() => {
    if (location) void pickupFromGps(location.latitude, location.longitude);
  }, [location]);

  useEffect(() => {
    if (serviceKey === 'intercity') void ensureIntercityCities().catch(() => undefined);
  }, [serviceKey]);

  // Quay lại màn này: bỏ các người nhận điền dở
  useFocusEffect(
    useCallback(() => {
      pruneIncompleteReceivers();
    }, []),
  );

  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const maxStops = maxStopsOf(state);
  const complete = completeReceivers(state);
  const senderReady = !!state.sender.place && !!state.sender.name && !!state.sender.phone;
  // Gọi thợ / thuê nhân công (không có điểm đến) → tính giá được ngay; còn lại cần chọn xong điểm đến.
  const hasDestination = maxStops === 0 || complete.length > 0;
  // Chưa có điểm đến: bản đồ ở chế độ ghim — kéo bản đồ để chọn điểm đón (có điểm đến rồi thì bản đồ canh theo lộ trình)
  const pinMode = mapsAvailable && complete.length === 0;
  const pickup = state.sender.place;

  /** Toạ độ mũi ghim → địa chỉ chữ → ô điểm đón. Chỉ gọi API sau khi đứng yên `delayMs` (yêu cầu mới huỷ yêu cầu cũ). */
  const resolvePickupAt = useCallback(
    (c: LatLng, source: Place['source'], delayMs: number) => {
      const my = ++resolveSeq.current;
      setResolving(true);
      const run = async () => {
        try {
          const p = await reversePlace(c.lat, c.lng);
          if (my !== resolveSeq.current) return;
          setSenderPlace({ title: p.name ?? (source === 'gps' ? 'Vị trí hiện tại' : 'Vị trí trên bản đồ'), address: p.address, lat: c.lat, lng: c.lng, placeId: p.placeId, source });
        } catch (e) {
          if (my === resolveSeq.current) setToast(errorMessage(e, 'Không xác định được địa chỉ tại vị trí này'));
        } finally {
          if (my === resolveSeq.current) setResolving(false);
        }
      };
      const t = setTimeout(() => void run(), delayMs);
      return () => clearTimeout(t);
    },
    [],
  );
  const cancelPendingResolve = useRef<(() => void) | null>(null);
  const schedulePickup = useCallback(
    (c: LatLng, source: Place['source'], delayMs: number) => {
      cancelPendingResolve.current?.();
      cancelPendingResolve.current = resolvePickupAt(c, source, delayMs);
    },
    [resolvePickupAt],
  );

  // Khách kéo / phóng bản đồ xong → tâm khung mới = mũi ghim; chờ 1 giây đứng yên rồi mới đổi ra địa chỉ
  const onMapMoved = useCallback(
    (c: LatLng) => {
      if (!pinMode) return;
      if (pickup && Math.abs(pickup.lat - c.lat) < 1e-6 && Math.abs(pickup.lng - c.lng) < 1e-6) return;
      schedulePickup(c, 'map', PIN_SETTLE_MS);
    },
    [pinMode, pickup, schedulePickup],
  );
  // Chạm một điểm (địa chỉ / tên địa điểm có sẵn trên nền bản đồ) → bản đồ trượt tới, ghim nằm đúng chỗ đó
  // chạm vào marker vị trí đã lưu: trên web bản đồ cũng nhận 'click' → bỏ qua chạm bản đồ ngay sau đó
  const ignoreMapPressUntil = useRef(0);
  const onMapPress = useCallback(
    (c: LatLng) => {
      if (!pinMode || Date.now() < ignoreMapPressUntil.current) return;
      mapRef.current?.flyTo(c);
      schedulePickup(c, 'map', 300);
    },
    [pinMode, schedulePickup],
  );
  // Nút định vị: bản đồ về đúng vị trí GPS, điểm đón = vị trí đó
  const locateMe = async () => {
    if (locating) return;
    setLocating(true);
    const loc = await getCurrentLatLng();
    setLocating(false);
    if (!loc) {
      setToast('Chưa lấy được vị trí. Kiểm tra quyền truy cập vị trí của ứng dụng.');
      return;
    }
    const c = { lat: loc.latitude, lng: loc.longitude };
    mapRef.current?.flyTo(c, 16);
    if (pinMode) schedulePickup(c, 'gps', 0);
  };
  // Điểm đón đổi từ nguồn khác (GPS lần đầu, tìm kiếm, vị trí đã lưu, đơn cũ) → bản đồ trượt tới, ghim nằm đúng điểm
  useEffect(() => {
    if (!pinMode || !pickup || pickup.source === 'map') return;
    mapRef.current?.flyTo({ lat: pickup.lat, lng: pickup.lng }, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinMode, pickup?.lat, pickup?.lng, pickup?.source]);
  // Vị trí đã lưu hiện trên bản đồ khi đang chọn điểm đón
  useEffect(() => {
    if (pinMode && !savedAddresses) void loadSavedAddresses().catch(() => undefined);
  }, [pinMode, savedAddresses]);
  const pickSaved = useCallback((a: SavedAddress) => {
    ignoreMapPressUntil.current = Date.now() + 600;
    cancelPendingResolve.current?.();
    resolveSeq.current++;
    setResolving(false);
    setSenderPlace({ title: a.label || SAVED_KIND_LABEL[a.kind], address: a.address, lat: a.lat, lng: a.lng, savedAddressId: a.id, source: 'saved' });
  }, []);
  const savedMarkers = useMemo<ZMapMarker[]>(
    () =>
      pinMode && savedAddresses
        ? savedAddresses.map((a) => ({
            id: `saved-${a.id}`,
            at: { lat: a.lat, lng: a.lng },
            anchor: 'center' as const,
            title: a.label,
            children: <SavedPlaceMarker kind={a.kind} label={a.label || SAVED_KIND_LABEL[a.kind]} onPress={() => pickSaved(a)} />,
          }))
        : [],
    [pinMode, savedAddresses, pickSaved],
  );
  useEffect(() => () => cancelPendingResolve.current?.(), []);
  // Cổng / lối vào của điểm đón (điểm đến dùng ReceiverGates dưới từng dòng)
  const { entrances, selectedGate, show: showEntrances } = useEntrances(pickup, resolving);
  // Chọn cổng: điểm đón = toạ độ cổng (tài xế tới đúng cổng), địa chỉ giữ của địa điểm, ghi chú = tên cổng; bấm lại → về điểm cũ
  const pickGate = (g: PlaceEntrance) => {
    if (!entrances) return;
    const a = entrances.anchor;
    if (selectedGate?.placeId === g.placeId) {
      setSenderPlace({ ...a, source: 'gate' });
      setOptions({ pickupNote: '' });
      return;
    }
    setSenderPlace({ ...a, lat: g.lat, lng: g.lng, source: 'gate' });
    setOptions({ pickupNote: gateLabel(g, entrances.parent) });
  };

  const tabKeys = URBAN_RIDE_KEYS.includes(state.service) ? URBAN_RIDE_KEYS : null;
  const options: ServiceOptionView[] = useMemo(
    () => (expanded && tabKeys ? tabKeys.flatMap((k) => optionsFor(k, catalog)) : optionsFor(state.service, catalog)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expanded, state.service, catalog],
  );
  const selected = options.find((o) => o.id === state.optionId) ?? null;
  const canConfirm = senderReady && hasDestination && !!selected && !selected.paused;

  const isIntercity = state.service === 'intercity';
  const destPlace = complete[0]?.place ?? null;
  const matchedCity = isIntercity && destPlace && cities ? matchIntercityCity(`${destPlace.title} ${destPlace.address}`, cities) : null;
  const nearest = isIntercity && destPlace && cities && !matchedCity ? nearestCity(destPlace, cities) : null;

  const stops = useMemo<MapStop[]>(() => {
    const list: MapStop[] = [];
    const p = state.sender.place;
    // chế độ ghim: ghim logo giữa khung đã đại diện điểm đón
    if (p && !pinMode) list.push({ id: 'pickup', lat: p.lat, lng: p.lng, type: 'pickup', label: labels.mapPickupLabel });
    complete.forEach((r, i) => {
      list.push({ id: `drop-${r.id}`, lat: r.place!.lat, lng: r.place!.lng, type: 'dropoff', label: maxStops > 1 ? `${labels.mapDropLabel} ${i + 1}` : labels.mapDropLabel });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sender.place, state.receivers, labels, maxStops, pinMode]);

  // Tuyến theo đường: đủ điểm thì lấy báo giá ngầm cho bản nháp (có hình dạng tuyến) — màn xác nhận dùng lại nếu còn hạn
  const quoteKey = useMemo(() => {
    const req = isIntercity ? null : buildQuoteRequest(state);
    return req ? JSON.stringify(req) : '';
  }, [state, isIntercity]);
  useEffect(() => {
    if (!quoteKey) return;
    const t = setTimeout(() => void refreshQuote(), 600);
    return () => clearTimeout(t);
  }, [quoteKey]);
  // Xe đường dài: chưa chọn hạng xe → chọn sẵn hạng đầu tiên đang bán để tính tuyến đường + giá ngay ở màn chọn phương án
  useEffect(() => {
    if (!isIntercity || !hasDestination) return;
    const list = optionsFor('intercity', catalog);
    if (list.some((o) => o.id === state.optionId)) return;
    const first = list.find((o) => !o.paused);
    if (first) switchRideOption('intercity', first.id);
  }, [isIntercity, hasDestination, catalog, state.optionId]);
  // Giá thật (theo đường + giá động) cho mọi dịch vụ trong tab — thay ước tính "~" trên danh sách; xe đường dài cũng lấy
  // tuyến đường (quãng đường, thời gian, hình dạng) từ đây để bước sau tính tiền ngay
  const previewIds = useMemo(() => options.filter((o) => !o.paused).map((o) => o.service.id).join(','), [options]);
  const previewRouteKey = useMemo(() => {
    const r = buildPreviewRoute(state);
    return r ? JSON.stringify(r) : '';
  }, [state]);
  useEffect(() => {
    if (!previewRouteKey || !previewIds) return;
    const t = setTimeout(() => void refreshPreviews(previewIds.split(',')), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewRouteKey, previewIds]);
  const routePath = useMemo(() => {
    const q = state.quote;
    if (q.status === 'ready' && q.key === quoteKey && q.quote?.routePolyline) return decodePolyline(q.quote.routePolyline);
    // chưa có báo giá ngầm (xe đường dài): hình dạng tuyến từ xem trước giá
    const pr = previewRoute(state);
    return pr?.routePolyline ? decodePolyline(pr.routePolyline) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.quote, state.previews, quoteKey, previewRouteKey]);
  const intercityRoute = isIntercity ? previewRoute(state) : null;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const openSender = () => router.push('/booking/sender');
  const openReceiver = (index: number) => router.push({ pathname: '/booking/receiver', params: { index: String(index) } });
  const addStop = () => {
    const index = addReceiver();
    router.push({ pathname: '/booking/location', params: { target: 'receiver', index: String(index) } });
  };
  const onTabPress = (key: (typeof URBAN_RIDE_KEYS)[number]) => {
    setExpanded(false);
    if (key === state.service) return;
    const first = optionsFor(key, catalog).find((o) => !o.paused);
    if (first) switchRideOption(key, first.id);
  };
  const onOptionPress = (o: ServiceOptionView) => {
    if (o.paused) {
      setToast(`${o.name} đang tạm ngưng nhận đơn`);
      return;
    }
    // Thuê nhân công (tính theo block giờ) → mở dialog chọn số block trước khi chọn
    if (o.blockMinutes) {
      setInfo(o);
      return;
    }
    // Gọi thợ: mở "Chi tiết công việc" (mô tả sự cố, khẩn cấp) ngay khi bấm 1 loại thợ
    if (state.service === 'handyman') {
      setJobOption(o);
      return;
    }
    switchRideOption(o.group, o.id);
    setExpanded(false);
  };
  const renderOption = (o: ServiceOptionView) => {
    // Gọi thợ: giá xem trước chỉ là phí di chuyển & khảo sát → loại thợ đang chọn hiện báo giá thật (đã gồm hạng mục, phụ phí),
    // chưa có thì ước tính tại máy
    const ownQuote = o.id === selected?.id && state.quote.status === 'ready' && state.quote.key === quoteKey ? state.quote.quote : null;
    const pv = state.service === 'handyman' && o.id === selected?.id ? null : previewFor(o.service.id, state);
    return (
    <ServiceOption
      key={o.id}
      name={o.name}
      description={o.description}
      price={o.paused ? undefined : ownQuote ? formatVnd(ownQuote.price.total) : pv && pv.total !== null ? formatVnd(pv.total) : `~${formatVnd(estimateFor(o, state))}`}
      priceHint={o.paused ? 'Tạm ngưng' : undefined}
      icon={o.icon}
      art={o.art}
      selected={o.id === selected?.id}
      onPress={() => onOptionPress(o)}
      onInfoPress={() => (state.service === 'handyman' ? setJobOption(o) : setInfo(o))}
    />
    );
  };
  // Giá động đang áp cho dịch vụ đang chọn (hiện dưới danh sách để khách hiểu vì sao giá khác thường)
  const selectedPreview = selected ? previewFor(selected.service.id, state) : null;
  const adjustmentNote = selectedPreview?.adjustments.length ? `Giá đã gồm: ${selectedPreview.adjustments.map((a) => a.label).join(', ')}` : null;

  // Xe đường dài: 3 phương án đi, bấm vào là đi thẳng
  const openCharter = () => router.push('/booking/intercity/charter');
  const openTrips = (kind: 'bus' | 'carpool') => {
    if (!matchedCity) return;
    router.push({ pathname: '/booking/intercity/[cityId]', params: { cityId: matchedCity.id, kind } });
  };
  const tripHint = matchedCity
    ? null
    : nearest
      ? `Chưa có chuyến tới đây · bến gần nhất ${nearest.city.name} (~${nearest.km}km)`
      : 'Chưa có chuyến tới điểm này';

  const catalogBlock =
    !catalog && !catalogError ? (
      <View style={styles.catalogState}>
        <ActivityIndicator color={Colors.primary} />
        <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }}>
          Đang tải dịch vụ...
        </AppText>
      </View>
    ) : catalogError && !catalog ? (
      <Pressable onPress={loadCatalog} style={styles.catalogState}>
        <Icon name={Icons.alert} size={18} color={Colors.error} />
        <AppText size={13} color={Colors.error} style={{ marginLeft: Spacing.sm, flex: 1 }}>
          {catalogError} — chạm để thử lại
        </AppText>
      </Pressable>
    ) : catalog && options.length === 0 ? (
      <View style={styles.catalogState}>
        <AppText size={13} color={Colors.textSecondary}>
          {group.title} hiện chưa mở dịch vụ nào.
        </AppText>
      </View>
    ) : null;

  // khung thông tin cao (nhiều dịch vụ) → lề bản đồ bị chặn lại để tuyến không bị zoom tuột ra xa
  const mapPad = mapBottomPadding(sheetH, rootH);
  const pinTop = (rootH - mapPad) / 2 - PICKUP_PIN_HEIGHT;

  return (
    <View style={styles.root} onLayout={(e) => setRootH(e.nativeEvent.layout.height)}>
      <BookingMap
        ref={mapRef}
        stops={stops}
        routePath={routePath}
        // chưa có tuyến theo đường (đang báo giá) → không nối thẳng hai điểm
        showRoute={!!routePath}
        bottomPadding={mapPad}
        center={pinMode && pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
        extraMarkers={savedMarkers}
        onRegionChangeComplete={pinMode ? onMapMoved : undefined}
        onPress={pinMode ? onMapPress : undefined}
      />
      {pinMode && rootH > 0 && sheetH > 0 ? (
        <View pointerEvents="none" style={[styles.centerPin, { top: pinTop }]}>
          <PickupPin lifted={resolving} />
        </View>
      ) : null}
      <RoundIconButton icon={Icons.back} onPress={goBack} style={[styles.back, { top: insets.top + Spacing.md }]} accessibilityLabel="Quay lại" />
      {mapsAvailable ? (
        <View style={[styles.locate, { bottom: sheetH + Spacing.md }]}>
          {locating ? (
            <View style={styles.locateBusy}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <RoundIconButton icon={Icons.locate} size={44} onPress={() => void locateMe()} accessibilityLabel="Vị trí của tôi" />
          )}
        </View>
      ) : null}

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        {hasDestination ? (
          <>
            {tabKeys ? (
              <Pressable onPress={() => setExpanded((v) => !v)} style={styles.handle} accessibilityLabel={expanded ? 'Thu gọn' : 'Tất cả dịch vụ'}>
                <Icon name="ion:swap-vertical" size={12} color={Colors.textMuted} />
                <AppText size={11} color={Colors.textMuted} style={{ marginLeft: 4 }}>
                  {expanded ? 'Thu gọn' : 'Tất cả dịch vụ'}
                </AppText>
              </Pressable>
            ) : (
              <View style={styles.handleSpacer} />
            )}

            {tabKeys ? (
              <View style={styles.tabs}>
                {tabKeys.map((k) => (
                  <Chip key={k} label={SERVICE_GROUPS[k].title} icon={SERVICE_GROUPS[k].icon} active={k === state.service} onPress={() => onTabPress(k)} style={styles.tab} />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          // Chưa đủ lộ trình: chỉ nhắc nhập điểm đón/điểm đến, chưa hiện dịch vụ nào
          <View style={styles.introRow}>
            <AppText size={14} weight="bold" color={Colors.text}>
              {state.sender.place ? `Nhập ${labels.mapDropLabel.toLowerCase()}` : `Nhập ${labels.mapPickupLabel.toLowerCase()}${labels.mapDropLabel ? ` và ${labels.mapDropLabel.toLowerCase()}` : ''}`}
            </AppText>
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Dịch vụ và giá sẽ hiện ra sau khi có đủ lộ trình
            </AppText>
          </View>
        )}

        <ScrollView style={{ maxHeight: height * 0.58 }} contentContainerStyle={{ paddingBottom: Spacing.sm }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {hasDestination ? (
            <>
              {isIntercity ? (
                <View style={styles.intercityChoices}>
                  <View style={styles.sectionLabel}>
                    <AppText size={12} weight="semiBold" color={Colors.textSecondary}>
                      Chọn phương án đi {destPlace?.title ?? ''}
                    </AppText>
                    <AppText size={12} color={intercityRoute ? Colors.text : Colors.textSecondary} style={{ marginTop: 2 }}>
                      {intercityRoute
                        ? `Quãng đường ${formatRouteDistance(intercityRoute.distanceMeters)}${intercityRoute.durationSeconds ? ` · khoảng ${formatRouteDuration(intercityRoute.durationSeconds)} theo đường bộ` : ' theo đường bộ'}`
                        : state.previews.status === 'error'
                          ? 'Chưa tính được quãng đường, sẽ tính lại ở bước sau'
                          : 'Đang tính quãng đường theo đường bộ…'}
                    </AppText>
                  </View>

                  <Pressable onPress={openCharter} style={styles.marketplaceCard}>
                    <View style={styles.marketplaceIcon}>
                      <Icon name={Icons.carSide} size={22} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText size={14} weight="bold" color={Colors.text}>
                        Thuê cả xe
                      </AppText>
                      <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                        Xe riêng theo yêu cầu · 4 đến 45 chỗ, đón tận nơi
                      </AppText>
                    </View>
                    <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} />
                  </Pressable>

                  {INTERCITY_TRIP_KINDS.map((kind) => (
                    <Pressable
                      key={kind}
                      onPress={() => openTrips(kind)}
                      disabled={!matchedCity}
                      style={[styles.marketplaceCard, !matchedCity && styles.marketplaceCardDisabled]}
                    >
                      <View style={[styles.marketplaceIcon, !matchedCity && styles.marketplaceIconDisabled]}>
                        <Icon name={kind === 'bus' ? 'mci:bus' : 'mci:car-multiple'} size={22} color={matchedCity ? Colors.white : Colors.gray400} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText size={14} weight="bold" color={matchedCity ? Colors.text : Colors.textSecondary}>
                          {kind === 'bus' ? 'Mua vé xe' : 'Xe ghép'}
                        </AppText>
                        <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                          {tripHint ?? (kind === 'bus' ? 'Chọn nhà xe, chuyến, ghế ngồi, vé điện tử' : 'Đi chung xe với tài xế cùng tuyến, chọn ghế theo chuyến')}
                        </AppText>
                      </View>
                      {matchedCity ? <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <>
                  <View style={styles.options}>{catalogBlock ?? options.map(renderOption)}</View>
                  {adjustmentNote ? (
                    <AppText size={12} color={Colors.textSecondary} style={styles.adjustmentNote}>
                      {adjustmentNote}
                    </AppText>
                  ) : null}
                </>
              )}
              <View style={styles.divider} />
            </>
          ) : null}
          <StopList
            sender={state.sender}
            receivers={state.receivers}
            onPressSender={openSender}
            onPressReceiver={openReceiver}
            onRemoveReceiver={removeReceiver}
            onAddReceiver={addStop}
            labels={labels}
            maxStops={maxStops}
            senderAddressOverride={pinMode && resolving ? 'Đang xác định địa chỉ…' : undefined}
            senderExtra={showEntrances && entrances ? <EntranceChips parent={entrances.parent} items={entrances.items} selectedId={selectedGate?.placeId ?? null} onPick={pickGate} /> : undefined}
            receiverExtra={(r, index) => <ReceiverGates receiver={r} index={index} />}
          />
        </ScrollView>

        {isIntercity && hasDestination ? null : (
          <FlatFooter title={canConfirm ? 'Xác nhận' : labels.confirmHint} disabled={!canConfirm} onPress={() => router.push('/booking/confirm')} />
        )}
      </View>

      <ServiceInfoDialog
        option={info}
        initialBlocks={info && info.id === state.optionId ? state.options.laborBlocks : 1}
        onClose={() => setInfo(null)}
        onSelect={(o, blocks) => {
          if (o.paused) setToast(`${o.name} đang tạm ngưng nhận đơn`);
          else if (o.blockMinutes) selectLaborOption(o.group, o.id, blocks);
          else switchRideOption(o.group, o.id);
          setInfo(null);
          setExpanded(false);
        }}
      />

      <HandymanJobDialog
        option={jobOption}
        initial={
          jobOption && jobOption.id === state.optionId
            ? {
                jobs: state.options.handymanJobs,
                photos: state.options.handymanPhotos,
                height: state.options.handymanHeight,
                ladder: state.options.handymanLadder,
                floor: state.options.handymanFloor,
                issueNote: state.options.handymanIssueNote,
                urgent: state.options.handymanUrgent,
              }
            : EMPTY_JOB_DETAIL
        }
        onClose={() => setJobOption(null)}
        onSelect={(o, detail: HandymanJobDetail) => {
          switchRideOption(o.group, o.id);
          setOptions({
            handymanJobs: detail.jobs,
            handymanPhotos: detail.photos,
            handymanHeight: detail.height,
            handymanLadder: detail.ladder,
            handymanFloor: detail.floor,
            handymanIssueNote: detail.issueNote,
            handymanUrgent: detail.urgent,
          });
          setJobOption(null);
          setExpanded(false);
        }}
      />

      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} style={{ bottom: sheetH + Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.mapBg },
  back: { position: 'absolute', left: Spacing.screen },
  centerPin: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  locate: { position: 'absolute', right: Spacing.screen },
  locateBusy: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
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
  handle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  handleSpacer: { height: Spacing.sm },
  introRow: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  tabs: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
  tab: { flex: 1, justifyContent: 'center' },
  options: { paddingHorizontal: Spacing.screen, gap: 4 },
  adjustmentNote: { paddingHorizontal: Spacing.screen, paddingTop: 6 },
  catalogState: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.screen, marginVertical: Spacing.xs },
  sectionLabel: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: 2 },
  intercityChoices: { paddingHorizontal: Spacing.screen, gap: Spacing.sm },
  marketplaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.primaryBg,
  },
  marketplaceCardDisabled: { borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  marketplaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  marketplaceIconDisabled: { backgroundColor: Colors.gray200 },
});
