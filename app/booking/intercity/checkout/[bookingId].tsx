// app/booking/intercity/checkout/[bookingId].tsx — Hoàn tất đặt vé sau khi giữ ghế: đếm ngược thời gian giữ chỗ (10 phút),
// người đi (tên/SĐT), điểm đón/trả (bến xe hoặc tận nơi nếu chuyến nhận — kèm địa chỉ), hàng gửi kèm, thanh toán
// (tiền mặt / ví) → POST /v1/customer/intercity/bookings/:id/confirm → vé điện tử. Huỷ giữ chỗ hoặc quay lại: trả ghế
// ngay (chỉ khi vé còn đang giữ). Xác nhận mất phản hồi (lỗi mạng / not_held / hold_expired): đọc lại vé — đã đặt thì
// mở vé, không bắt chọn lại ghế (tránh mua 2 lần).
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { AppHeader, AppText, Button, Dialog, EmptyState, ErrorSheet, Icon, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { PaymentSheet } from '@/components/booking';
import { confirmBooking, getBooking, releaseHold, vnDateLabel, vnTime, type IntercityBooking } from '@/services/intercity';
import { formatVnd, isValidPhoneVn, type PaymentMethod } from '@/services/bookingStore';
import { getProfile, localPhone } from '@/services/session';
import { errorMessage, isApiError, toZuumError } from '@/services/zuum';

type Where = 'station' | 'home';

function useCountdown(until: string | null): number {
  const [left, setLeft] = useState(() => (until ? Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) return;
    const tick = () => setLeft(Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

export default function TicketCheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = String(bookingId ?? '');
  const [booking, setBooking] = useState<IntercityBooking | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickup, setPickup] = useState<Where>('station');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoff, setDropoff] = useState<Where>('station');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [withCargo, setWithCargo] = useState(false);
  const [cargoNote, setCargoNote] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [paySheet, setPaySheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = useCountdown(booking?.status === 'held' ? booking.heldUntil : null);
  const navigation = useNavigation();
  // settled: rời màn có chủ đích (đã đặt / đã trả ghế / hết hạn) → không trả ghế nữa.
  // unsure: có lần xác nhận đang chạy hoặc chưa rõ kết quả → KHÔNG tự huỷ (vé có thể đã được đặt).
  const settled = useRef(false);
  const unsure = useRef(false);
  const heldRef = useRef(false);
  heldRef.current = booking?.status === 'held';

  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        if (settled.current || unsure.current || !heldRef.current) return;
        void releaseHold(id);
      }),
    [navigation, id],
  );

  useEffect(() => {
    let alive = true;
    getBooking(id)
      .then((b) => {
        if (!alive) return;
        setBooking(b);
        if (b.status !== 'held') {
          settled.current = true;
          router.replace({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: b.id } });
        }
      })
      .catch((e) => alive && setLoadError(errorMessage(e, 'Không tải được vé')));
    void getProfile().then((p) => {
      if (!alive || !p) return;
      setName((n) => n || p.fullName);
      setPhone((v) => v || localPhone(p.phone));
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!booking) {
    return (
      <Screen header={<AppHeader title="Thông tin đặt vé" variant="dark" left="arrow" />}>
        {loadError ? (
          <EmptyState icon={Icons.doc} title={loadError} actionLabel="Quay lại" onAction={() => router.back()} />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </Screen>
    );
  }

  const trip = booking.trip;
  const expired = left <= 0;
  const seatsCost = booking.unitPrice * booking.seatIds.length;
  const cargoCost = withCargo ? (trip.cargoFee ?? 0) : 0;
  const pickupCost = pickup === 'home' ? (trip.homePickupFee ?? 0) : 0;
  const dropoffCost = dropoff === 'home' ? (trip.homeDropoffFee ?? 0) : 0;
  const total = seatsCost + cargoCost + pickupCost + dropoffCost;
  const phoneOk = isValidPhoneVn(phone);
  const ready =
    !expired &&
    name.trim().length >= 2 &&
    phoneOk &&
    (pickup === 'station' || pickupAddress.trim().length >= 5) &&
    (dropoff === 'station' || dropoffAddress.trim().length >= 5) &&
    !submitting;

  const openTicket = (bookingId: string) => {
    settled.current = true;
    router.replace({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: bookingId, done: '1' } });
  };

  const submit = async () => {
    if (!ready) return;
    setSubmitting(true);
    unsure.current = true;
    try {
      const done = await confirmBooking(booking.id, {
        paymentMethod: payment,
        contactName: name.trim(),
        contactPhone: phone.replace(/[\s.-]/g, ''),
        withCargo,
        ...(withCargo && cargoNote.trim() ? { cargoNote: cargoNote.trim() } : {}),
        pickup: pickup === 'home' ? { type: 'home', address: pickupAddress.trim() } : { type: 'station' },
        dropoff: dropoff === 'home' ? { type: 'home', address: dropoffAddress.trim() } : { type: 'station' },
      });
      openTicket(done.id);
    } catch (e) {
      const err = toZuumError(e);
      const maybeDone = err.status === 0 || err.status >= 500 || isApiError(err, 'intercity.hold_expired', 'intercity.not_held');
      if (!maybeDone) {
        unsure.current = false; // lỗi nghiệp vụ rõ ràng (sai địa chỉ, ví không đủ…) → vé vẫn đang giữ
        setError(errorMessage(err, 'Không đặt được vé, vui lòng thử lại'));
        return;
      }
      // lần xác nhận trước có thể đã thành công mà mất phản hồi → đọc lại vé trước khi bắt chọn lại ghế
      const latest = await getBooking(booking.id).catch(() => null);
      if (latest && (latest.status === 'confirmed' || latest.status === 'completed')) {
        openTicket(latest.id);
        return;
      }
      if (latest) {
        unsure.current = false;
        setBooking(latest);
        setError(errorMessage(err, 'Không đặt được vé, vui lòng thử lại'));
      } else {
        setError('Chưa rõ vé đã được đặt hay chưa do mất kết nối. Vui lòng kiểm tra mạng rồi bấm "Đặt vé" lại — nếu vé đã đặt, ứng dụng sẽ mở vé cho bạn.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const releaseNow = async () => {
    setConfirmCancel(false);
    settled.current = true;
    const latest = await releaseHold(booking.id);
    if (latest && (latest.status === 'confirmed' || latest.status === 'completed')) {
      openTicket(latest.id);
      return;
    }
    router.back();
  };

  const pickSeatsAgain = () => {
    settled.current = true;
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/booking/intercity/bus/[id]', params: { id: trip.id } });
  };

  const whereBlock = (title: string, value: Where, onChange: (w: Where) => void, fee: number | null, station: string, address: string, setAddress: (t: string) => void) => (
    <View style={styles.card}>
      <AppText size={15} weight="bold">
        {title}
      </AppText>
      <Radio selected={value === 'station'} onPress={() => onChange('station')} label={`Tại bến: ${station}`} bold={false} style={styles.radio} />
      {fee != null ? (
        <Radio
          selected={value === 'home'}
          onPress={() => onChange('home')}
          label={`Tận nơi (${fee > 0 ? `+${formatVnd(fee)}` : 'miễn phí'})`}
          bold={false}
          style={styles.radio}
        />
      ) : (
        <AppText size={12} color={Colors.textMuted}>
          Chuyến này không {title === 'Điểm đón' ? 'đón' : 'trả'} tận nơi
        </AppText>
      )}
      {value === 'home' ? <TextField value={address} onChangeText={setAddress} placeholder="Số nhà, đường, phường/xã, quận/huyện" containerStyle={{ marginTop: Spacing.xs }} /> : null}
    </View>
  );

  return (
    <Screen
      header={<AppHeader title="Thông tin đặt vé" variant="dark" left="arrow" />}
      scroll
      footer={
        expired ? (
          <Button title="Chọn lại ghế" onPress={pickSeatsAgain} />
        ) : (
          <Button title={`Đặt vé · ${formatVnd(total)}`} disabled={!ready} loading={submitting} onPress={() => void submit()} />
        )
      }
    >
      <View style={styles.body}>
        <View style={[styles.timer, expired && styles.timerExpired]}>
          <Icon name={Icons.clock} size={18} color={expired ? Colors.error : Colors.primary} />
          <AppText size={14} weight="semiBold" color={expired ? Colors.error : Colors.primary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
            {expired
              ? 'Hết thời gian giữ chỗ — vui lòng chọn lại ghế'
              : `Giữ ghế ${booking.seatIds.join(', ')} trong ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`}
          </AppText>
          {!expired ? (
            <Pressable onPress={() => setConfirmCancel(true)} hitSlop={8}>
              <AppText size={13} weight="semiBold" color={Colors.error}>
                Huỷ
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <AppText size={15} weight="bold">
            {trip.from.name} → {trip.to.name}
          </AppText>
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {vnDateLabel(trip.departAt)} · {vnTime(trip.departAt)} · {trip.operator.name}
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText size={15} weight="bold">
            Người đi
          </AppText>
          <TextField label="Họ và tên" required value={name} onChangeText={setName} placeholder="Họ và tên" autoCapitalize="words" containerStyle={{ marginTop: Spacing.xs }} />
          <TextField
            label="Số điện thoại"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            error={phone && !phoneOk ? 'Số điện thoại không hợp lệ' : undefined}
            containerStyle={{ marginTop: Spacing.sm }}
          />
        </View>

        {whereBlock('Điểm đón', pickup, setPickup, trip.homePickupFee, trip.from.station, pickupAddress, setPickupAddress)}
        {whereBlock('Điểm trả', dropoff, setDropoff, trip.homeDropoffFee, trip.to.station, dropoffAddress, setDropoffAddress)}

        <View style={styles.card}>
          <AppText size={15} weight="bold">
            Hàng hoá gửi kèm
          </AppText>
          {trip.cargoFee != null ? (
            <>
              <SwitchRow
                icon={Icons.box}
                label="Gửi thêm hàng hoá"
                sublabel={trip.cargoFee > 0 ? `Phụ thu ${formatVnd(trip.cargoFee)}` : 'Miễn phí'}
                value={withCargo}
                onValueChange={setWithCargo}
              />
              {withCargo ? (
                <TextField value={cargoNote} onChangeText={setCargoNote} placeholder="Mô tả hàng hoá (loại hàng, kích thước ước tính...)" maxLength={300} />
              ) : null}
            </>
          ) : (
            <AppText size={12} color={Colors.textMuted}>
              Chuyến này không nhận gửi hàng hoá
            </AppText>
          )}
        </View>

        <Pressable style={[styles.card, styles.payRow]} onPress={() => setPaySheet(true)}>
          <Icon name={payment === 'wallet' ? Icons.wallet : Icons.cash} size={22} color={Colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <AppText size={15} weight="bold">
              {payment === 'wallet' ? 'Ví ZuumViet' : 'Tiền mặt'}
            </AppText>
            <AppText size={12} color={Colors.textSecondary}>
              {payment === 'wallet' ? 'Trừ ví khi đặt, hoàn lại nếu huỷ vé hợp lệ' : 'Trả nhà xe / tài xế khi lên xe'}
            </AppText>
          </View>
          <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.card}>
          <PriceRow label={`Vé × ${booking.seatIds.length}`} value={seatsCost} />
          {cargoCost ? <PriceRow label="Phụ thu hàng hoá" value={cargoCost} /> : null}
          {pickupCost ? <PriceRow label="Đón tận nơi" value={pickupCost} /> : null}
          {dropoffCost ? <PriceRow label="Trả tận nơi" value={dropoffCost} /> : null}
          <View style={styles.totalRow}>
            <AppText size={15} weight="bold">
              Tổng cộng
            </AppText>
            <AppText size={20} weight="extraBold" color={Colors.primary}>
              {formatVnd(total)}
            </AppText>
          </View>
          <AppText size={11} color={Colors.textMuted}>
            Huỷ miễn phí, hoàn đủ khi còn từ 24 giờ trước giờ chạy.
          </AppText>
        </View>
      </View>

      <PaymentSheet visible={paySheet} value={payment} amount={total} onClose={() => setPaySheet(false)} onSelect={setPayment} />
      <Dialog
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Huỷ giữ chỗ?"
        message={`Ghế ${booking.seatIds.join(', ')} sẽ được trả lại cho người khác đặt.`}
        actions={[
          { label: 'Giữ ghế', variant: 'secondary', onPress: () => setConfirmCancel(false) },
          { label: 'Huỷ giữ chỗ', variant: 'danger', onPress: () => void releaseNow() },
        ]}
      />
      <ErrorSheet visible={!!error} title="Chưa đặt được vé" message={error ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const PriceRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.priceRow}>
    <AppText size={13} color={Colors.textSecondary}>
      {label}
    </AppText>
    <AppText size={13} weight="semiBold">
      {formatVnd(value)}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.screen, gap: Spacing.md },
  timer: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryBg },
  timerExpired: { backgroundColor: Colors.errorBg },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  radio: { paddingVertical: Spacing.sm },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
