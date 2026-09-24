// CodeInput — 6 ô nhập OTP / passcode theo Figma (ô xám 48x48 bo 6, ô active viền tím + cursor,
// số nhập màu tím đậm; passcode hiển thị chấm)
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Sizes, Spacing } from '@/constants/theme';
import { AppText } from './Text';

interface CodeInputProps {
  value: string;
  onChangeText: (v: string) => void;
  length?: number;
  secure?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  onFilled?: (code: string) => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  value,
  onChangeText,
  length = 6,
  secure = false,
  autoFocus = true,
  error,
  onFilled,
}) => {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (value.length === length) onFilled?.(value);
  }, [value, length, onFilled]);

  const cells = Array.from({ length }, (_, i) => value[i] ?? '');
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable style={styles.row} onPress={() => ref.current?.focus()}>
      {cells.map((ch, i) => {
        const isActive = focused && i === activeIndex && value.length < length;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              isActive && styles.cellActive,
              !!ch && styles.cellFilled,
              error && styles.cellError,
            ]}
          >
            {ch ? (
              secure ? (
                <View style={styles.dot} />
              ) : (
                <AppText weight="bold" size={26} color={Colors.primaryDark}>
                  {ch}
                </AppText>
              )
            ) : isActive ? (
              <View style={styles.cursor} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
        caretHidden
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  cell: {
    width: Sizes.codeBox,
    height: Sizes.codeBox,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { backgroundColor: Colors.white, borderColor: Colors.primary },
  cellFilled: { backgroundColor: Colors.surfaceAlt },
  cellError: { borderColor: Colors.error },
  cursor: { width: 2, height: 24, backgroundColor: Colors.primary, borderRadius: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primaryDark },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, top: 0 },
});

export default CodeInput;
