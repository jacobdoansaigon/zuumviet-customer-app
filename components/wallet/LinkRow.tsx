// LinkRow — dòng link có icon + chevron ("Yêu cầu hỗ trợ", "Chi tiết giao dịch")
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';

interface LinkRowProps {
  label: string;
  icon?: IconName;
  onPress?: () => void;
}

export const LinkRow: React.FC<LinkRowProps> = ({ label, icon, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
    {icon ? <Icon name={icon} size={20} color={Colors.primary} style={{ marginRight: Spacing.md }} /> : null}
    <AppText size={15} weight="semiBold" style={{ flex: 1 }}>
      {label}
    </AppText>
    <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
  </Pressable>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
});

export default LinkRow;
