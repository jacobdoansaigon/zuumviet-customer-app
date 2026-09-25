// SeatPicker — sơ đồ ghế dùng chung cho Xe ghép & Mua vé xe: chạm để chọn/bỏ chọn, tối đa `max` ghế,
// 3 trạng thái (còn trống / đã chọn / đã có khách) + chú thích bên dưới.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { SeatDef } from '@/constants/mockIntercity';

interface SeatPickerProps {
  seats: SeatDef[];
  selected: string[];
  onToggle: (seat: SeatDef) => void;
  max?: number;
}

export const SeatPicker: React.FC<SeatPickerProps> = ({ seats, selected, onToggle, max = 6 }) => {
  const rows = Array.from(new Set(seats.map((s) => s.row)));
  return (
    <View>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row} style={styles.row}>
            {seats
              .filter((s) => s.row === row)
              .map((s) => {
                const isSelected = selected.includes(s.id);
                const disabled = s.taken || (!isSelected && selected.length >= max);
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => onToggle(s)}
                    disabled={s.taken}
                    style={[styles.seat, isSelected && styles.seatSelected, s.taken && styles.seatTaken, disabled && !s.taken && styles.seatDisabled]}
                    accessibilityLabel={`Ghế ${s.id}${s.taken ? ', đã có khách' : isSelected ? ', đang chọn' : ''}`}
                  >
                    {s.taken ? (
                      <Icon name={Icons.check} size={14} color={Colors.gray400} />
                    ) : (
                      <AppText size={13} weight="bold" color={isSelected ? Colors.white : Colors.text}>
                        {s.id}
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotFree]} />
          <AppText size={12} color={Colors.textSecondary}>
            Còn trống
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotSelected]} />
          <AppText size={12} color={Colors.textSecondary}>
            Đang chọn
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotTaken]} />
          <AppText size={12} color={Colors.textSecondary}>
            Đã có khách
          </AppText>
        </View>
      </View>
    </View>
  );
};

const SEAT_SIZE = 44;

const styles = StyleSheet.create({
  grid: { gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seatTaken: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.surfaceAlt },
  seatDisabled: { opacity: 0.4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 3 },
  dotFree: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  dotSelected: { backgroundColor: Colors.primary },
  dotTaken: { backgroundColor: Colors.surfaceAlt },
});

export default SeatPicker;
