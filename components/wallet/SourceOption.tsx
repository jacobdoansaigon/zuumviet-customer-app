// SourceOption — thẻ chọn nguồn tiền (Momo / Tài khoản chính / Chuyển khoản ngân hàng) với check-circle bên phải
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';

interface SourceOptionProps {
  title: string;
  subtitle?: string;
  leading: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export const SourceOption: React.FC<SourceOptionProps> = ({ title, subtitle, leading, selected, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="radio"
    accessibilityState={{ selected: !!selected, disabled: !!disabled }}
    style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && !disabled && { opacity: 0.85 }]}
  >
    <View style={[styles.leading, disabled && { opacity: 0.6 }]}>{leading}</View>
    <View style={styles.texts}>
      <AppText weight="bold" size={16} color={disabled ? Colors.textMuted : Colors.text}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
    {!disabled ? (
      <Icon
        name={selected ? Icons.checkCircle : 'ion:ellipse-outline'}
        size={22}
        color={selected ? Colors.primary : Colors.gray400}
      />
    ) : null}
  </Pressable>
);

/** Vòng tròn tím nhạt chứa icon (dùng cho "Chuyển khoản ngân hàng") */
export const IconBubble: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; size?: number }> = ({ icon, size = 40 }) => (
  <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
    <Icon name={icon} size={size * 0.5} color={Colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  leading: { width: 40, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, marginLeft: Spacing.md, marginRight: Spacing.sm },
  bubble: { backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
});

export default SourceOption;
