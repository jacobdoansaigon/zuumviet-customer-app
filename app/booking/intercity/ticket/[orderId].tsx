// app/booking/intercity/ticket/[orderId].tsx — Vé điện tử sau khi đặt Mua vé xe thành công.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, EmptyState, Icon, Icons, Screen, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { INTERCITY_CITIES, findBusTrip, findOperator } from '@/constants/mockIntercity';
import { getTicketOrder } from '@/services/intercityTicketStore';
import { buildTrackingLink, shareTrackingLink } from '@/services/shareLink';

export default function IntercityTicketScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = getTicketOrder(orderId ?? '');
  const [toast, setToast] = React.useState<string | null>(null);

  if (!order) {
    return (
      <Screen header={<AppHeader title="Vé của bạn" variant="light" left="close" />}>
        <EmptyState icon={Icons.doc} title="Không tìm thấy vé" actionLabel="Về trang chủ" onAction={() => router.replace('/home')} />
      </Screen>
    );
  }

  const city = INTERCITY_CITIES.find((c) => c.id === order.cityId)!;
  const trip = findBusTrip(order.tripId);
  const operator = trip ? findOperator(trip.operatorId) : null;

  const done = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  const share = async () => {
    const res = await shareTrackingLink({
      title: 'Vé xe của tôi trên ZuumViet',
      message: `Mình vừa đặt vé xe tuyến TP. Hồ Chí Minh → ${city.name}, khởi hành ${order.departTime}. Bạn theo dõi giúp mình nhé.`,
      url: buildTrackingLink('ticket', order.id),
    });
    setToast(res === 'copied' ? 'Đã sao chép liên kết chia sẻ' : res === 'unavailable' ? 'Thiết bị không hỗ trợ chia sẻ' : 'Đã mở hộp thoại chia sẻ');
  };

  return (
    <Screen
      header={<AppHeader title="Đặt vé thành công" variant="dark" left="close" onLeftPress={done} />}
      scroll
      footer={
        <View style={{ gap: Spacing.sm }}>
          <Button title="Chia sẻ với người thân" variant="outline" iconLeft={Icons.share} onPress={() => void share()} />
          <Button title="Về trang chủ" onPress={done} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.successBanner}>
          <Icon name={Icons.checkCircle} size={40} color={Colors.success} />
          <AppText size={17} weight="bold" style={{ marginTop: Spacing.sm }}>
            Đã đặt vé xe
          </AppText>
          <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
            Mã vé #{order.id.slice(-6).toUpperCase()} · Liên hệ {order.contactPhone || 'của bạn'} để nhận xác nhận
          </AppText>
        </View>

        <View style={styles.card}>
          <Row label="Tuyến" value={`TP. Hồ Chí Minh → ${city.name}`} />
          <Row label="Ngày giờ đi" value={`${order.dateLabel || 'Hôm nay'} · ${order.departTime}`} />
          <Row label="Nhà xe / loại xe" value={`${operator?.name ?? ''} · ${trip?.vehicleType ?? ''}`} />
          <Row label="Ghế đã chọn" value={order.seatIds.join(', ') || '—'} />
          <Row label="Điểm đón" value={order.pickup?.label ?? '—'} />
          <Row label="Điểm trả" value={order.dropoff?.label ?? '—'} />
          <Row label="Hàng hoá đi kèm" value={order.hasCargo ? order.cargoNote || 'Có' : 'Không'} />
        </View>

        <View style={styles.card}>
          <Row label={`Vé × ${order.seatIds.length || 1}`} value={`đ${(order.unitPrice * Math.max(1, order.seatIds.length)).toLocaleString('vi-VN')}`} />
          {order.hasCargo && trip ? <Row label="Phụ thu hàng hoá" value={`đ${trip.cargoFee.toLocaleString('vi-VN')}`} /> : null}
          {order.pickup?.fee ? <Row label="Phụ thu đón tận nơi" value={`đ${order.pickup.fee.toLocaleString('vi-VN')}`} /> : null}
          {order.dropoff?.fee ? <Row label="Phụ thu trả tận nơi" value={`đ${order.dropoff.fee.toLocaleString('vi-VN')}`} /> : null}
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
      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} />
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
