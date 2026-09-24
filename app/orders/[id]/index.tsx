// Chi tiết chuyến đi — Figma Hoạt động 1.3 (đã đánh giá) / 1.4 (chưa đánh giá)
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import {
  AppHeader,
  AppText,
  Button,
  Dialog,
  EmptyState,
  Icon,
  Icons,
  RouteStops,
  Screen,
  Toast,
  type RouteStop,
} from '@/components/ui';
import type { ActivityOrder, ActivityStopStatus } from '@/constants/mockOrders';
import { fetchActivityOrder } from '@/components/activity/activityApi';
import { updateLocalRating, useRatingsVersion, withLocalRating } from '@/components/activity/ratingStore';
import {
  STATUS_LABEL,
  activeStatusLabel,
  formatDateTimeTitle,
  isActiveStatus,
  isCancelledStatus,
  isCompletedStatus,
} from '@/components/activity/orderUtils';
import { TripCodeBar } from '@/components/activity/TripCodeBar';
import { DriverRow } from '@/components/activity/DriverRow';
import { PaymentSummary } from '@/components/activity/PaymentSummary';
import { RatingStars } from '@/components/activity/RatingStars';
import { Pill } from '@/components/activity/Pill';

const STOP_STATUS: Record<ActivityStopStatus, { label: string; tone: RouteStop['statusTone'] }> = {
  pending: { label: 'Chờ lấy hàng', tone: 'default' },
  picked: { label: 'Đã lấy hàng', tone: 'success' },
  delivering: { label: 'Đang giao', tone: 'warning' },
  done: { label: 'Thành công', tone: 'success' },
  failed: { label: 'Giao thất bại - Đang hoàn trả', tone: 'danger' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id ?? '');
  const [order, setOrder] = useState<ActivityOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportVisible, setReportVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ratingsVersion = useRatingsVersion();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await fetchActivityOrder(orderId));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const view = useMemo(() => (order ? withLocalRating(order) : null), [order, ratingsVersion]);

  const goRate = (stars?: number) =>
    router.push(`/orders/${orderId}/rate${stars ? `?stars=${stars}` : ''}`);

  const header = (
    <AppHeader variant="light" title={view ? formatDateTimeTitle(view.createdAt) : 'Chi tiết chuyến đi'} />
  );

  if (loading && !view) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!view) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <EmptyState title="Không tìm thấy chuyến đi" actionLabel="Quay lại" onAction={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const stops: RouteStop[] = [
    {
      title: view.pickup.title,
      subtitle: view.pickup.address,
      type: 'pickup',
      status: view.pickup.status && isActiveStatus(view.status) ? STOP_STATUS[view.pickup.status].label : undefined,
      statusTone: view.pickup.status ? STOP_STATUS[view.pickup.status].tone : undefined,
    },
    ...view.dropoffs.map<RouteStop>((d) => ({
      title: d.title,
      subtitle: d.address,
      type: 'dropoff',
      status: d.status && !isCompletedStatus(view.status) ? STOP_STATUS[d.status].label : undefined,
      statusTone: d.status ? STOP_STATUS[d.status].tone : undefined,
    })),
  ];

  const cancelled = isCancelledStatus(view.status);
  const completed = isCompletedStatus(view.status);
  const active = isActiveStatus(view.status);
  const rating = view.rating;

  return (
    <Screen
      header={header}
      footer={<Button title="Báo sự cố" variant="danger" flat onPress={() => setReportVisible(true)} />}
      footerPadded={false}
      keyboardAvoiding={false}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TripCodeBar code={view.code} />

        <View style={styles.section}>
          {view.driver ? (
            <DriverRow driver={view.driver} />
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
              Huỷ chuyến · {STATUS_LABEL[view.status] ?? ''}
            </AppText>
          ) : active ? (
            <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.statusLine}>
              {activeStatusLabel(view.status)}
            </AppText>
          ) : null}

          <AppText size={13} color={Colors.textSecondary} style={styles.serviceLine}>
            {view.serviceName}
          </AppText>

          <RouteStops stops={stops} titleSize={15} />

          {view.note ? (
            <View style={styles.noteRow}>
              <Icon name={Icons.note} size={18} color={Colors.primary} />
              <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
                {view.note}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <PaymentSummary payment={view.payment} />
        </View>
        <View style={styles.divider} />

        {view.driver && completed ? (
          <View style={styles.section}>
            {rating && rating.stars > 0 ? (
              <>
                <AppText size={15}>Bạn đã đánh giá tài xế</AppText>
                <View style={styles.ratingRow}>
                  <RatingStars value={rating.stars} size={26} onChange={() => goRate(rating.stars)} />
                  <Pill
                    label={rating.favorite ? 'Yêu thích' : 'Thêm yêu thích'}
                    icon={rating.favorite ? Icons.heart : Icons.heartOutline}
                    onPress={() => updateLocalRating(view, { favorite: !rating.favorite, blocked: false })}
                  />
                </View>
                {rating.tags.length ? (
                  <View style={styles.tags}>
                    {rating.tags.map((t) => (
                      <Pill key={t} label={t} tone="plain" />
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <AppText size={15}>Chuyến đi của bạn thế nào?</AppText>
                <View style={styles.ratingRow}>
                  <RatingStars value={0} size={28} onChange={(v) => goRate(v)} />
                  <Pill
                    label={rating?.blocked ? 'Đã chặn' : 'Chặn'}
                    icon={Icons.block}
                    tone="danger"
                    filled={rating?.blocked}
                    onPress={() => updateLocalRating(view, { blocked: !rating?.blocked, favorite: false })}
                  />
                </View>
              </>
            )}
          </View>
        ) : null}
        {view.driver && completed ? <View style={styles.divider} /> : null}
      </ScrollView>

      <Dialog
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        title="Báo sự cố"
        message={`Bạn gặp sự cố với chuyến xe ${view.code}? Tư vấn viên ZuumViet sẽ liên hệ với bạn trong thời gian sớm nhất.`}
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setReportVisible(false) },
          {
            label: 'Gửi yêu cầu',
            variant: 'danger',
            onPress: () => {
              setReportVisible(false);
              setToast('Đã gửi báo sự cố. Chúng tôi sẽ liên hệ với bạn sớm.');
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={() => setToast(null)} />
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
