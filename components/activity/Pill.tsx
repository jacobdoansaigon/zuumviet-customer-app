// Pill — nút viền tròn nhỏ: "♥ Yêu thích", "⊘ Chặn", tag "Rất hài lòng"
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, type IconName } from '@/components/ui';

interface PillProps {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  /** outline tím (mặc định) | danger viền đỏ | plain trắng viền xám (tag) */
  tone?: 'primary' | 'danger' | 'plain';
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Pill: React.FC<PillProps> = ({ label, icon, onPress, tone = 'primary', filled, style }) => {
  const accent = tone === 'danger' ? Colors.error : tone === 'plain' ? Colors.border : Colors.primary;
  const fg = filled ? Colors.white : tone === 'plain' ? Colors.text : accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pill,
        { borderColor: accent, backgroundColor: filled ? accent : Colors.white },
        pressed && onPress && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={fg} style={styles.icon} /> : null}
      <AppText weight="semiBold" size={13} color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  icon: { marginRight: 5 },
});

export default Pill;
