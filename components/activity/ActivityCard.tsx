// Card hoạt động theo Figma Hoạt động 1.2:
//  - ActiveTripCard: trắng, viền tím-300, ngày | giờ đậm, dịch vụ, trạng thái tím, lộ trình
//  - HistoryTripCard: nền xám #F7F7F7, trạng thái ("Huỷ chuyến" đỏ), điểm đến đậm 16, dịch vụ, ngày/giờ phải
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Palette, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, RouteStops, type RouteStop } from '@/components/ui';
import type { ActivityOrder } from '@/constants/mockOrders';
import {
  activeStatusLabel,
  formatDateBar,
  formatDayLabel,
  formatTime12,
  historyStatusLabel,
  isCancelledStatus,
  isCompletedStatus,
  serviceIcon,
} from './orderUtils';

interface CardProps {
  order: ActivityOrder;
  onPress?: () => void;
}

export const ActiveTripCard: React.FC<CardProps> = ({ order, onPress }) => {
  const when = order.scheduledAt ?? order.createdAt;
  const stops: RouteStop[] = [
    { title: order.pickup.title, type: 'pickup' },
    ...order.dropoffs.map((d) => ({ title: d.title, type: 'dropoff' as const })),
  ];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.active, pressed && styles.pressed]}>
      <View style={styles.headRow}>
        <View style={styles.iconBox}>
          <Icon name={serviceIcon(order.service)} size={28} color={Colors.primary} />
        </View>
        <View style={styles.headTexts}>
          <AppText weight="bold" size={14}>
            {formatDateBar(when)}
          </AppText>
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {order.scheduledAt ? `${order.serviceName} · Đặt lịch` : order.serviceName}
          </AppText>
        </View>
        <AppText size={11} weight="semiBold" color={Colors.primary} style={styles.status}>
          {activeStatusLabel(order.status)}
        </AppText>
      </View>
      <View style={styles.route}>
        <RouteStops stops={stops} compact titleSize={14} />
      </View>
    </Pressable>
  );
};

export const HistoryTripCard: React.FC<CardProps> = ({ order, onPress }) => {
  const cancelled = isCancelledStatus(order.status);
  const completed = isCompletedStatus(order.status);
  const destination = order.dropoffs[order.dropoffs.length - 1]?.title ?? order.pickup.title;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.history, pressed && styles.pressed]}>
      <View style={styles.headRow}>
        <View style={styles.iconBox}>
          <Icon name={serviceIcon(order.service)} size={28} color={Colors.primary} />
        </View>
        <View style={styles.headTexts}>
          {!completed ? (
            <AppText size={11} weight="semiBold" color={cancelled ? Colors.error : Colors.textSecondary}>
              {historyStatusLabel(order.status)}
            </AppText>
          ) : null}
          <AppText weight="bold" size={16} numberOfLines={1}>
            {destination}
          </AppText>
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {order.serviceName}
          </AppText>
        </View>
        <View style={styles.dateCol}>
          <AppText size={12} color={Colors.textSecondary}>
            {formatDayLabel(order.createdAt)}
          </AppText>
          <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {formatTime12(order.createdAt)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  active: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Palette.primary[300],
  },
  history: {
    backgroundColor: Colors.gray100,
  },
  pressed: { opacity: 0.9 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 36, alignItems: 'center', marginRight: Spacing.md, paddingTop: 2 },
  headTexts: { flex: 1 },
  status: { marginLeft: Spacing.sm, marginTop: 2 },
  dateCol: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  route: { marginTop: Spacing.md, marginLeft: 36 + Spacing.md - 4 },
});
