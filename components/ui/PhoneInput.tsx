// PhoneInput — ô nhập SĐT theo Figma (icon điện thoại, placeholder 077 996 3333, nút xoá)
import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Sizes, NO_WEB_OUTLINE } from '@/constants/theme';
import { fontStyle } from './Text';
import { Icon, Icons } from './Icon';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  countryCode?: string;
}

export function formatPhoneVn(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = '077 996 3333',
  autoFocus,
}) => {
  const [focused, setFocused] = useState(false);
  const handleChange = (text: string) => onChangeText(text.replace(/\D/g, '').slice(0, 11));

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Icon name="mci:phone-outgoing-outline" size={22} color={Colors.primary} style={styles.icon} />
      <TextInput
        style={[styles.input, fontStyle('semiBold')]}
        value={formatPhoneVn(value)}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="done"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Icon name={Icons.closeCircle} size={18} color={Colors.gray400} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: Sizes.input,
  },
  containerFocused: { borderColor: Colors.primarySoft, backgroundColor: Colors.white },
  icon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 17, color: Colors.text, paddingVertical: 0, ...NO_WEB_OUTLINE },
});

export default PhoneInput;
