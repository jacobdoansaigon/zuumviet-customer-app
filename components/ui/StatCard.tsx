// StatCard — thẻ số liệu nhỏ (icon vàng + số đậm + nhãn) — Figma Home "10 thành viên / 10 điểm thưởng"
import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, type IconName } from './Icon';

interface StatCardProps {
  icon: IconName;
  value: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, style, iconColor = Colors.secondary }) => (
  <View style={[styles.card, style]}>
    <Icon name={icon} size={26} color={iconColor} />
    <View style={{ marginLeft: Spacing.md }}>
      <AppText weight="bold" size={18} style={{ lineHeight: 22 }}>
        {value}
      </AppText>
      <AppText size={13} color={Colors.textSecondary}>
        {label}
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
});

export default StatCard;
