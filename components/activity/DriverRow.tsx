// DriverRow — avatar 56 + tên đậm 16 + sao vàng (điểm trung bình thật) + "53A-888.88 · Honda Wave Đen" (Figma Hoạt động 1.3)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar } from '@/components/ui';
import type { OrderPartner, OrderVehicle } from '@/services/orders';
import { RatingStars } from './RatingStars';

interface DriverRowProps {
  partner: OrderPartner;
  vehicle?: OrderVehicle | null;
  right?: React.ReactNode;
}

export const DriverRow: React.FC<DriverRowProps> = ({ partner, vehicle, right }) => {
  const meta = vehicle ? [vehicle.plate, [vehicle.brand, vehicle.model].filter(Boolean).join(' '), vehicle.color].filter(Boolean).join(' · ') : '';
  const avg = partner.rating.average;
  return (
    <View style={styles.row}>
      <Avatar uri={partner.photoUrl} name={partner.fullName} size={56} />
      <View style={styles.texts}>
        <AppText weight="bold" size={16}>
          {partner.fullName}
        </AppText>
        <View style={styles.stars}>
          {avg != null ? (
            <>
              <RatingStars value={avg} size={14} gap={2} />
              <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 6 }}>
                {avg.toFixed(1)} · {partner.rating.count} đánh giá
              </AppText>
            </>
          ) : (
            <AppText size={12} color={Colors.textSecondary}>
              Chưa có đánh giá
            </AppText>
          )}
        </View>
        {meta ? (
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.base },
  texts: { flex: 1, marginLeft: Spacing.md },
  stars: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
});

export default DriverRow;
