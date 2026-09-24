// TextField — input theo Figma Form Components: nền xám #F2F2F2 bo 8, focus → nền trắng + viền lavender,
// label trên + dấu (*) đỏ bên phải, nút xoá, suffix/icon phải, helper/error.
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Sizes } from '@/constants/theme';
import { AppText, fontStyle } from './Text';
import { Icon, Icons, type IconName } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  onIconRightPress?: () => void;
  suffix?: string; // vd "đ"
  clearable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** hiển thị dạng dropdown (caret) — bấm cả ô */
  dropdown?: boolean;
  onPress?: () => void;
  bold?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  required,
  helper,
  error,
  iconLeft,
  iconRight,
  onIconRightPress,
  suffix,
  clearable = true,
  containerStyle,
  inputStyle,
  disabled,
  dropdown,
  onPress,
  bold,
  value,
  onChangeText,
  onFocus,
  onBlur,
  editable,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value && value.length > 0;
  const showClear = clearable && hasValue && focused && !disabled && !dropdown;

  const box = (
    <View
      style={[
        styles.box,
        focused && styles.boxFocused,
        !!error && styles.boxError,
        disabled && styles.boxDisabled,
        inputStyle,
      ]}
    >
      {iconLeft ? <Icon name={iconLeft} size={20} color={Colors.primary} style={styles.iconLeft} /> : null}
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        editable={editable ?? (!disabled && !dropdown)}
        pointerEvents={dropdown ? 'none' : undefined}
        placeholderTextColor={Colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          fontStyle(bold ? 'bold' : 'medium'),
          disabled && { color: Colors.textSecondary },
        ]}
      />
      {suffix ? (
        <AppText weight="bold" size={15} color={Colors.text} style={styles.suffix}>
          {suffix}
        </AppText>
      ) : null}
      {showClear ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={8} style={styles.rightBtn}>
          <Icon name={Icons.closeCircle} size={18} color={Colors.gray400} />
        </Pressable>
      ) : null}
      {dropdown ? (
        <Icon name={Icons.caretDown} size={14} color={Colors.textSecondary} style={styles.rightBtn} />
      ) : null}
      {iconRight && !showClear && !dropdown ? (
        <Pressable onPress={onIconRightPress} hitSlop={8} style={styles.rightBtn} disabled={!onIconRightPress}>
          <Icon name={iconRight} size={22} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText size={13} weight="medium" color={Colors.text}>
            {label}
          </AppText>
          {required ? (
            <AppText size={12} color={Colors.error}>
              (*)
            </AppText>
          ) : null}
        </View>
      ) : null}
      {dropdown || onPress ? (
        <Pressable onPress={onPress} disabled={disabled}>
          {box}
        </Pressable>
      ) : (
        box
      )}
      {error ? (
        <View style={styles.helperRow}>
          <Icon name={Icons.alert} size={14} color={Colors.error} />
          <AppText size={12} color={Colors.error}>
            {error}
          </AppText>
        </View>
      ) : helper ? (
        <AppText size={11} color={Colors.textSecondary} style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Sizes.input,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
  },
  boxFocused: { backgroundColor: Colors.white, borderColor: Colors.primarySoft },
  boxError: { borderColor: Colors.error, backgroundColor: Colors.white },
  boxDisabled: { opacity: 0.7 },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
    height: Sizes.input - 3,
  },
  iconLeft: { marginRight: Spacing.sm },
  rightBtn: { marginLeft: Spacing.sm },
  suffix: { marginLeft: Spacing.sm },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helper: { marginTop: 2 },
});

export default TextField;
