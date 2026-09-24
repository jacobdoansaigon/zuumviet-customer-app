// Button — theo Figma Form/Button: primary (tím), disabled (xám), outline, danger (đỏ), teal, dark
import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Sizes } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, type IconName } from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary' // xám nhạt nền, chữ đậm (nút phụ như "Hủy")
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'teal'
  | 'tealSoft'
  | 'dark'
  | 'white';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  /** nút bám đáy màn hình, không bo góc (kiểu "Tiếp tục"/"Xác nhận" trong Figma) */
  flat?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** badge nhỏ góc trên phải (vd: "15s" countdown) */
  badge?: string;
  testID?: string;
}

const BG: Record<ButtonVariant, string> = {
  primary: Colors.primary,
  secondary: Colors.gray200,
  outline: 'transparent',
  ghost: 'transparent',
  danger: Colors.error,
  teal: Colors.success,
  tealSoft: '#8FCFD9',
  dark: Colors.dark,
  white: Colors.white,
};

const FG: Record<ButtonVariant, string> = {
  primary: Colors.white,
  secondary: Colors.textSecondary,
  outline: Colors.primary,
  ghost: Colors.primary,
  danger: Colors.white,
  teal: Colors.white,
  tealSoft: Colors.text,
  dark: Colors.white,
  white: Colors.primary,
};

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 44, lg: Sizes.button };

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
  flat = false,
  iconLeft,
  iconRight,
  badge,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const bg = isDisabled && variant !== 'outline' && variant !== 'ghost' ? Colors.buttonDisabledBg : BG[variant];
  const fg = isDisabled ? Colors.buttonDisabledText : FG[variant];
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 16;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { height: flat ? HEIGHT[size] + 6 : HEIGHT[size], backgroundColor: bg },
        variant === 'outline' && !isDisabled && styles.outline,
        variant === 'outline' && isDisabled && styles.outlineDisabled,
        variant === 'white' && styles.white,
        flat ? styles.flat : { borderRadius: BorderRadius.md },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <Icon name={iconLeft} size={fontSize + 4} color={fg} style={styles.iconLeft} /> : null}
          <AppText weight="bold" size={fontSize} color={fg} style={[styles.text, textStyle]}>
            {title}
          </AppText>
          {iconRight ? <Icon name={iconRight} size={fontSize + 4} color={fg} style={styles.iconRight} /> : null}
        </View>
      )}
      {badge ? (
        <View style={styles.badge}>
          <AppText weight="bold" size={14} color={Colors.white}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
  },
  flat: { borderRadius: 0 },
  fullWidth: { width: '100%' },
  outline: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: 'transparent' },
  outlineDisabled: { borderWidth: 1.5, borderColor: Colors.gray300, backgroundColor: 'transparent' },
  white: { borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  badge: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
