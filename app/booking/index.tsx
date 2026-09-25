// app/booking/index.tsx — GH 1.1 / VT 1.1: bản đồ toàn màn + bottom sheet chọn dịch vụ (Siêu tốc / Siêu rẻ / Đồng giá 25k)
// + lộ trình (người gửi → các điểm giao) → "Xác nhận". Param: service=delivery|transport|rental
// Chưa đủ điểm đón + điểm đến (maxStops > 0) → CHƯA hiện danh sách dịch vụ, chỉ hiện lộ trình để nhập.
// Đủ lộ trình rồi mới hiện dịch vụ kèm giá thật. Xe máy / Xe hơi: danh sách luôn hiện đủ các gói của dịch vụ
// đang chọn (không thu gọn về 1 dòng); tab đổi dịch vụ ngay trong màn; "Tất cả dịch vụ" gộp thêm gói dịch vụ kia.
// Xe đường dài: điểm đến xong → hiện thẳng 3 phương án đi (Thuê cả xe / Xe ghép / Mua vé xe) ngay trên màn
// này (không cần qua màn trung gian) — Mua vé xe chỉ bật khi điểm đến khớp 1 tỉnh/thành đang có nhà xe chạy,
// không khớp thì gợi ý tỉnh/bến xe gần nhất đang phục vụ.
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

  // Xe đường dài: sau khi có điểm đến, hiện thẳng 3 phương án đi ngay trên màn này (không hiện danh sách hạng xe).
  const isIntercity = state.service === 'intercity';
  const destPlace = complete[0]?.place ?? null;
  const matchedCity = isIntercity && destPlace ? matchIntercityCity(`${destPlace.title} ${destPlace.address}`) : null;
  const nearestCity = isIntercity && hasDestination && !matchedCity ? suggestNearestCity() : null;
  const options: RowOption[] = baseOptions;
  const selected = options.find((o) => o.id === state.optionId) ?? options[0]!;

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

  // Xe đường dài: 3 phương án đi, bấm vào là đi thẳng — không có bước "chọn rồi xác nhận" riêng.
  const openCharter = () => router.push('/booking/intercity/charter');
  const openCarpool = () =>
    router.push({
      pathname: '/booking/intercity/carpool-request',
      params: matchedCity ? { cityId: matchedCity.id, cityName: matchedCity.name, destinationLabel: destPlace?.title ?? '' } : { destinationLabel: destPlace?.title ?? '' },
    });
  const openTickets = () => {
    if (!matchedCity) return;
    router.push({ pathname: '/booking/intercity/[cityId]', params: { cityId: matchedCity.id } });
  };

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

                  <Pressable onPress={openCarpool} style={styles.marketplaceCard}>
                    <View style={styles.marketplaceIcon}>
                      <Icon name="mci:car-multiple" size={22} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText size={14} weight="bold" color={Colors.text}>
                        Xe ghép
                      </AppText>
                      <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                        Chọn số chỗ, thời gian — gửi yêu cầu để tài xế nhận cuốc
                      </AppText>
                    </View>
                    <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} />
                  </Pressable>

                  <Pressable onPress={openTickets} disabled={!matchedCity} style={[styles.marketplaceCard, !matchedCity && styles.marketplaceCardDisabled]}>
                    <View style={[styles.marketplaceIcon, !matchedCity && styles.marketplaceIconDisabled]}>
                      <Icon name="mci:bus" size={22} color={matchedCity ? Colors.white : Colors.gray400} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText size={14} weight="bold" color={matchedCity ? Colors.text : Colors.textSecondary}>
                        Mua vé xe
                      </AppText>
                      <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                        {matchedCity ? 'Chọn nhà xe, chuyến, ghế ngồi, vé điện tử' : `Chưa có nhà xe tới đây · gần nhất ${nearestCity?.name} (${nearestCity?.distanceKm}km)`}
                      </AppText>
                    </View>
                    {matchedCity ? <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} /> : null}
                  </Pressable>
                </View>
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

        {isIntercity && hasDestination ? null : (
          <FlatFooter title={canConfirm ? 'Xác nhận' : labels.confirmHint} disabled={!canConfirm} onPress={() => router.push('/booking/confirm')} />
        )}
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
