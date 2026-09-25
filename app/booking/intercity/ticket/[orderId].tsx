// app/booking/intercity/ticket/[orderId].tsx — Vé điện tử sau khi đặt Xe ghép / Mua vé xe thành công.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { INTERCITY_CITIES, findCarpool, findBusTrip, findOperator } from '@/constants/mockIntercity';
import { getTicketOrder } from '@/services/intercityTicketStore';

export default function IntercityTicketScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = getTicketOrder(orderId ?? '');

  if (!order) {
    return (
      <Screen header={<AppHeader title="Vé của bạn" variant="light" left="close" />}>
        <EmptyState icon={Icons.doc} title="Không tìm thấy vé" actionLabel="Về trang chủ" onAction={() => router.replace('/home')} />
      </Screen>
    );
  }

  const city = INTERCITY_CITIES.find((c) => c.id === order.cityId)!;
  const carpool = order.kind === 'carpool' ? findCarpool(order.tripId) : null;
  const trip = order.kind === 'bus' ? findBusTrip(order.tripId) : null;
  const operator = trip ? findOperator(trip.operatorId) : null;
  const providerName = order.kind === 'carpool' ? carpool?.driverName : operator?.name;
  const vehicleLabel = order.kind === 'carpool' ? `${carpool?.vehicleModel} · ${carpool?.vehiclePlate}` : trip?.vehicleType;

  const done = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  return (
    <Screen header={<AppHeader title="Đặt vé thành công" variant="dark" left="close" onLeftPress={done} />} scroll footer={<Button title="Về trang chủ" onPress={done} />}>
      <View style={styles.body}>
        <View style={styles.successBanner}>
          <Icon name={Icons.checkCircle} size={40} color={Colors.success} />
          <AppText size={17} weight="bold" style={{ marginTop: Spacing.sm }}>
            {order.kind === 'carpool' ? 'Đã đặt chỗ xe ghép' : 'Đã đặt vé xe'}
          </AppText>
          <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
            Mã vé #{order.id.slice(-6).toUpperCase()} · Liên hệ {order.contactPhone || 'của bạn'} để nhận xác nhận
          </AppText>
        </View>

        <View style={styles.card}>
          <Row label="Tuyến" value={`TP. Hồ Chí Minh → ${city.name}`} />
          <Row label="Ngày giờ đi" value={`${order.dateLabel || 'Hôm nay'} · ${order.departTime}`} />
          <Row label={order.kind === 'carpool' ? 'Tài xế / xe' : 'Nhà xe / loại xe'} value={`${providerName ?? ''} · ${vehicleLabel ?? ''}`} />
          <Row label="Ghế đã chọn" value={order.seatIds.join(', ') || '—'} />
          {order.kind === 'bus' ? (
            <>
              <Row label="Điểm đón" value={order.pickup?.label ?? '—'} />
              <Row label="Điểm trả" value={order.dropoff?.label ?? '—'} />
            </>
          ) : null}
          <Row label="Hàng hoá đi kèm" value={order.hasCargo ? order.cargoNote || 'Có' : 'Không'} />
        </View>

        <View style={styles.card}>
          <Row label={`Vé × ${order.seatIds.length || 1}`} value={`đ${(order.unitPrice * Math.max(1, order.seatIds.length)).toLocaleString('vi-VN')}`} />
          {order.kind === 'bus' && order.hasCargo && trip ? <Row label="Phụ thu hàng hoá" value={`đ${trip.cargoFee.toLocaleString('vi-VN')}`} /> : null}
          {order.kind === 'bus' && order.pickup?.fee ? <Row label="Phụ thu đón tận nơi" value={`đ${order.pickup.fee.toLocaleString('vi-VN')}`} /> : null}
          {order.kind === 'bus' && order.dropoff?.fee ? <Row label="Phụ thu trả tận nơi" value={`đ${order.dropoff.fee.toLocaleString('vi-VN')}`} /> : null}
          <View style={styles.totalRow}>
            <AppText size={15} weight="bold">
              Tổng cộng
            </AppText>
            <AppText size={20} weight="extraBold" color={Colors.primary}>
              đ{order.total.toLocaleString('vi-VN')}
            </AppText>
          </View>
        </View>

        <AppText size={11} color={Colors.textDisabled} align="center">
          Vé & thông tin nhà xe đang là dữ liệu mẫu (demo)
        </AppText>
      </View>
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
  body: { padding: Spacing.screen, gap: Spacing.md },
  successBanner: { alignItems: 'center', paddingVertical: Spacing.lg },
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
