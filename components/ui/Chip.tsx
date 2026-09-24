// Chip — pill filter (Tất cả / Đặt xe / Giao hàng...) & tag chip (Rất hài lòng...)
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  /** style 'filled' = tím đặc khi active (filter); 'soft' = viền tím + nền lavender khi active (tag) */
  variant?: 'filled' | 'soft';
}

export const Chip: React.FC<ChipProps> = ({ label, active, onPress, icon, size = 'md', style, variant = 'filled' }) => {
  const filledActive = active && variant === 'filled';
  const softActive = active && variant === 'soft';
  const fg = filledActive ? Colors.white : softActive ? Colors.primary : Colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        filledActive && styles.filledActive,
        softActive && styles.softActive,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={fg} style={styles.icon} /> : null}
      <AppText weight={active ? 'bold' : 'semiBold'} size={size === 'sm' ? 12 : 14} color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSm: { height: 32, paddingHorizontal: Spacing.md },
  filledActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  softActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  icon: { marginRight: 6 },
});

export default Chip;
