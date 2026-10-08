// Chi tiết chuyến đi — Figma Hoạt động 1.3 (đã đánh giá) / 1.4 (chưa đánh giá). Dữ liệu GET /v1/customer/orders/:id:
// tài xế (ảnh, điểm trung bình), xe, lộ trình + trạng thái từng điểm, thanh toán, đánh giá (canRate / rating).
// "Báo sự cố": API chưa có kênh báo sự cố → gọi tổng đài hỗ trợ. Yêu thích / chặn tài xế: chưa có trên API → ẩn.
import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Button, Dialog, EmptyState, Icon, Icons, RouteStops, Screen, Toast, type RouteStop } from '@/components/ui';
import { getOrder, isActiveStatus, ORDER_STATUS_LABEL, STOP_STATUS_LABEL, type OrderDetail, type StopStatus } from '@/services/orders';
import { formatPhone } from '@/services/session';
import { errorMessage } from '@/services/zuum';
import { activeStatusLabel, formatDateTimeTitle, isCancelledStatus, isCompletedStatus } from '@/components/activity/orderUtils';
import { TripCodeBar } from '@/components/activity/TripCodeBar';
import { DriverRow } from '@/components/activity/DriverRow';
import { PaymentSummary } from '@/components/activity/PaymentSummary';
import { RatingStars } from '@/components/activity/RatingStars';
import { Pill } from '@/components/activity/Pill';
import { SUPPORT_HOTLINE as SUPPORT_PHONE } from '@/constants/content';


const STOP_TONE: Record<StopStatus, RouteStop['statusTone']> = {
  pending: 'default',
  arrived: 'warning',
  delivered: 'success',
  failed: 'danger',
  returned: 'primary',
};

const CANCELLED_BY: Record<string, string> = { customer: 'Bạn đã huỷ', partner: 'Tài xế huỷ', staff: 'ZuumViet huỷ', system: 'Hệ thống huỷ' };

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id ?? '');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await getOrder(orderId));
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e, 'Không tải được chuyến đi'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const goRate = (stars?: number) => router.push(`/orders/${orderId}/rate${stars ? `?stars=${stars}` : ''}`);

  const header = <AppHeader variant="light" title={order ? formatDateTimeTitle(Date.parse(order.timeline.createdAt)) : 'Chi tiết chuyến đi'} />;

  if (loading && !order) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <EmptyState title={loadError ?? 'Không tìm thấy chuyến đi'} actionLabel="Quay lại" onAction={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const picked = order.status === 'picked_up' || order.status === 'completed';
  const stops: RouteStop[] = [
    {
      title: order.pickup.contactName ? `${order.pickup.contactName} · ${formatPhone(order.pickup.contactPhone)}` : order.pickup.address,
      subtitle: order.pickup.contactName ? order.pickup.address : undefined,
      type: 'pickup',
      status: isActiveStatus(order.status) && picked ? order.steps.pickUp : undefined,
      statusTone: picked ? 'success' : undefined,
    },
    ...order.stops.map<RouteStop>((s) => ({
      title: s.contactName ? `${s.contactName} · ${formatPhone(s.contactPhone)}` : s.address,
      subtitle: s.contactName ? s.address : s.failReason ?? undefined,
      type: 'dropoff',
      status: s.status !== 'pending' ? STOP_STATUS_LABEL[s.status] : undefined,
      statusTone: STOP_TONE[s.status],
    })),
  ];

  const cancelled = isCancelledStatus(order.status);
  const completed = isCompletedStatus(order.status);
  const active = isActiveStatus(order.status);
  const rating = order.rating;

  return (
    <Screen
      header={header}
      footer={
        active || order.status === 'no_driver_found' ? (
          <Button title="Theo dõi chuyến" flat onPress={() => router.push({ pathname: '/booking/tracking', params: { orderId: order.id } })} />
        ) : (
          <Button title="Báo sự cố" variant="danger" flat onPress={() => setReportVisible(true)} />
        )
      }
      footerPadded={false}
      keyboardAvoiding={false}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TripCodeBar code={order.code} />

        <View style={styles.section}>
          {order.partner ? (
            <DriverRow partner={order.partner} vehicle={order.vehicle} />
          ) : (
            <View style={styles.noDriver}>
              <Icon name={Icons.profile} size={22} color={Colors.textSecondary} />
              <AppText size={14} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }}>
                {active ? 'Đang tìm tài xế cho chuyến đi' : 'Chuyến đi chưa có tài xế nhận'}
              </AppText>
            </View>
          )}

          {cancelled ? (
            <AppText size={13} weight="semiBold" color={Colors.error} style={styles.statusLine}>
              {order.status === 'cancelled'
                ? ['Huỷ chuyến', order.cancellation?.by ? CANCELLED_BY[order.cancellation.by] : '', order.cancellation?.reason?.label ?? '']
                    .filter(Boolean)
                    .join(' · ')
                : ORDER_STATUS_LABEL[order.status]}
            </AppText>
          ) : active ? (
            <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.statusLine}>
              {activeStatusLabel(order.status)}
            </AppText>
          ) : null}
          {order.cancellation && order.cancellation.fee > 0 ? (
            <AppText size={13} color={Colors.error} style={styles.statusLine}>
              Phí huỷ: {order.cancellation.fee.toLocaleString('vi-VN')}đ
            </AppText>
          ) : null}

          <AppText size={13} color={Colors.textSecondary} style={styles.serviceLine}>
            {order.service.name}
            {order.distanceMeters > 0 ? ` · ${(order.distanceMeters / 1000).toFixed(1)}km` : ''}
          </AppText>

          <RouteStops stops={stops} titleSize={15} />

          {order.note ? (
            <View style={styles.noteRow}>
              <Icon name={Icons.note} size={18} color={Colors.primary} />
              <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
                {order.note}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <PaymentSummary method={order.paymentMethod} tip={order.tip} total={order.total} />
        </View>
        <View style={styles.divider} />

        {order.partner && completed ? (
          <View style={styles.section}>
            {rating ? (
              <>
                <AppText size={15}>Bạn đã đánh giá tài xế</AppText>
                <View style={styles.ratingRow}>
                  <RatingStars value={rating.stars} size={26} />
                </View>
                {rating.tags.length ? (
                  <View style={styles.tags}>
                    {rating.tags.map((t) => (
                      <Pill key={t} label={t} tone="plain" />
                    ))}
                  </View>
                ) : null}
                {rating.comment ? (
                  <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
                    “{rating.comment}”
                  </AppText>
                ) : null}
              </>
            ) : order.canRate ? (
              <>
                <AppText size={15}>Chuyến đi của bạn thế nào?</AppText>
                <View style={styles.ratingRow}>
                  <RatingStars value={0} size={28} onChange={(v) => goRate(v)} />
                </View>
              </>
            ) : (
              <AppText size={13} color={Colors.textSecondary}>
                Đã hết thời gian đánh giá chuyến đi này.
              </AppText>
            )}
          </View>
        ) : null}
        {order.partner && completed ? <View style={styles.divider} /> : null}
      </ScrollView>

      <Dialog
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        title="Báo sự cố"
        message={`Bạn gặp sự cố với chuyến ${order.code}? Gọi tổng đài ZuumViet ${SUPPORT_PHONE} để được hỗ trợ ngay.`}
        actions={[
          { label: 'Đóng', variant: 'secondary', onPress: () => setReportVisible(false) },
          {
            label: 'Gọi tổng đài',
            variant: 'danger',
            onPress: () => {
              setReportVisible(false);
              Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => setToast('Không thể thực hiện cuộc gọi trên thiết bị này'));
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.xl },
  section: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.gray300, marginHorizontal: Spacing.screen },
  noDriver: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.base },
  statusLine: { marginBottom: Spacing.xs },
  serviceLine: { marginBottom: Spacing.md },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
});
