// DriverRow — dòng tài xế yêu thích (Figma Tài xế yêu thích): avatar 40, tên bold 15,
// "53A-888.88  Civic Trắng" xám 12; phải "4.9 ★" + "156 đánh giá" xám 11; tim đỏ (bấm để bỏ yêu thích)
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, Icon, Icons } from '@/components/ui';
import type { FavoriteDriver } from '@/constants/mock';

interface DriverRowProps {
  driver: FavoriteDriver;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

export const DriverRow: React.FC<DriverRowProps> = ({ driver, onToggleFavorite, onPress }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: Colors.primaryBg }]}>
    <Avatar uri={driver.avatar} name={driver.name} size={40} />
    <View style={styles.texts}>
      <AppText weight="bold" size={15} color={Colors.text} numberOfLines={1}>
        {driver.name}
      </AppText>
      <AppText size={12} color={Colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
        {driver.plate}  {driver.car}
      </AppText>
    </View>
    <View style={styles.rating}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppText weight="bold" size={14} color={Colors.text}>
          {driver.rating.toFixed(1)}
        </AppText>
        <Icon name={Icons.star} size={14} color={Colors.secondary} style={{ marginLeft: 3 }} />
      </View>
      <AppText size={11} color={Colors.textSecondary}>
        {driver.reviews} đánh giá
      </AppText>
    </View>
    <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.heart} accessibilityLabel="Bỏ yêu thích">
      <Icon name={Icons.heart} size={22} color={Colors.error} />
    </Pressable>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  texts: { flex: 1, marginLeft: Spacing.md },
  rating: { alignItems: 'flex-end', marginRight: Spacing.md },
  heart: { padding: 4 },
});

export default DriverRow;
