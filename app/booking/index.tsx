// app/booking/index.tsx — GH 1.1 / VT 1.1: bản đồ toàn màn + bottom sheet chọn dịch vụ (Siêu tốc / Siêu rẻ / Đồng giá 25k)
// + lộ trình (người gửi → các điểm giao) → "Xác nhận". Param: service=delivery|transport|rental
// Xe máy / Xe hơi: danh sách luôn hiện đủ các gói của dịch vụ đang chọn (không thu gọn về 1 dòng);
// tab đổi dịch vụ ngay trong màn (giữ nguyên điểm đón/điểm đến); "Tất cả dịch vụ" gộp thêm gói của dịch vụ kia.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText, Chip, Icon, Icons, ServiceOption } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS, URBAN_RIDE_KEYS, toServiceKey, type ServiceKey, type ServiceOptionDef } from '@/constants/mockBooking';
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
  const options: RowOption[] =
    expanded && tabKeys
      ? tabKeys.flatMap((k) => SERVICE_GROUPS[k].options.map((o) => ({ ...o, groupKey: k })))
      : group.options.map((o) => ({ ...o, groupKey: state.service }));
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

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} bottomPadding={sheetH} />
      <RoundIconButton icon={Icons.back} onPress={goBack} style={[styles.back, { top: insets.top + Spacing.md }]} accessibilityLabel="Quay lại" />

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
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

        <ScrollView style={{ maxHeight: height * 0.58 }} contentContainerStyle={{ paddingBottom: Spacing.sm }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.options}>
            {options.map((o) => (
              <ServiceOption
                key={o.id}
                name={o.name}
                description={o.description}
                price={hasDestination ? formatVnd(computePrice(state, o.id).total) : undefined}
                priceHint={hasDestination ? undefined : 'Chọn điểm đến'}
                icon={o.icon}
                selected={o.id === selected.id}
                onPress={() => onOptionPress(o)}
                onInfoPress={() => setInfo(o)}
              />
            ))}
          </View>
          <View style={styles.divider} />
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
  tabs: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
  tab: { flex: 1, justifyContent: 'center' },
  options: { paddingHorizontal: Spacing.screen, gap: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: Spacing.screen, marginVertical: Spacing.xs },
});
