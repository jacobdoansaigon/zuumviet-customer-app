// Badge — nhãn trạng thái nhỏ (pill) & badge số
import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purpleSoft' | 'dark';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  primary: { bg: Colors.primary, fg: Colors.white },
  success: { bg: Colors.successBg, fg: Colors.successDark },
  warning: { bg: Colors.warningBg, fg: '#A5700A' },
  danger: { bg: Colors.errorBg, fg: Colors.error },
  neutral: { bg: Colors.gray200, fg: Colors.textSecondary },
  purpleSoft: { bg: Colors.primaryBg, fg: Colors.primary },
  dark: { bg: Colors.gray900, fg: Colors.white },
};

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'primary', size = 'md', style }) => {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, size === 'sm' && styles.sm, { backgroundColor: t.bg }, style]}>
      <AppText weight="bold" size={size === 'sm' ? 11 : 13} color={t.fg}>
        {label}
      </AppText>
    </View>
  );
};

export const CountBadge: React.FC<{ count: number; style?: StyleProp<ViewStyle> }> = ({ count, style }) => (
  <View style={[styles.count, style]}>
    <AppText weight="bold" size={11} color={Colors.white}>
      {count > 99 ? '99+' : count}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { height: 22, paddingHorizontal: Spacing.sm },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
});

export default Badge;
