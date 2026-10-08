// app/booking/intercity/bus/[id].tsx — Chi tiết chuyến (vé xe hoặc xe ghép): nhà xe / tài xế, giờ đi–đến, xe, tiện ích,
// phụ phí (hàng gửi, đón/trả tận nơi) và sơ đồ ghế thật (GET /v1/public/intercity/trips/:id) → "Giữ chỗ" (POST holds,
// giữ 10 phút) → màn điền thông tin & thanh toán. Ghế vừa bị người khác lấy (409 intercity.seats_taken) → đánh dấu
// đúng các ghế đó, bỏ khỏi lựa chọn và tải lại sơ đồ. Mỗi lần quay lại màn này (vd từ màn thanh toán — đã trả ghế) sơ
// đồ được tải lại; khách còn đang giữ chỗ trên chuyến → hiện "Tiếp tục đặt vé" thay vì giữ thêm lần nữa.
import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, Chip, EmptyState, Icon, Icons, Screen, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SeatPicker } from '@/components/booking';
import {
  durationLabel,
  findActiveHold,
  getTrip,
  holdSeats,
  settleHoldRelease,
  TRIP_KIND_LABEL,
  vnDateLabel,
  vnTime,
  type IntercityTripDetail,
} from '@/services/intercity';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage, isApiError } from '@/services/zuum';

const MAX_SEATS = 6;

type ActiveHold = NonNullable<Awaited<ReturnType<typeof findActiveHold>>>;

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = String(id ?? '');
  const [trip, setTrip] = useState<IntercityTripDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deck, setDeck] = useState(1);
  const [lostSeats, setLostSeats] = useState<string[]>([]);
  const [holding, setHolding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [myHold, setMyHold] = useState<ActiveHold | null>(null);

  const load = useCallback(async () => {
    try {
      await settleHoldRelease(); // vừa rời màn thanh toán → chờ trả ghế xong mới đọc sơ đồ
      void findActiveHold(tripId)
        .then(setMyHold)
        .catch(() => setMyHold(null));
      const t = await getTrip(tripId);
      setTrip(t);
      setLoadError(null);
      // ghế đang chọn mà vừa có người lấy → bỏ chọn
      setSelected((cur) => cur.filter((s) => !t.seats.find((x) => x.id === s)?.taken));
    } catch (e) {
      setLoadError(errorMessage(e, 'Không tải được chuyến'));
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      setLostSeats([]);
      void load();
    }, [load]),
  );

  const decks = useMemo(() => Array.from(new Set((trip?.seats ?? []).map((s) => s.deck))).sort(), [trip]);
  const seats = useMemo(
    () => (trip?.seats ?? []).filter((s) => s.deck === deck).map((s) => ({ ...s, taken: s.taken || lostSeats.includes(s.id) })),
    [trip, deck, lostSeats],
  );

  if (!trip) {
    return (
      <Screen header={<AppHeader title="Chi tiết chuyến xe" variant="dark" left="arrow" />}>
        {loadError ? (
          <EmptyState icon="mci:bus" title={loadError} actionLabel="Quay lại" onAction={() => router.back()} />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </Screen>
    );
  }

  const toggle = (seatId: string) => {
    setSelected((cur) => (cur.includes(seatId) ? cur.filter((s) => s !== seatId) : cur.length < MAX_SEATS ? [...cur, seatId] : cur));
  };

  const continueHold = (bookingId: string) => router.push({ pathname: '/booking/intercity/checkout/[bookingId]', params: { bookingId } });

  const hold = async () => {
    if (!selected.length || holding) return;
    setHolding(true);
    try {
      const booking = await holdSeats(trip.id, selected);
      continueHold(booking.id); // giữ nguyên lựa chọn: quay lại (ghế đã được trả) thì ghế vẫn đang chọn
    } catch (e) {
      if (isApiError(e, 'intercity.seats_taken')) {
        const taken = e.details?.seats ?? [];
        setLostSeats((cur) => [...new Set([...cur, ...taken])]);
        setSelected((cur) => cur.filter((s) => !taken.includes(s)));
        void load();
      }
      if (isApiError(e, 'intercity.seats_taken', 'intercity.too_many_holds')) {
        const mine = await findActiveHold(trip.id).catch(() => null);
        if (mine) {
          setMyHold(mine);
          setToast(`Bạn đang giữ ghế ${mine.seatIds.join(', ')} trên chuyến này — bấm "Tiếp tục đặt vé" để hoàn tất`);
          return;
        }
      }
      setToast(errorMessage(e, 'Không giữ được ghế, vui lòng thử lại'));
    } finally {
      setHolding(false);
    }
  };

  const seatTotal = trip.pricePerSeat * Math.max(1, selected.length);
  const v = trip.vehicle;

  return (
    <Screen
      header={<AppHeader title="Chi tiết chuyến xe" variant="dark" left="arrow" />}
      scroll
      footer={
        <Button
          title={!trip.onSale ? 'Chuyến đã đóng bán' : selected.length ? `Giữ ${selected.length} ghế · ${formatVnd(seatTotal)}` : 'Chọn ghế để tiếp tục'}
          disabled={!trip.onSale || !selected.length}
          loading={holding}
          onPress={() => void hold()}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.operatorCard}>
          <View style={styles.operatorLogo}>
            <Icon name={trip.kind === 'bus' ? 'mci:bus' : 'mci:car-side'} size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <AppText size={16} weight="bold">
              {trip.operator.name}
            </AppText>
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {TRIP_KIND_LABEL[trip.kind]}
              {[v.name, v.color, v.plate].filter(Boolean).length ? ` · ${[v.name, v.color, v.plate].filter(Boolean).join(' · ')}` : ''}
            </AppText>
          </View>
        </View>

        <View style={styles.routeCard}>
          <Icon name={Icons.calendar} size={16} color={Colors.primary} />
          <AppText size={13} weight="semiBold" color={Colors.text} style={{ marginLeft: 6, flex: 1 }}>
            {vnDateLabel(trip.departAt)} · {vnTime(trip.departAt)} → {vnTime(trip.arriveAt)} ({durationLabel(trip.departAt, trip.arriveAt)})
          </AppText>
        </View>
        <AppText size={13} color={Colors.textSecondary}>
          Đón: {trip.from.station} — {trip.from.address}
        </AppText>
        <AppText size={13} color={Colors.textSecondary}>
          Trả: {trip.to.station} — {trip.to.address}
        </AppText>

        {myHold ? (
          <Pressable style={styles.holdBanner} onPress={() => continueHold(myHold.id)}>
            <Icon name={Icons.clock} size={18} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <AppText size={13} weight="semiBold" color={Colors.primary}>
                Bạn đang giữ ghế {myHold.seatIds.join(', ')} đến {myHold.heldUntil ? vnTime(myHold.heldUntil) : ''}
              </AppText>
              <AppText size={12} color={Colors.textSecondary}>
                Tiếp tục đặt vé
              </AppText>
            </View>
            <Icon name={Icons.chevronRight} size={18} color={Colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText size={15} weight="bold">
            Chọn ghế (tối đa {MAX_SEATS}) · còn {trip.seatsAvailable} chỗ
          </AppText>
        </View>
        {decks.length > 1 ? (
          <View style={styles.deckRow}>
            {decks.map((d) => (
              <Chip key={d} label={d === 1 ? 'Tầng dưới' : 'Tầng trên'} active={deck === d} size="sm" onPress={() => setDeck(d)} />
            ))}
          </View>
        ) : null}
        <SeatPicker seats={seats} selected={selected} onToggle={(s) => toggle(s.id)} max={MAX_SEATS} />

        {trip.amenities.length ? (
          <>
            <AppText size={15} weight="bold" style={styles.sectionTitle}>
              Dịch vụ trên xe
            </AppText>
            <View style={styles.amenityWrap}>
              {trip.amenities.map((a) => (
                <View key={a} style={styles.amenityTag}>
                  <Icon name={Icons.checkCircle} size={14} color={Colors.success} />
                  <AppText size={13} color={Colors.text} style={{ marginLeft: 4 }}>
                    {a}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Phụ phí tuỳ chọn
        </AppText>
        <FeeRow label="Gửi kèm hàng hoá" fee={trip.cargoFee} />
        <FeeRow label="Đón tận nơi" fee={trip.homePickupFee} />
        <FeeRow label="Trả tận nơi" fee={trip.homeDropoffFee} />
        <AppText size={12} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
          Chọn ở bước tiếp theo, sau khi giữ ghế. Ghế được giữ trong 10 phút.
        </AppText>
        {trip.note ? (
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
            Ghi chú nhà xe: {trip.note}
          </AppText>
        ) : null}
      </View>
      <Toast visible={!!toast} message={toast ?? ''} tone="error" onHide={() => setToast(null)} />
    </Screen>
  );
}

const FeeRow: React.FC<{ label: string; fee: number | null }> = ({ label, fee }) => (
  <View style={styles.feeRow}>
    <Icon name={fee == null ? Icons.closeCircle : Icons.checkCircle} size={16} color={fee == null ? Colors.textMuted : Colors.success} />
    <AppText size={13} color={fee == null ? Colors.textMuted : Colors.text} style={{ marginLeft: 6, flex: 1 }}>
      {label}
    </AppText>
    <AppText size={13} color={fee == null ? Colors.textMuted : Colors.text}>
      {fee == null ? 'Không hỗ trợ' : fee > 0 ? `+${formatVnd(fee)}` : 'Miễn phí'}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.screen, gap: Spacing.xs },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  operatorLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  routeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  holdBanner: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryBg },
  sectionHead: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  deckRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
