// Stepper — bộ đếm − n + (Figma: Xác nhận giao hàng: "Gửi tận tay khách hàng", "Tiền tip")
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons } from './Icon';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export const Stepper: React.FC<StepperProps> = ({ value, onChange, min = 0, max = 99 }) => {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <View style={styles.row}>
      <Pressable onPress={() => canDec && onChange(value - 1)} hitSlop={6} disabled={!canDec}>
        <Icon name={Icons.minusCircle} size={28} color={canDec ? Colors.primary : Colors.gray300} />
      </Pressable>
      <AppText weight="bold" size={18} style={styles.value}>
        {value}
      </AppText>
      <Pressable onPress={() => canInc && onChange(value + 1)} hitSlop={6} disabled={!canInc}>
        <Icon name={Icons.plusCircle} size={28} color={canInc ? Colors.primary : Colors.gray300} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  value: { minWidth: 28, textAlign: 'center' },
});

export default Stepper;
