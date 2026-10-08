// TrackingSheet — nội dung bottom sheet màn theo dõi đơn theo trạng thái (Figma 1.5 đang tìm / không tìm thấy / tìm thấy /
// đang giao / mở rộng). Dữ liệu là đơn của API (GET /v1/customer/orders/:id): tài xế (ảnh, điểm đánh giá), xe (biển số,
// hãng, màu), các điểm + trạng thái từng điểm, giá báo / giá cuối, phí huỷ, đánh giá.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Avatar, Button, Icon, Icons, RouteStops, ServiceOption, type RouteStop } from '@/components/ui';
import { SERVICE_GROUPS, SERVICE_PRESENTATION, type ServiceLabels } from '@/constants/booking';
import { formatVnd, formatScheduleLabel } from '@/services/bookingStore';
import { formatPhone } from '@/services/session';
import { groupOfOrder, phaseOf, STOP_STATUS_LABEL, type OrderDetail, type StopStatus, type TrackingPhase } from '@/services/orders';

const STOP_TONE: Record<StopStatus, RouteStop['statusTone']> = {
  pending: 'default',
  arrived: 'warning',
  delivered: 'success',
  failed: 'danger',
  returned: 'primary',
};

const phaseStatus = (phase: TrackingPhase, L: ServiceLabels): string => {
  const p = L.provider.toLowerCase();
  switch (phase) {
    case 'scheduled':
      return 'Đã lên lịch';
    case 'searching':
      return `Tìm ${p}`;
    case 'notfound':
      return `Không tìm thấy ${p}`;
    case 'accepted':
      return L.trackingAccepted;
    case 'delivering':
      return L.trackingDelivering;
    case 'completed':
      return 'Hoàn thành';
    default:
      return 'Đã huỷ';
  }
};

const CANCELLED_BY: Record<string, string> = { customer: 'Bạn đã huỷ đơn', partner: 'Tài xế đã huỷ', staff: 'ZuumViet đã huỷ đơn', system: 'Hệ thống tự huỷ đơn' };

interface Props {
  order: OrderDetail;
  /** phút (khoảng) tài xế tới điểm kế tiếp — null khi chưa có vị trí tài xế */
  etaMinutes: number | null;
  expanded: boolean;
  onToggle: () => void;
  onMore: () => void;
  onRetry: () => void;
  retrying?: boolean;
  onCall: () => void;
  onChat: () => void;
  onRate: () => void;
  onHome: () => void;
}

export const TrackingSheet: React.FC<Props> = ({ order, etaMinutes, expanded, onToggle, onMore, onRetry, retrying, onCall, onChat, onRate, onHome }) => {
  const phase = phaseOf(order.status);
  const group = SERVICE_GROUPS[groupOfOrder(order.service)];
  const L = group.labels;
  const providerLower = L.provider.toLowerCase();
  const presentation = SERVICE_PRESENTATION[order.service.code];
  const partner = order.partner;
  const vehicle = order.vehicle;
  const showDriver = !!partner && (phase === 'accepted' || phase === 'delivering' || phase === 'completed');
  const price = order.finalPrice ?? order.price;
  const total = order.total;
  const pickedUp = order.status === 'picked_up' || order.status === 'completed';

  const stops: RouteStop[] = [
    {
      type: 'pickup',
      title: order.pickup.contactName ? `${order.pickup.contactName} - ${formatPhone(order.pickup.contactPhone)}` : order.pickup.address,
      subtitle: order.pickup.address,
      status: pickedUp ? order.steps.pickUp : order.status === 'arrived_pickup' ? order.steps.arrive : undefined,
      statusTone: pickedUp ? 'success' : order.status === 'arrived_pickup' ? 'warning' : 'default',
    },
    ...order.stops.map<RouteStop>((s) => ({
      type: 'dropoff',
      title: s.contactName ? `${s.contactName} - ${formatPhone(s.contactPhone)}` : s.address,
      subtitle: s.failReason ? `${s.address} · ${s.failReason}` : s.address,
      status: pickedUp || s.status !== 'pending' ? STOP_STATUS_LABEL[s.status] : undefined,
      statusTone: STOP_TONE[s.status],
    })),
  ];

  const more = (
    <Pressable onPress={onMore} hitSlop={10} accessibilityLabel="Thêm">
      <Icon name={Icons.more} size={22} color={Colors.text} />
    </Pressable>
  );

  const acceptedTitle =
    order.status === 'arrived_pickup'
      ? `${L.provider} đã đến ${L.mapPickupLabel.toLowerCase()}`
      : etaMinutes != null
        ? L.trackingEta.replace('{eta}', String(etaMinutes))
        : L.trackingAccepted;
  const deliveringTitle = etaMinutes != null && order.stops.length ? `${order.steps.inProgress} · khoảng ${etaMinutes} phút tới điểm kế tiếp` : order.steps.inProgress;

  return (
    <View>
      <Pressable onPress={onToggle} style={styles.handleWrap} accessibilityLabel={expanded ? 'Thu gọn' : 'Mở rộng'}>
        <View style={styles.handle} />
      </Pressable>

      <View style={styles.head}>
        {phase === 'searching' ? (
          <>
            <Icon name={Icons.moon} size={26} color={Colors.secondary} style={styles.headIcon} />
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              Đang tìm {providerLower} gần bạn ....
            </AppText>
            {more}
          </>
        ) : phase === 'scheduled' ? (
          <>
            <Icon name={Icons.calendar} size={26} color={Colors.secondary} style={styles.headIcon} />
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              Đơn hàng được hẹn lúc {formatScheduleLabel(order.scheduledAt ? Date.parse(order.scheduledAt) : null)}
            </AppText>
            {more}
          </>
        ) : phase === 'notfound' ? (
          <>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={16}>
                Không tìm thấy {providerLower}
              </AppText>
              <Pressable onPress={onRetry} hitSlop={8} style={{ marginTop: 4 }} disabled={retrying}>
                <AppText weight="semiBold" size={14} color={retrying ? Colors.textMuted : Colors.primary}>
                  {retrying ? 'Đang tìm lại...' : 'Thử lại tìm kiếm'}
                </AppText>
              </Pressable>
            </View>
            {more}
          </>
        ) : phase === 'completed' ? (
          <>
            <Icon name={Icons.checkCircle} size={26} color={Colors.success} style={styles.headIcon} />
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              {L.trackingDone}
            </AppText>
          </>
        ) : phase === 'cancelled' ? (
          <>
            <Icon name={Icons.closeCircle} size={26} color={Colors.error} style={styles.headIcon} />
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={15}>
                Đơn hàng đã bị huỷ
              </AppText>
              {order.cancellation ? (
                <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                  {[
                    order.cancellation.by ? CANCELLED_BY[order.cancellation.by] : '',
                    order.cancellation.reason?.label ?? '',
                    order.cancellation.fee > 0 ? `Phí huỷ ${formatVnd(order.cancellation.fee)}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              {phase === 'accepted' ? acceptedTitle : deliveringTitle}
            </AppText>
            {more}
          </>
        )}
      </View>

      {showDriver && partner ? (
        <View style={styles.driverRow}>
          <Avatar name={partner.fullName} uri={partner.photoUrl ?? undefined} size={44} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText weight="bold" size={17} numberOfLines={1} style={{ flexShrink: 1 }}>
                {partner.fullName}
              </AppText>
              {partner.rating.average != null ? (
                <View style={styles.ratingPill}>
                  <Icon name={Icons.star} size={12} color={Colors.secondary} />
                  <AppText size={12} weight="semiBold" style={{ marginLeft: 2 }}>
                    {partner.rating.average.toFixed(1)}
                  </AppText>
                  <AppText size={11} color={Colors.textSecondary} style={{ marginLeft: 2 }}>
                    ({partner.rating.count})
                  </AppText>
                </View>
              ) : null}
            </View>
            {vehicle ? (
              <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
                {[vehicle.plate, [vehicle.brand, vehicle.model].filter(Boolean).join(' '), vehicle.color].filter(Boolean).join(' · ')}
              </AppText>
            ) : null}
          </View>
          {phase !== 'completed' ? (
            <>
              <Pressable onPress={onCall} style={styles.callBtn} accessibilityLabel="Gọi tài xế">
                <Icon name={Icons.phone} size={20} color={Colors.white} />
              </Pressable>
              <Pressable onPress={onChat} style={styles.chatBtn} accessibilityLabel="Nhắn tin tài xế">
                <Icon name={Icons.chat} size={20} color={Colors.primary} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.serviceCard}>
        <ServiceOption
          name={order.service.name}
          description={presentation?.description}
          price={formatVnd(total)}
          icon={presentation?.icon ?? group.icon}
          selected
        />
      </View>

      <View style={styles.payRow}>
        <View style={styles.payHalf}>
          <Icon name={Icons.ticket} size={20} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {price.discount > 0 ? `Giảm ${formatVnd(price.discount)}` : 'Không áp dụng mã'}
          </AppText>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.payHalf}>
          <Icon name={order.paymentMethod === 'wallet' ? Icons.wallet : Icons.cash} size={20} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {order.paymentMethod === 'wallet' ? 'Ví ZuumViet' : 'Tiền mặt'}
          </AppText>
        </View>
      </View>

      <Pressable onPress={onToggle} style={styles.codeRow}>
        <Icon name={Icons.calendar} size={20} color={Colors.primary} />
        <AppText weight="bold" size={15} style={{ flex: 1, marginLeft: Spacing.sm }}>
          Mã {order.code}
        </AppText>
        <AppText size={14} color={Colors.textSecondary}>
          {phaseStatus(phase, L)}
        </AppText>
        <Icon name={expanded ? Icons.chevronDown : Icons.chevronRight} size={18} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          {order.distanceMeters > 0 ? (
            <AppText weight="bold" size={13} style={{ marginBottom: Spacing.sm }}>
              Đoạn đường {(order.distanceMeters / 1000).toFixed(1)}km
              {order.returnToPickup ? ' (gồm chiều về)' : ''}
            </AppText>
          ) : null}
          <RouteStops stops={stops} titleSize={14} />

          {order.durationMinutes ? (
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
              Thời gian thuê: {Math.round((order.durationMinutes / 60) * 10) / 10} giờ
            </AppText>
          ) : null}

          <AppText weight="bold" size={14} style={{ marginTop: Spacing.md }}>
            Ghi chú
          </AppText>
          <AppText size={14} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {order.note || 'Không có ghi chú'}
          </AppText>

          <AppText weight="bold" size={14} style={{ marginTop: Spacing.md, marginBottom: 2 }}>
            {order.finalPrice ? 'Thanh toán' : 'Giá đã báo'}
          </AppText>
          {price.lines.map((l, i) => (
            <View key={`${l.code}-${i}`} style={styles.lineRow}>
              <AppText size={13} color={Colors.textSecondary} style={{ flex: 1 }}>
                {l.label}
              </AppText>
              <AppText size={13} color={l.amount < 0 ? Colors.success : Colors.text}>
                {formatVnd(l.amount)}
              </AppText>
            </View>
          ))}
          <View style={styles.lineRow}>
            <AppText size={14} weight="bold" style={{ flex: 1 }}>
              Tổng cộng
            </AppText>
            <AppText size={14} weight="bold" color={Colors.primary}>
              {formatVnd(total)}
            </AppText>
          </View>
          {order.codTotal > 0 ? (
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Thu hộ (COD): {formatVnd(order.codTotal)}
            </AppText>
          ) : null}
          {order.debtAmount > 0 ? (
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Kèm phí huỷ đơn trước còn nợ: {formatVnd(order.debtAmount)}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {phase === 'completed' ? (
        <View style={styles.cta}>
          {order.canRate ? (
            <Button title={`Đánh giá ${providerLower}`} onPress={onRate} />
          ) : order.rating ? (
            <AppText size={14} color={Colors.textSecondary} align="center">
              Bạn đã đánh giá {order.rating.stars}★ cho chuyến này
            </AppText>
          ) : (
            <Button title="Về trang chủ" variant="outline" onPress={onHome} />
          )}
        </View>
      ) : phase === 'cancelled' ? (
        <View style={styles.cta}>
          <Button title="Về trang chủ" variant="outline" onPress={onHome} />
        </View>
      ) : phase === 'notfound' ? (
        <View style={styles.cta}>
          <Button title={`Tìm lại ${providerLower}`} onPress={onRetry} loading={retrying} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  handleWrap: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray300 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, minHeight: 52 },
  headIcon: { marginRight: Spacing.md },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  ratingPill: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  chatBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  serviceCard: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.md },
  payRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: Spacing.md, paddingVertical: Spacing.sm },
  payHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  vDivider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: Colors.gray300 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  expanded: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
  lineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  cta: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, borderRadius: BorderRadius.md },
});

export default TrackingSheet;
