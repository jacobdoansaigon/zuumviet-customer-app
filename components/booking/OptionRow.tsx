// OptionRow — dòng tuỳ chọn trên màn Xác nhận giao hàng: icon tím + nhãn + giá phụ + control phải (checkbox / stepper / "Bây giờ >")
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';

interface Props {
  icon: IconName;
  label: string;
  /** dòng phụ (giá: "đ35.000 / lần" hoặc "2 tài xế") */
  sub?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
}

export const OptionRow: React.FC<Props> = ({ icon, label, sub, value, right, onPress, chevron, divider = true }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, divider && styles.divider, pressed && onPress && { backgroundColor: Colors.primaryBg }]}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={22} color={Colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <AppText weight="semiBold" size={15}>
        {label}
      </AppText>
      {sub ? (
        <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          {sub}
        </AppText>
      ) : null}
    </View>
    {right}
    {value ? (
      <AppText size={15} weight="medium" color={Colors.text} style={{ marginLeft: Spacing.sm }}>
        {value}
      </AppText>
    ) : null}
    {chevron ? <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} style={{ marginLeft: 4 }} /> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  iconWrap: { width: 34, alignItems: 'flex-start' },
});

export default OptionRow;
