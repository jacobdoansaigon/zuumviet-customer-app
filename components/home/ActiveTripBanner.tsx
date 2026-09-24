// ActiveTripBanner — banner nổi trên tab bar (Figma Home): card trắng bo 12 shadow,
// icon scooter tím, "Đang tìm chuyến xe" 11 tím, địa chỉ bold 16, "Xe máy" xám 13, giờ "12:19pm" xám phải
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { ORDER_STATUS, type DeliveryOrder } from '@/services/api';
import { formatTime12h } from '@/constants/mock';

export type ActiveTripInfo = {
  id: number;
  status: string;
  address: string;
  service: string;
  time: string;
};

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      const nested = v as Record<string, unknown>;
      const addr = nested.address ?? nested.full_address ?? nested.name;
      if (typeof addr === 'string' && addr.trim()) return addr.trim();
    }
  }
  return '';
}

/** Rút thông tin hiển thị từ đơn BE (tên field khác nhau tuỳ version → thử nhiều key) */
export function describeActiveOrder(o: DeliveryOrder): ActiveTripInfo {
  const status = Number(o.status);
  const statusLabel =
    status === ORDER_STATUS.NEW || status === ORDER_STATUS.ASSIGNING
      ? 'Đang tìm chuyến xe'
      : status === ORDER_STATUS.ACCEPTED
        ? 'Tài xế đang đến lấy hàng'
        : status === ORDER_STATUS.BOARDED
          ? 'Tài xế đã đến nơi'
          : 'Đang giao hàng';

  const address =
    pickString(o, ['pickup_address', 'from_address', 'sender_address', 'address', 'pickup', 'from']) || `Đơn hàng #${o.id}`;
  const service = pickString(o, ['service_name', 'service', 'vehicle_type_name', 'vehicle_name']) || 'Giao hàng';

  const created = Number(o.date_created ?? o.created_at ?? 0);
  const date = created > 0 ? new Date(created > 1e12 ? created : created * 1000) : new Date();

  return { id: o.id, status: statusLabel, address, service, time: formatTime12h(date) };
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
        <Icon name={Icons.scooter} size={28} color={Colors.primary} />
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
