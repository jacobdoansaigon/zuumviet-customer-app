import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = '077 996 3333',
}) => {
  const [focused, setFocused] = useState(false);

  const handleClear = () => onChangeText('');

  // Format phone number as user types: xxx xxx xxxx
  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    onChangeText(digits);
  };

  return (
    <View
      style={[
        styles.container,
        focused && styles.containerFocused,
      ]}
    >
      {/* Phone icon */}
      <Text style={styles.icon}>📞</Text>

      <TextInput
        style={styles.input}
        value={formatPhone(value)}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        keyboardType="phone-pad"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="done"
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 54,
    backgroundColor: Colors.white,
  },
  containerFocused: {
    borderColor: Colors.primary,
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.gray500,
  },
});
