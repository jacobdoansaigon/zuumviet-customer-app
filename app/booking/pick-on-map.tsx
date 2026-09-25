// app/booking/pick-on-map.tsx — "Chọn trên bản đồ": kéo bản đồ để ghim đúng vị trí (native: bản đồ tương
// tác thật, kéo tới đâu tâm khung hình là vị trí đang chọn; web: xem trước vị trí + xác nhận, bản đồ tương
// tác chỉ chạy trên ứng dụng di động — đồng nhất với mọi màn bản đồ khác trong app). Dùng chung cho mọi dịch
// vụ (Đặt xe, Giao hàng, Xe đường dài...) giống hệt nút "Chọn trên bản đồ" ở màn Nhập địa chỉ.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Icon, Icons } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SAMPLE_PLACES, HCM_CENTER, SERVICE_GROUPS, INTERCITY_CITIES, type SamplePlace } from '@/constants/mockBooking';
import { useBooking, setSenderPlace, setReceiverPlace, haversineKm, type Place } from '@/services/bookingStore';
import { suggestNearestCity } from '@/constants/mockIntercity';
import { BookingMap, RoundIconButton, FlatFooter, type MapStop } from '@/components/booking';

const cityAsPlace = (c: (typeof INTERCITY_CITIES)[number]): SamplePlace => ({
  id: c.id,
  title: c.name,
  address: `${c.station.name}, ${c.station.address}`,
  lat: c.station.lat,
  lng: c.station.lng,
});

export default function PickOnMapScreen() {
  const { target, index: indexParam, back } = useLocalSearchParams<{ target?: string; index?: string; back?: string }>();
  const isReceiver = target === 'receiver';
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isIntercityDest = isReceiver && state.service === 'intercity';
  const current = isReceiver ? state.receivers[index]?.place : state.sender.place;

  const initialPin = useMemo(() => {
    if (current) return { lat: current.lat, lng: current.lng };
    if (isIntercityDest) {
      const c = suggestNearestCity();
      return { lat: c.station.lat, lng: c.station.lng };
    }
    const origin = state.sender.place ?? HCM_CENTER;
    return { lat: origin.lat, lng: origin.lng };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pin, setPin] = useState(initialPin);
  const [sheetH, setSheetH] = useState(0);
  const insets = useSafeAreaInsets();

  const pool = useMemo<SamplePlace[]>(() => (isIntercityDest ? INTERCITY_CITIES.map(cityAsPlace) : SAMPLE_PLACES), [isIntercityDest]);
  const nearest = useMemo(() => {
    let best: (SamplePlace & { km: number }) | null = null;
    for (const p of pool) {
      const km = haversineKm(pin, p);
      if (!best || km < best.km) best = { ...p, km };
    }
    return best;
  }, [pin, pool]);

  const stops = useMemo<MapStop[]>(
    () => [{ id: 'pin', lat: pin.lat, lng: pin.lng, type: isReceiver ? 'dropoff' : 'pickup', label: isReceiver ? labels.mapDropLabel : labels.mapPickupLabel }],
    [pin, isReceiver, labels],
  );

  const close = () => router.back();

  const confirm = () => {
    const place: Place = {
      title: 'Vị trí trên bản đồ',
      address: nearest ? `Gần ${nearest.title}, ${nearest.address}` : `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
      lat: pin.lat,
      lng: pin.lng,
      source: 'search',
    };
    // "Chọn trên bản đồ" luôn được mở từ màn Nhập địa chỉ (thêm 1 cấp so với chỗ location.tsx tự finish) →
    // đóng luôn cả 2 màn (bản đồ + nhập địa chỉ) để về đúng chỗ đã mở, thay vì chỉ lùi lại màn nhập địa chỉ.
    if (isReceiver) {
      setReceiverPlace(index, place);
      if (back === '1' || group.kind !== 'delivery') {
        if (router.canDismiss()) router.dismiss(2);
        else router.back();
      } else {
        // Giao hàng, chưa có back=1: cần điền tên/SĐT người nhận → đóng màn bản đồ rồi thay màn nhập địa chỉ bằng màn đó
        router.dismiss(1);
        router.replace({ pathname: '/booking/receiver', params: { index: String(index) } });
      }
    } else {
      setSenderPlace(place);
      if (router.canDismiss()) router.dismiss(2);
      else router.back();
    }
  };

  return (
    <View style={styles.root}>
      <BookingMap stops={stops} center={pin} bottomPadding={sheetH} onRegionChangeComplete={setPin} />
      <RoundIconButton icon={Icons.close} onPress={close} style={[styles.close, { top: insets.top + Spacing.md }]} accessibilityLabel="Đóng" />

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <View style={styles.pinRow}>
          <Icon name={Icons.locationFilled} size={22} color={Colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <AppText size={15} weight="bold">
              Vị trí trên bản đồ
            </AppText>
            <AppText size={13} color={Colors.textSecondary} numberOfLines={2}>
              {nearest ? `Gần ${nearest.title} · cách khoảng ${nearest.km.toFixed(1)}km` : `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
            </AppText>
          </View>
        </View>
        <AppText size={11} color={Colors.textMuted} style={styles.hint}>
          Trên ứng dụng di động: kéo bản đồ để tinh chỉnh đúng vị trí — ghim luôn ở giữa khung hình
        </AppText>
        <FlatFooter title="Chọn vị trí này" onPress={confirm} />
      </View>
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
  pinRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.screen, paddingTop: Spacing.md },
  hint: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
});
