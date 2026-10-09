// app/booking/index.tsx — GH 1.1 / VT 1.1: bản đồ toàn màn + bottom sheet chọn dịch vụ + lộ trình → "Xác nhận".
// Params: service=<nhóm catalog>, reorder=<orderId> (đặt lại từ đơn cũ: điền sẵn điểm đón/điểm đến thật của đơn).
// Danh sách dịch vụ lấy từ catalog API (GET /v1/public/catalog) theo nhóm; giá trên danh sách là ước tính "~"
// theo bảng giá catalog — giá thật do server báo ở màn xác nhận. Chưa đủ điểm đón + điểm đến → chỉ hiện lộ trình.
// Xe máy / Xe hơi: tab đổi qua lại ngay trong màn; "Tất cả dịch vụ" gộp gói của cả 2.
// Xe đường dài: điểm đến xong → 3 phương án: Thuê cả xe (đơn thường) / Xe ghép & Mua vé xe (chuyến bán theo ghế,
// chỉ bật khi điểm đến khớp 1 tỉnh/thành đang bán vé — không khớp thì gợi ý bến xe gần nhất).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText, Chip, Icon, Icons, ServiceOption, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS, URBAN_RIDE_KEYS, toServiceKey } from '@/constants/booking';
import {
  useBooking,
  startBooking,
  syncOptionWithCatalog,
  hydrateSender,
  prefillRoute,
  switchRideOption,
  selectLaborOption,
  setOptions,
  addReceiver,
  removeReceiver,
  pruneIncompleteReceivers,
  completeReceivers,
  maxStopsOf,
  estimateFor,
  formatVnd,
  pickupFromGps,
  refreshQuote,
  buildQuoteRequest,
  type Place,
} from '@/services/bookingStore';
import { decodePolyline } from '@/components/map/polyline';
import { ensureCatalog, optionsFor, useCatalog, type ServiceOptionView } from '@/services/catalog';
import { ensureIntercityCities, matchIntercityCity, nearestCity, useIntercityCities } from '@/services/intercity';
import { getOrder } from '@/services/orders';
import { errorMessage } from '@/services/zuum';
import { BookingMap, RoundIconButton, StopList, ServiceInfoDialog, HandymanJobDialog, FlatFooter, useCurrentLocation, type MapStop, type HandymanJobDetail } from '@/components/booking';

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
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    if (p) list.push({ id: 'pickup', lat: p.lat, lng: p.lng, type: 'pickup', label: labels.mapPickupLabel });
    complete.forEach((r, i) => {
      list.push({ id: `drop-${r.id}`, lat: r.place!.lat, lng: r.place!.lng, type: 'dropoff', label: maxStops > 1 ? `${labels.mapDropLabel} ${i + 1}` : labels.mapDropLabel });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sender.place, state.receivers, labels, maxStops]);

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
  const routePath = useMemo(() => {
    const q = state.quote;
    return q.status === 'ready' && q.key === quoteKey && q.quote?.routePolyline ? decodePolyline(q.quote.routePolyline) : null;
  }, [state.quote, quoteKey]);

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
  const renderOption = (o: ServiceOptionView) => (
    <ServiceOption
      key={o.id}
      name={o.name}
      description={o.description}
      price={o.paused ? undefined : `~${formatVnd(estimateFor(o, state))}`}
      priceHint={o.paused ? 'Tạm ngưng' : undefined}
      icon={o.icon}
      selected={o.id === selected?.id}
      onPress={() => onOptionPress(o)}
      onInfoPress={() => (state.service === 'handyman' ? setJobOption(o) : setInfo(o))}
    />
  );

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

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} routePath={routePath} bottomPadding={sheetH} />
      <RoundIconButton icon={Icons.back} onPress={goBack} style={[styles.back, { top: insets.top + Spacing.md }]} accessibilityLabel="Quay lại" />

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

                  {(['carpool', 'bus'] as const).map((kind) => (
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
                <View style={styles.options}>{catalogBlock ?? options.map(renderOption)}</View>
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
            ? { issueNote: state.options.handymanIssueNote, urgent: state.options.handymanUrgent }
            : { issueNote: '', urgent: false }
        }
        onClose={() => setJobOption(null)}
        onSelect={(o, detail: HandymanJobDetail) => {
          switchRideOption(o.group, o.id);
          setOptions({ handymanIssueNote: detail.issueNote, handymanUrgent: detail.urgent });
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
