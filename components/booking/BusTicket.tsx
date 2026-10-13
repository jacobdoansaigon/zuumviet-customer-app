// BusTicket — vé điện tử theo mẫu vé xe khách (anh Jacob 2026-10-13): đầu vé tên nhà xe + tuyến, thân vé ngày / giờ xuất bến /
// ghế / hành khách / xe / điểm đón, chân vé mã QR + mã vé để nhân viên nhà xe quét khi lên xe. Vé đang giữ chỗ chưa có QR;
// vé đã lên xe / đã huỷ / đã đi đóng dấu trạng thái. QR = chuỗi `qr` của API (ZVT:<mã vé>:<chữ ký>), vẽ bằng react-native-qrcode-svg.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppText, Icon, Icons } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { vnDateLabel, vnTime, type IntercityBooking } from '@/services/intercity';
import { formatVnd } from '@/services/bookingStore';
import { formatPhone } from '@/services/session';

interface BusTicketProps {
  booking: IntercityBooking;
}

const QR_SIZE = 168;
const NOTCH = 22;

/** "07:12 24/09" theo giờ VN cho dấu đã lên xe */
const stampTime = (iso: string) => `${vnTime(iso)} ${vnDateLabel(iso).split(', ')[1] ?? ''}`.trim();

export const BusTicket: React.FC<BusTicketProps> = ({ booking }) => {
  const trip = booking.trip;
  const bed = trip.seatKind === 'bed';
  const stamp =
    booking.status === 'cancelled' || booking.status === 'expired'
      ? { label: booking.status === 'cancelled' ? 'ĐÃ HUỶ' : 'HẾT HẠN', color: Colors.error }
      : booking.boardedAt
        ? { label: `ĐÃ LÊN XE ${stampTime(booking.boardedAt)}`, color: Colors.green }
        : booking.status === 'completed'
          ? { label: 'ĐÃ ĐI', color: Colors.textSecondary }
          : null;
  const pickup = booking.pickup.type === 'home' ? `Tận nơi: ${booking.pickup.address ?? ''}` : trip.from.station;
  const dropoff = booking.dropoff.type === 'home' ? `Tận nơi: ${booking.dropoff.address ?? ''}` : trip.to.station;
  const total = booking.price?.total ?? booking.unitPrice * booking.seatIds.length;

  return (
    <View style={styles.ticket}>
      {/* đầu vé: nhà xe + tuyến */}
      <View style={styles.head}>
        <View style={styles.headRow}>
          <View style={styles.headIcon}>
            <Icon name={trip.kind === 'bus' ? 'mci:bus' : 'mci:car-multiple'} size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText size={11} weight="semiBold" color="rgba(255,255,255,0.75)">
              {trip.kind === 'bus' ? 'VÉ XE KHÁCH' : 'VÉ XE GHÉP'}
            </AppText>
            <AppText size={16} weight="extraBold" color={Colors.white} numberOfLines={1}>
              {trip.operator.name}
            </AppText>
          </View>
          {booking.operatorPhone ? (
            <View style={{ alignItems: 'flex-end' }}>
              <AppText size={10} color="rgba(255,255,255,0.75)">
                Hotline
              </AppText>
              <AppText size={13} weight="bold" color={Colors.white}>
                {formatPhone(booking.operatorPhone)}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.routeRow}>
          <View style={{ flex: 1 }}>
            <AppText size={20} weight="extraBold" color={Colors.white} numberOfLines={1}>
              {trip.from.name}
            </AppText>
            <AppText size={12} color="rgba(255,255,255,0.85)" numberOfLines={2}>
              {trip.from.station}
            </AppText>
          </View>
          <Icon name="ion:arrow-forward" size={22} color={Colors.white} style={{ marginHorizontal: Spacing.sm, marginTop: 4 }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <AppText size={20} weight="extraBold" color={Colors.white} numberOfLines={1} align="right">
              {trip.to.name}
            </AppText>
            <AppText size={12} color="rgba(255,255,255,0.85)" numberOfLines={2} align="right">
              {trip.to.station}
            </AppText>
          </View>
        </View>
      </View>

      <Perforation />

      {/* thân vé */}
      <View style={styles.body}>
        <View style={styles.grid}>
          <Cell label="Ngày đi" value={vnDateLabel(trip.departAt)} />
          <Cell label="Giờ xuất bến" value={vnTime(trip.departAt)} big />
          <Cell label={bed ? 'Giường' : 'Ghế'} value={booking.seatIds.join(', ')} big align="right" />
        </View>
        <View style={styles.grid}>
          <Cell label="Hành khách" value={booking.contactName ?? '—'} sub={booking.contactPhone ? formatPhone(booking.contactPhone) : undefined} flex={1.4} />
          <Cell label="Số xe" value={booking.vehiclePlate ?? (trip.vehicle.name ? trip.vehicle.name : 'Báo trước giờ chạy')} align="right" />
        </View>
        <View style={styles.grid}>
          <Cell label="Điểm đón" value={pickup} flex={1} />
          <Cell label="Điểm trả" value={dropoff} flex={1} align="right" />
        </View>
        <View style={[styles.grid, { marginBottom: 0 }]}>
          <Cell label="Giá vé" value={formatVnd(total)} sub={`${booking.seatIds.length} ${bed ? 'giường' : 'ghế'} × ${formatVnd(booking.unitPrice)}${booking.withCargo ? ' · có hàng gửi' : ''}`} flex={1.4} />
          <Cell
            label="Thanh toán"
            value={booking.paymentMethod === 'wallet' ? 'Đã thanh toán' : booking.paymentMethod === 'cash' ? 'Tiền mặt khi lên xe' : 'Chưa thanh toán'}
            align="right"
            color={booking.paymentMethod === 'wallet' ? Colors.successDark : booking.paymentMethod === 'cash' ? Colors.secondary : Colors.error}
          />
        </View>
      </View>

      <Perforation />

      {/* chân vé: QR */}
      <View style={styles.foot}>
        {booking.qr ? (
          <>
            <View style={styles.qrBox}>
              <QRCode value={booking.qr} size={QR_SIZE} color={Colors.text} backgroundColor={Colors.white} ecl="M" />
              {stamp ? (
                <View style={styles.stampOverlay} pointerEvents="none">
                  <View style={[styles.stamp, { borderColor: stamp.color }]}>
                    <AppText size={13} weight="extraBold" color={stamp.color} align="center">
                      {stamp.label}
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
            <AppText size={18} weight="extraBold" style={{ letterSpacing: 2, marginTop: Spacing.sm }}>
              {booking.code}
            </AppText>
            <AppText size={12} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
              {booking.boardedAt ? 'Nhà xe đã ghi nhận bạn lên xe' : 'Xuất trình mã QR cho nhân viên nhà xe khi lên xe'}
            </AppText>
          </>
        ) : (
          <View style={styles.qrPending}>
            <Icon name={Icons.qr} size={40} color={Colors.gray400} />
            <AppText size={13} weight="semiBold" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.xs }}>
              {booking.status === 'held' ? 'Hoàn tất đặt vé để nhận mã QR lên xe' : 'Vé không còn hiệu lực'}
            </AppText>
            <AppText size={12} color={Colors.textMuted} style={{ marginTop: 2 }}>
              Mã vé {booking.code}
            </AppText>
            {stamp && booking.status !== 'held' ? (
              <View style={[styles.stamp, { borderColor: stamp.color, marginTop: Spacing.sm }]}>
                <AppText size={13} weight="extraBold" color={stamp.color}>
                  {stamp.label}
                </AppText>
              </View>
            ) : null}
          </View>
        )}
        <AppText size={11} color={Colors.textMuted} align="center" style={styles.terms}>
          Có mặt tại điểm đón trước giờ xuất bến 30 phút · Mang theo giấy tờ tuỳ thân · Mã vé dùng cho mọi yêu cầu hỗ trợ
        </AppText>
      </View>
    </View>
  );
};

const Cell: React.FC<{ label: string; value: string; sub?: string; big?: boolean; align?: 'left' | 'right'; flex?: number; color?: string }> = ({ label, value, sub, big, align = 'left', flex = 1, color }) => (
  <View style={{ flex, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
    <AppText size={10} weight="semiBold" color={Colors.textMuted} style={{ letterSpacing: 0.6 }}>
      {label.toUpperCase()}
    </AppText>
    <AppText size={big ? 18 : 14} weight={big ? 'extraBold' : 'bold'} color={color ?? Colors.text} align={align} numberOfLines={2} style={{ marginTop: 1 }}>
      {value}
    </AppText>
    {sub ? (
      <AppText size={11} color={Colors.textSecondary} align={align} numberOfLines={1}>
        {sub}
      </AppText>
    ) : null}
  </View>
);

/** đường răng cưa + 2 khuyết tròn hai bên như vé xé */
const Perforation: React.FC = () => (
  <View style={styles.perf}>
    <View style={[styles.notch, { left: -NOTCH / 2 }]} />
    <View style={styles.dash} />
    <View style={[styles.notch, { right: -NOTCH / 2 }]} />
  </View>
);

const styles = StyleSheet.create({
  ticket: { borderRadius: BorderRadius.lg, backgroundColor: Colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, overflow: 'hidden' },
  head: { backgroundColor: Colors.primary, padding: Spacing.base, paddingBottom: Spacing.lg },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  headIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  perf: { height: NOTCH, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white },
  notch: { position: 'absolute', width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  dash: { flex: 1, marginHorizontal: NOTCH, borderTopWidth: 1.5, borderColor: Colors.gray300, borderStyle: 'dashed' },
  body: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  grid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  foot: { alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xs, paddingBottom: Spacing.base },
  qrBox: { padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  stampOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)' },
  stamp: { borderWidth: 2.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, transform: [{ rotate: '-8deg' }], backgroundColor: 'rgba(255,255,255,0.9)' },
  qrPending: { alignItems: 'center', paddingVertical: Spacing.lg },
  terms: { marginTop: Spacing.md, lineHeight: 16 },
});

export default BusTicket;
