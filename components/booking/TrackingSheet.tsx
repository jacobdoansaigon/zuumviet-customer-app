// TrackingSheet — nội dung bottom sheet màn theo dõi đơn theo trạng thái (Figma 1.5 đang tìm / không tìm thấy / tìm thấy / đang giao / mở rộng)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Avatar, Button, Icon, Icons, RouteStops, ServiceOption, type RouteStop } from '@/components/ui';
import { STOP_STATUS_TEXT, SERVICE_GROUPS, type ServiceLabels } from '@/constants/mockBooking';
import { formatVnd, formatScheduleLabel, getTrackingPhase, type TrackedOrder, type TrackingPhase, type StopStatus } from '@/services/bookingStore';

const STOP_TONE: Record<StopStatus, RouteStop['statusTone']> = {
  new: 'default',
  picking: 'default',
  picked: 'success',
  delivering: 'warning',
  completed: 'success',
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

interface Props {
  order: TrackedOrder;
  expanded: boolean;
  onToggle: () => void;
  onMore: () => void;
  onRetry: () => void;
  onCall: () => void;
  onChat: () => void;
  onRate: () => void;
  onHome: () => void;
}

export const TrackingSheet: React.FC<Props> = ({ order, expanded, onToggle, onMore, onRetry, onCall, onChat, onRate, onHome }) => {
  const phase = getTrackingPhase(order);
  const group = SERVICE_GROUPS[order.service];
  const L = group.labels;
  const providerLower = L.provider.toLowerCase();
  const option = group.options.find((o) => o.id === order.optionId);
  const showDriver = !!order.driver && (phase === 'accepted' || phase === 'delivering' || phase === 'completed');

  const stops: RouteStop[] = [
    {
      type: 'pickup',
      title: order.pickup.name ? `${order.pickup.name} - ${order.pickup.phone}` : order.pickup.address,
      subtitle: order.pickup.address,
      status: STOP_STATUS_TEXT[order.pickup.status],
      statusTone: STOP_TONE[order.pickup.status],
    },
    ...order.stops.map<RouteStop>((s) => ({
      type: 'dropoff',
      title: s.name ? `${s.name} - ${s.phone}` : s.address,
      subtitle: s.address,
      status: STOP_STATUS_TEXT[s.status],
      statusTone: STOP_TONE[s.status],
    })),
  ];

  const more = (
    <Pressable onPress={onMore} hitSlop={10} accessibilityLabel="Thêm">
      <Icon name={Icons.more} size={22} color={Colors.text} />
    </Pressable>
  );

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
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={15}>
                Đơn hàng sẽ được lên lịch lúc {formatScheduleLabel(order.scheduledAt)}
              </AppText>
              {order.returnAt ? (
                <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                  Khứ hồi · về lúc {formatScheduleLabel(order.returnAt)}
                </AppText>
              ) : null}
            </View>
            {more}
          </>
        ) : phase === 'notfound' ? (
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={16}>
              Không tìm thấy {providerLower}
            </AppText>
            <Pressable onPress={onRetry} hitSlop={8} style={{ marginTop: 4 }}>
              <AppText weight="semiBold" size={14} color={Colors.primary}>
                Thử lại tìm kiếm
              </AppText>
            </Pressable>
          </View>
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
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              Đơn hàng đã bị huỷ
            </AppText>
          </>
        ) : (
          <>
            <AppText weight="bold" size={15} style={{ flex: 1 }}>
              {phase === 'accepted' ? L.trackingEta.replace('{eta}', String(order.etaMinutes)) : L.trackingDelivering}
            </AppText>
            {more}
          </>
        )}
      </View>

      {showDriver && order.driver ? (
        <View style={styles.driverRow}>
          <Avatar name={order.driver.name} uri={order.driver.avatar} size={40} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <AppText weight="bold" size={17}>
              {order.driver.name}
            </AppText>
            <AppText size={13} color={Colors.textSecondary}>
              {order.driver.plate}
            </AppText>
          </View>
          <Pressable onPress={onCall} style={styles.callBtn} accessibilityLabel="Gọi tài xế">
            <Icon name={Icons.phone} size={20} color={Colors.white} />
          </Pressable>
          <Pressable onPress={onChat} style={styles.chatBtn} accessibilityLabel="Nhắn tin tài xế">
            <Icon name={Icons.chat} size={20} color={Colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.serviceCard}>
        <ServiceOption name={order.serviceName} description={order.serviceDescription} price={formatVnd(order.total)} icon={option?.icon ?? Icons.scooter} selected />
      </View>

      <View style={styles.payRow}>
        <View style={styles.payHalf}>
          <Icon name={Icons.ticket} size={20} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {order.promoLabel ?? 'Không áp dụng mã'}
          </AppText>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.payHalf}>
          <Icon name={order.paymentMethod === 'wallet' ? Icons.wallet : Icons.cash} size={20} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {order.paymentMethod === 'wallet' ? 'Tài khoản' : 'Tiền mặt'}
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
          {order.distanceKm > 0 ? (
            <AppText weight="bold" size={13} style={{ marginBottom: Spacing.sm }}>
              Đoạn đường {order.distanceKm.toFixed(1)}km
            </AppText>
          ) : null}
          <RouteStops stops={stops} titleSize={14} />
          {order.returnAt ? (
            <AppText weight="semiBold" size={13} color={Colors.primary} style={{ marginTop: Spacing.sm }}>
              Khứ hồi · về lúc {formatScheduleLabel(order.returnAt)}
            </AppText>
          ) : null}
          <AppText weight="bold" size={14} style={{ marginTop: Spacing.md }}>
            Ghi chú
          </AppText>
          <AppText size={14} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {order.note || 'Không có ghi chú'}
          </AppText>
        </View>
      ) : null}

      {phase === 'completed' ? (
        <View style={styles.cta}>
          <Button title={`Đánh giá ${providerLower}`} onPress={onRate} />
        </View>
      ) : phase === 'cancelled' ? (
        <View style={styles.cta}>
          <Button title="Về trang chủ" variant="outline" onPress={onHome} />
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
  cta: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, borderRadius: BorderRadius.md },
});

export default TrackingSheet;
