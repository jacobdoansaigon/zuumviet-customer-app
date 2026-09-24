// DriverRow — avatar 56 + tên đậm 16 + sao vàng + "53A-888.88 · Civic Trắng" (Figma Hoạt động 1.3)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar } from '@/components/ui';
import type { ActivityDriver } from '@/constants/mockOrders';
import { RatingStars } from './RatingStars';

interface DriverRowProps {
  driver: ActivityDriver;
  right?: React.ReactNode;
}

export const DriverRow: React.FC<DriverRowProps> = ({ driver, right }) => {
  const meta = [driver.plate, driver.vehicle].filter(Boolean).join(' · ');
  return (
    <View style={styles.row}>
      <Avatar uri={driver.avatar} name={driver.name} size={56} />
      <View style={styles.texts}>
        <AppText weight="bold" size={16}>
          {driver.name}
        </AppText>
        <View style={styles.stars}>
          <RatingStars value={driver.rating} size={14} gap={2} />
          <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 6 }}>
            {driver.rating.toFixed(1)}
            {driver.reviews ? ` · ${driver.reviews} đánh giá` : ''}
          </AppText>
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
