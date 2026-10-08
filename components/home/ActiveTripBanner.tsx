// ActiveTripBanner — banner nổi trên tab bar (Figma Home): card trắng bo 12 shadow, icon dịch vụ tím,
// trạng thái 11 tím, địa chỉ bold 16, tên dịch vụ xám 13, giờ "12:19pm" xám phải. Dữ liệu: đơn scope=active mới nhất.
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, type IconName } from '@/components/ui';
import type { OrderListItem } from '@/services/orders';
import { activeStatusLabel, formatTime12, orderIcon } from '@/components/activity/orderUtils';

export type ActiveTripInfo = {
  id: string;
  status: string;
  address: string;
  service: string;
  time: string;
  icon: IconName;
};

/** Thông tin hiển thị của 1 đơn đang chạy */
export function describeActiveOrder(o: OrderListItem): ActiveTripInfo {
  const target = o.status === 'picked_up' ? (o.stops.find((s) => s.status === 'pending' || s.status === 'arrived')?.address ?? o.pickupAddress) : o.pickupAddress;
  return {
    id: o.id,
    status: activeStatusLabel(o.status),
    address: target,
    service: o.service.name,
    time: formatTime12(Date.parse(o.scheduledAt ?? o.createdAt)),
    icon: orderIcon(o),
  };
}

interface ActiveTripBannerProps {
  trip: ActiveTripInfo;
  onPress?: () => void;
  bottom?: number;
}

export const ActiveTripBanner: React.FC<ActiveTripBannerProps> = ({ trip, onPress, bottom = 12 }) => (
  <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}>
      <View style={styles.iconWrap}>
        <Icon name={trip.icon} size={28} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText size={11} weight="semiBold" color={Colors.primary}>
          {trip.status}
        </AppText>
        <AppText weight="bold" size={16} color={Colors.text} numberOfLines={1}>
          {trip.address}
        </AppText>
        <AppText size={13} color={Colors.textSecondary}>
          {trip.service}
        </AppText>
      </View>
      <AppText size={12} color={Colors.textSecondary} style={styles.time}>
        {trip.time}
      </AppText>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Spacing.screen, right: Spacing.screen, zIndex: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Shadow.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  time: { marginLeft: Spacing.sm, alignSelf: 'flex-start', marginTop: 2 },
});

export default ActiveTripBanner;
