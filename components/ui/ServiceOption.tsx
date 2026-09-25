// ServiceOption — dòng chọn dịch vụ (Siêu tốc / Siêu rẻ / Đồng giá 25k) theo Figma bottom sheet đặt hàng
import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons, type IconName } from './Icon';

interface ServiceOptionProps {
  name: string;
  description?: string;
  price?: string;
  /** hiện thay cho price khi chưa đủ thông tin để tính giá (vd chưa chọn điểm đến) */
  priceHint?: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  onInfoPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ServiceOption: React.FC<ServiceOptionProps> = ({ name, description, price, priceHint, icon = Icons.scooter, selected, onPress, onInfoPress, style }) => (
  <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSelected, style]}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={30} color={Colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <View style={styles.nameRow}>
        <AppText weight="bold" size={15}>
          {name}
        </AppText>
        {onInfoPress ? (
          <Pressable onPress={onInfoPress} hitSlop={8} style={{ marginLeft: 6 }}>
            <Icon name={Icons.info} size={14} color={Colors.gray400} />
          </Pressable>
        ) : null}
      </View>
      {description ? (
        <AppText size={12} color={Colors.textSecondary}>
          {description}
        </AppText>
      ) : null}
    </View>
    {price ? (
      <AppText weight="bold" size={17} color={Colors.primary}>
        {price}
      </AppText>
    ) : priceHint ? (
      <AppText size={12} color={Colors.textMuted} align="right" style={styles.priceHint}>
        {priceHint}
      </AppText>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primarySoft },
  iconWrap: { width: 44, alignItems: 'center', marginRight: Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  priceHint: { maxWidth: 84 },
});

export default ServiceOption;
