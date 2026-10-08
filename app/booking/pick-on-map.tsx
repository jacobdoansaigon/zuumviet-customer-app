// app/booking/pick-on-map.tsx — "Chọn trên bản đồ": kéo bản đồ để ghim đúng vị trí (native: bản đồ tương tác thật,
// tâm khung hình là vị trí đang chọn; web: bản đồ xem trước). Toạ độ ghim → địa chỉ chữ qua API
// (GET /v1/customer/places/reverse) — toạ độ giữ nguyên như ghim, không "hút" về địa điểm mẫu.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Icon, Icons } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { HCM_CENTER, SERVICE_GROUPS } from '@/constants/booking';
import { useBooking, setSenderPlace, setReceiverPlace, type Place } from '@/services/bookingStore';
import { reversePlace, type PlaceDetail } from '@/services/places';
import { destinationCities, getIntercityCities } from '@/services/intercity';
import { errorMessage } from '@/services/zuum';
import { BookingMap, RoundIconButton, FlatFooter, type MapStop } from '@/components/booking';

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
      const c = destinationCities(getIntercityCities())[0];
      if (c) return { lat: c.stationLat, lng: c.stationLng };
    }
    const origin = state.sender.place ?? HCM_CENTER;
    return { lat: origin.lat, lng: origin.lng };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pin, setPin] = useState(initialPin);
  const [resolved, setResolved] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const insets = useSafeAreaInsets();
  const seq = useRef(0);

  // Kéo bản đồ dừng 400ms → đổi toạ độ ghim ra địa chỉ
  useEffect(() => {
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      reversePlace(pin.lat, pin.lng)
        .then((p) => {
          if (my === seq.current) setResolved(p);
        })
        .catch((e) => {
          if (my !== seq.current) return;
          setResolved(null);
          setError(errorMessage(e, 'Không xác định được địa chỉ tại vị trí này'));
        })
        .finally(() => {
          if (my === seq.current) setLoading(false);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [pin, retryKey]);

  const stops = useMemo<MapStop[]>(
    () => [{ id: 'pin', lat: pin.lat, lng: pin.lng, type: isReceiver ? 'dropoff' : 'pickup', label: isReceiver ? labels.mapDropLabel : labels.mapPickupLabel }],
    [pin, isReceiver, labels],
  );

  const close = () => router.back();

  const confirm = () => {
    if (!resolved || loading) return;
    const place: Place = { title: resolved.name ?? 'Vị trí trên bản đồ', address: resolved.address, lat: pin.lat, lng: pin.lng, placeId: resolved.placeId, source: 'map' };
    // "Chọn trên bản đồ" luôn được mở từ màn Nhập địa chỉ → đóng luôn cả 2 màn để về đúng chỗ đã mở
    if (isReceiver) {
      setReceiverPlace(index, place);
      if (back === '1' || group.kind !== 'delivery') {
        if (router.canDismiss()) router.dismiss(2);
        else router.back();
      } else {
        // Giao hàng: cần điền tên/SĐT người nhận → đóng màn bản đồ rồi thay màn nhập địa chỉ bằng màn đó
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
            <AppText size={15} weight="bold" numberOfLines={1}>
              {resolved?.name ?? 'Vị trí trên bản đồ'}
            </AppText>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }}>
                  Đang xác định địa chỉ...
                </AppText>
              </View>
            ) : error ? (
              <Pressable onPress={() => setRetryKey((k) => k + 1)} hitSlop={6}>
                <AppText size={13} color={Colors.error} numberOfLines={2}>
                  {error} — chạm để thử lại
                </AppText>
              </Pressable>
            ) : (
              <AppText size={13} color={Colors.textSecondary} numberOfLines={2}>
                {resolved?.address ?? ''}
              </AppText>
            )}
          </View>
        </View>
        <AppText size={11} color={Colors.textMuted} style={styles.hint}>
          Trên ứng dụng di động: kéo bản đồ để tinh chỉnh đúng vị trí — ghim luôn ở giữa khung hình
        </AppText>
        <FlatFooter title="Chọn vị trí này" disabled={!resolved || loading} onPress={confirm} />
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
