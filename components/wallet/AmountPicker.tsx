// AmountPicker — "Số tiền muốn nạp/rút": lưới chip 3 cột + ô nhập có hậu tố "đ" + helper/error (Figma Nạp tiền)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, TextField } from '@/components/ui';
import { formatVnd, parseAmountInput } from './walletUtils';

interface AmountPickerProps {
  title: string;
  presets: number[];
  amount: number;
  onChange: (amount: number) => void;
  helper?: string;
  error?: string;
}

export const AmountPicker: React.FC<AmountPickerProps> = ({ title, presets, amount, onChange, helper, error }) => (
  <View>
    <AppText weight="bold" size={15} style={styles.title}>
      {title}
    </AppText>
    <View style={styles.grid}>
      {presets.map((p) => {
        const selected = amount === p;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <AppText weight={selected ? 'bold' : 'semiBold'} size={14} color={selected ? Colors.primary : Colors.text}>
              {formatVnd(p)}đ
            </AppText>
          </Pressable>
        );
      })}
    </View>
    <TextField
      placeholder="Nhập số tiền"
      keyboardType="number-pad"
      value={amount > 0 ? formatVnd(amount) : ''}
      onChangeText={(t) => onChange(parseAmountInput(t))}
      suffix="đ"
      helper={helper}
      error={error}
      bold
      containerStyle={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  title: { marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    width: '31.5%',
    flexGrow: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  input: { marginTop: Spacing.md },
});

export default AmountPicker;
