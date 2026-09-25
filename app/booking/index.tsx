// app/booking/index.tsx — GH 1.1 / VT 1.1: bản đồ toàn màn + bottom sheet chọn dịch vụ (Siêu tốc / Siêu rẻ / Đồng giá 25k)
// + lộ trình (người gửi → các điểm giao) → "Xác nhận". Param: service=delivery|transport|rental
// Chưa đủ điểm đón + điểm đến (maxStops > 0) → CHƯA hiện danh sách dịch vụ, chỉ hiện lộ trình để nhập.
// Đủ lộ trình rồi mới hiện dịch vụ kèm giá thật. Xe máy / Xe hơi: danh sách luôn hiện đủ các gói của dịch vụ
// đang chọn (không thu gọn về 1 dòng); tab đổi dịch vụ ngay trong màn; "Tất cả dịch vụ" gộp thêm gói dịch vụ kia.
// Xe đường dài: điểm đến khớp 1 tỉnh/thành đang có tuyến → chỉ hiện chuyến ghép của tỉnh đó (+ vẫn có xe riêng
// bên dưới); không khớp → gợi ý tỉnh/bến xe gần nhất đang phục vụ để khách đổi điểm đến hoặc đặt xe riêng.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText, Chip, Icon, Icons, ServiceOption } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import {
  SERVICE_GROUPS,
  URBAN_RIDE_KEYS,
  toServiceKey,
  matchIntercityCity,
  suggestNearestCity,
  tripsForCity,
  type IntercityCity,
  type ServiceKey,
  type ServiceOptionDef,
} from '@/constants/mockBooking';
import {
  useBooking,
  startBooking,
  hydrateSender,
  prefillRoute,
  switchRideOption,
  addReceiver,
  removeReceiver,
  setReceiverPlace,
  pruneIncompleteReceivers,
  isReceiverComplete,
  computePrice,
  formatVnd,
  applyGpsToDefaultPlace,
} from '@/services/bookingStore';
import { BookingMap, RoundIconButton, StopList, ServiceInfoDialog, FlatFooter, useCurrentLocation, type MapStop } from '@/components/booking';

/** Option kèm nhóm dịch vụ gốc — cần khi "Tất cả dịch vụ" gộp thêm gói của dịch vụ liên quan (vd Xe máy ⇄ Xe hơi) */
type RowOption = ServiceOptionDef & { groupKey: ServiceKey };

export default function BookingScreen() {
  const { service, from, to } = useLocalSearchParams<{ service?: string; from?: string; to?: string }>();
  const serviceKey = toServiceKey(service);
  const state = useBooking();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const location = useCurrentLocation();
  const [expanded, setExpanded] = useState(false);
  const [info, setInfo] = useState<RowOption | null>(null);
  const [sheetH, setSheetH] = useState(0);

  useEffect(() => {
    startBooking(serviceKey);
    // Từ gợi ý / hoạt động gần đây trên Home: điền sẵn điểm đón & điểm đến
    if (from || to) prefillRoute(from, to);
    void hydrateSender().then(() => {
      // tên/SĐT người đi vừa được điền → đồng bộ sang điểm đến đã điền sẵn (chở khách)
      if (to) prefillRoute(undefined, to);
    });
  }, [serviceKey, from, to]);

  useEffect(() => {
    if (location) applyGpsToDefaultPlace(location.latitude, location.longitude);
  }, [location]);

  // Quay lại màn này: bỏ các người nhận điền dở
  useFocusEffect(
    useCallback(() => {
      pruneIncompleteReceivers();
    }, []),
  );

  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const complete = state.receivers.filter(isReceiverComplete);
  const senderReady = !!state.sender.place && !!state.sender.name && !!state.sender.phone;
  // Gọi thợ / thuê nhân công (maxStops=0) không có điểm đến riêng → tính giá được ngay; còn lại cần chọn xong điểm đến.
  const hasDestination = group.maxStops === 0 || complete.length > 0;
  const canConfirm = senderReady && hasDestination;

  // Xe máy ⇄ Xe hơi: tab đổi dịch vụ ngay trong màn, giữ nguyên điểm đón/điểm đến (xem URBAN_RIDE_KEYS)
  const tabKeys = URBAN_RIDE_KEYS.includes(state.service) ? URBAN_RIDE_KEYS : null;
  // Mặc định: hiện đủ các gói của dịch vụ đang chọn. "Tất cả dịch vụ": gộp thêm gói của dịch vụ liên quan (nếu có tab).
  const baseOptions: RowOption[] =
    expanded && tabKeys
      ? tabKeys.flatMap((k) => SERVICE_GROUPS[k].options.map((o) => ({ ...o, groupKey: k })))
      : group.options.map((o) => ({ ...o, groupKey: state.service }));

  // Xe đường dài: điểm đến khớp tỉnh/thành nào thì chỉ hiện chuyến ghép của tỉnh đó (id "ghep-*"); không khớp → ẩn hết.
  const isIntercity = state.service === 'intercity';
  const destPlace = complete[0]?.place ?? null;
  const matchedCity = isIntercity && destPlace ? matchIntercityCity(`${destPlace.title} ${destPlace.address}`) : null;
  const allowedTripIds = useMemo(() => new Set((matchedCity ? tripsForCity(matchedCity.id) : []).map((t) => t.id)), [matchedCity]);
  const options: RowOption[] = isIntercity ? baseOptions.filter((o) => !o.id.startsWith('ghep-') || allowedTripIds.has(o.id)) : baseOptions;
  const selected = options.find((o) => o.id === state.optionId) ?? options[0]!;
  const nearestCity = isIntercity && hasDestination && !matchedCity ? suggestNearestCity() : null;

  // Điểm đến đổi khiến chuyến ghép đang chọn không còn hợp lệ → tự chuyển về gói đầu danh sách hiện tại
  const optionIds = options.map((o) => o.id).join('|');
  useEffect(() => {
    if (!isIntercity || !hasDestination) return;
    if (!options.some((o) => o.id === state.optionId)) {
      switchRideOption(state.service, options[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntercity, hasDestination, optionIds, state.service]);

  const stops = useMemo<MapStop[]>(() => {
    const list: MapStop[] = [];
    const p = state.sender.place;
    if (p) list.push({ id: 'pickup', lat: p.lat, lng: p.lng, type: 'pickup', label: labels.mapPickupLabel });
    state.receivers.filter(isReceiverComplete).forEach((r, i) => {
      list.push({ id: `drop-${r.id}`, lat: r.place!.lat, lng: r.place!.lng, type: 'dropoff', label: group.maxStops > 1 ? `${labels.mapDropLabel} ${i + 1}` : labels.mapDropLabel });
    });
    return list;
  }, [state.sender.place, state.receivers, labels, group.maxStops]);

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
    switchRideOption(key, SERVICE_GROUPS[key].options[0]!.id);
  };
  const onOptionPress = (o: RowOption) => {
    switchRideOption(o.groupKey, o.id);
    setExpanded(false);
  };
  const useSuggestedCity = (city: IntercityCity) => {
    setReceiverPlace(0, { title: city.name, address: `${city.station.name}, ${city.station.address}`, lat: city.station.lat, lng: city.station.lng, placeId: city.id, source: 'search' });
  };
  const renderOption = (o: RowOption) => (
    <ServiceOption
      key={o.id}
      name={o.name}
      description={o.description}
      price={formatVnd(computePrice(state, o.id).total)}
      icon={o.icon}
      selected={o.id === selected.id}
      onPress={() => onOptionPress(o)}
      onInfoPress={() => setInfo(o)}
    />
  );

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} bottomPadding={sheetH} />
      <RoundIconButton icon={Icons.back} onPress={goBack} style={[styles.back, { top: insets.top + Spacing.md }]} accessibilityLabel="Quay lại" />

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        {hasDestination ? (
          <>
            <Pressable onPress={() => setExpanded((v) => !v)} style={styles.handle} accessibilityLabel={expanded ? 'Thu gọn' : 'Tất cả dịch vụ'}>
              <Icon name="ion:swap-vertical" size={12} color={Colors.textMuted} />
              <AppText size={11} color={Colors.textMuted} style={{ marginLeft: 4 }}>
                {expanded ? 'Thu gọn' : 'Tất cả dịch vụ'}
              </AppText>
            </Pressable>

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
              Nhập điểm đón và {labels.mapDropLabel.toLowerCase()}
            </AppText>
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Dịch vụ và giá sẽ hiện ra sau khi có đủ lộ trình
            </AppText>
          </View>
        )}

        <ScrollView style={{ maxHeight: height * 0.58 }} contentContainerStyle={{ paddingBottom: Spacing.sm }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {hasDestination ? (
            <>
              {nearestCity ? (
                <View style={styles.suggestCard}>
                  <Icon name={Icons.infoOutline} size={18} color={Colors.primary} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText size={13} weight="bold" color={Colors.text}>
                      Chưa có xe ghép tới địa điểm này
                    </AppText>
                    <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                      Gợi ý: {nearestCity.name} ({nearestCity.region}) · cách khoảng {nearestCity.distanceKm}km · {nearestCity.station.name}
                    </AppText>
                    <Pressable onPress={() => useSuggestedCity(nearestCity)} hitSlop={6} style={{ marginTop: 6 }}>
                      <AppText size={13} weight="bold" color={Colors.primary}>
                        Đổi điểm đến sang {nearestCity.name}
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {isIntercity && matchedCity ? (
                <>
                  <View style={styles.sectionLabel}>
                    <AppText size={12} weight="semiBold" color={Colors.textSecondary}>
                      Xe ghép tới {matchedCity.name}
                    </AppText>
                  </View>
                  <View style={styles.options}>{options.filter((o) => o.id.startsWith('ghep-')).map(renderOption)}</View>
                  <View style={styles.sectionLabel}>
                    <AppText size={12} weight="semiBold" color={Colors.textSecondary}>
                      Đặt xe riêng, không ghép
                    </AppText>
                  </View>
                  <View style={styles.options}>{options.filter((o) => !o.id.startsWith('ghep-')).map(renderOption)}</View>
                </>
              ) : (
                <View style={styles.options}>{options.map(renderOption)}</View>
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
            maxStops={group.maxStops}
          />
        </ScrollView>

        <FlatFooter title={canConfirm ? 'Xác nhận' : labels.confirmHint} disabled={!canConfirm} onPress={() => router.push('/booking/confirm')} />
      </View>

      <ServiceInfoDialog
        option={info}
        onClose={() => setInfo(null)}
        onSelect={(o) => {
          switchRideOption((o as RowOption).groupKey, o.id);
          setInfo(null);
          setExpanded(false);
        }}
      />
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
  introRow: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  tabs: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
  tab: { flex: 1, justifyContent: 'center' },
  options: { paddingHorizontal: Spacing.screen, gap: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.screen, marginVertical: Spacing.xs },
  sectionLabel: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: 2 },
  suggestCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryBg,
  },
});
