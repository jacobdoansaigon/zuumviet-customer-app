// app/booking/intercity/ticket/[orderId].tsx — Vé điện tử (orderId = id vé, GET /v1/customer/intercity/bookings/:id):
// vé theo mẫu vé xe khách (BusTicket: nhà xe, tuyến, giờ xuất bến, ghế, hành khách, số xe, điểm đón, QR + mã vé để nhà xe quét
// khi lên xe) + chi tiết hàng gửi / giá. Huỷ vé khi canCancel (đã đặt: chỉ khi còn ≥ 24 giờ trước giờ chạy, hoàn đủ).
// Param done=1: vừa đặt xong (hiện lời chúc mừng). Tải lại khi quay về màn (nhà xe quét xong → hiện "đã lên xe").
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, Dialog, EmptyState, ErrorSheet, Icon, Icons, Screen, Toast } from '@/components/ui';
import { BusTicket } from '@/components/booking';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { BOOKING_STATUS_LABEL, cancelBooking, getBooking, releaseBooking, vnDateLabel, vnTime, type IntercityBooking } from '@/services/intercity';
import { formatVnd } from '@/services/bookingStore';
import { formatPhone } from '@/services/session';
import { errorMessage, isApiError } from '@/services/zuum';

export default function IntercityTicketScreen() {
  const { orderId, done } = useLocalSearchParams<{ orderId: string; done?: string }>();
  const id = String(orderId ?? '');
  const justBooked = done === '1';
  const [booking, setBooking] = useState<IntercityBooking | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBooking(await getBooking(id));
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e, 'Không tải được vé'));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const close = () => {
    if (justBooked) {
      if (router.canDismiss()) router.dismissAll();
      router.replace('/home');
    } else if (router.canGoBack()) router.back();
    else router.replace('/booking/intercity/tickets');
  };

  if (!booking) {
    return (
      <Screen header={<AppHeader title="Vé của bạn" variant="dark" left="close" onLeftPress={close} />}>
        {loadError ? (
          <EmptyState icon={Icons.doc} title={loadError} actionLabel="Về trang chủ" onAction={() => router.replace('/home')} />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </Screen>
    );
  }

  const trip = booking.trip;
  const v = trip.vehicle;
  const confirmed = booking.status === 'confirmed';
  const price = booking.price;

  const doCancel = async () => {
    setConfirmCancel(false);
    setCancelling(true);
    try {
      if (confirmed) {
        setBooking(await cancelBooking(booking.id));
        setToast(booking.paymentMethod === 'wallet' ? 'Đã huỷ vé — tiền đã hoàn về ví' : 'Đã huỷ vé');
      } else {
        // đang giữ chỗ: nhả ghế bằng /release — vé vừa được đặt ở nơi khác thì máy chủ từ chối, không huỷ nhầm
        setBooking(await releaseBooking(booking.id));
        setToast('Đã huỷ giữ chỗ');
      }
    } catch (e) {
      if (isApiError(e, 'intercity.already_confirmed')) void getBooking(booking.id).then(setBooking).catch(() => undefined);
      setError(errorMessage(e, 'Không huỷ được vé'));
    } finally {
      setCancelling(false);
    }
  };

  const whereLabel = (w: IntercityBooking['pickup'], station: string) => (w.type === 'home' ? `Tận nơi: ${w.address ?? ''}` : `Bến: ${station}`);

  return (
    <Screen
      header={<AppHeader title={justBooked ? 'Đặt vé thành công' : `Vé ${booking.code}`} variant="dark" left="close" onLeftPress={close} />}
      scroll
      footer={
        <View style={{ gap: Spacing.sm }}>
          {booking.status === 'held' ? (
            <Button title="Tiếp tục đặt vé" onPress={() => router.replace({ pathname: '/booking/intercity/checkout/[bookingId]', params: { bookingId: booking.id } })} />
          ) : null}
          {booking.canCancel && (confirmed || booking.status === 'held') ? (
            <Button title={confirmed ? 'Huỷ vé' : 'Huỷ giữ chỗ'} variant="outline" loading={cancelling} onPress={() => setConfirmCancel(true)} />
          ) : null}
          <Button title={justBooked ? 'Về trang chủ' : 'Vé của tôi'} variant={justBooked ? 'primary' : 'secondary'} onPress={justBooked ? close : () => router.replace('/booking/intercity/tickets')} />
        </View>
      }
    >
      <View style={styles.body}>
        {justBooked ? (
          <View style={styles.successBanner}>
            <Icon name={Icons.checkCircle} size={40} color={Colors.success} />
            <AppText size={17} weight="bold" style={{ marginTop: Spacing.sm }}>
              Đã đặt vé xe
            </AppText>
            <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
              Mã vé {booking.code} · nhà xe sẽ liên hệ {formatPhone(booking.contactPhone)} nếu cần
            </AppText>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <AppText size={13} color={Colors.textSecondary}>
            Trạng thái
          </AppText>
          <AppText size={14} weight="bold" color={booking.status === 'cancelled' || booking.status === 'expired' ? Colors.error : confirmed ? Colors.successDark : Colors.primary}>
            {booking.boardedAt ? 'Đã lên xe' : BOOKING_STATUS_LABEL[booking.status]}
          </AppText>
        </View>

        <BusTicket booking={booking} />

        <View style={styles.card}>
          <Row label="Dự kiến đến" value={`${vnDateLabel(trip.arriveAt)} · ${vnTime(trip.arriveAt)} · ${trip.to.station}`} />
          {[v.name, v.color].filter(Boolean).length ? <Row label="Xe" value={[v.name, v.color].filter(Boolean).join(' · ')} /> : null}
          <Row label="Điểm đón" value={whereLabel(booking.pickup, trip.from.station)} />
          <Row label="Điểm trả" value={whereLabel(booking.dropoff, trip.to.station)} />
          <Row
            label="Hàng hoá gửi kèm"
            value={
              booking.withCargo
                ? [booking.luggage.kg ? `${booking.luggage.kg} kg hành lý` : '', booking.luggage.bulkyDims ? `kiện ${booking.luggage.bulkyDims}` : '', booking.luggage.note ?? ''].filter(Boolean).join(' · ') || 'Có'
                : 'Không'
            }
          />
          {booking.contactName ? <Row label="Người đi" value={`${booking.contactName} · ${formatPhone(booking.contactPhone)}`} /> : null}
          {booking.cancelReason ? <Row label="Lý do huỷ" value={booking.cancelReason} /> : null}
        </View>

        <View style={styles.card}>
          {price ? (
            <>
              <Row label={`Vé × ${booking.seatIds.length}`} value={formatVnd(price.seats)} />
              {price.luggage ? <Row label={`Hành lý vượt ${price.extraKg} kg`} value={formatVnd(price.luggage)} /> : null}
              {price.bulky ? <Row label="Hàng cồng kềnh" value={formatVnd(price.bulky)} /> : null}
              {price.pickup ? <Row label="Đón tận nơi" value={formatVnd(price.pickup)} /> : null}
              {price.dropoff ? <Row label="Trả tận nơi" value={formatVnd(price.dropoff)} /> : null}
            </>
          ) : (
            <Row label={`Vé × ${booking.seatIds.length}`} value={formatVnd(booking.unitPrice * booking.seatIds.length)} />
          )}
          <View style={styles.totalRow}>
            <AppText size={15} weight="bold">
              Tổng cộng
            </AppText>
            <AppText size={20} weight="extraBold" color={Colors.primary}>
              {formatVnd(price?.total ?? booking.unitPrice * booking.seatIds.length)}
            </AppText>
          </View>
        </View>

        {confirmed && !booking.canCancel ? (
          <AppText size={12} color={Colors.textMuted} align="center">
            Chỉ huỷ vé trước giờ chạy 24 giờ — cần hỗ trợ vui lòng liên hệ nhà xe.
          </AppText>
        ) : null}
      </View>

      <Dialog
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={confirmed ? 'Huỷ vé này?' : 'Huỷ giữ chỗ?'}
        message={
          confirmed
            ? `Vé ${booking.code} (ghế ${booking.seatIds.join(', ')}) sẽ bị huỷ${booking.paymentMethod === 'wallet' ? ', tiền được hoàn đủ về ví' : ''}.`
            : `Ghế ${booking.seatIds.join(', ')} sẽ được trả lại.`
        }
        actions={[
          { label: 'Không', variant: 'secondary', onPress: () => setConfirmCancel(false) },
          { label: 'Huỷ vé', variant: 'danger', onPress: () => void doCancel() },
        ]}
      />
      <ErrorSheet visible={!!error} title="Không huỷ được vé" message={error ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={() => setToast(null)} />
    </Screen>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <AppText size={13} color={Colors.textSecondary}>
      {label}
    </AppText>
    <AppText size={13} weight="semiBold" color={Colors.text} style={{ flexShrink: 1, textAlign: 'right' }} numberOfLines={2}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.screen, gap: Spacing.md },
  successBanner: { alignItems: 'center', paddingVertical: Spacing.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
