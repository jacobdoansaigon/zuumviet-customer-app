// FloorAccessPicker — Dọn nhà: tầng + thang máy của MỘT đầu (nhà cũ hoặc nhà mới). Dùng ở cả
// app/booking/sender.tsx (điểm đi) và app/booking/receiver.tsx (điểm đến) vì mỗi đầu tính phụ phí riêng.
// Không có thang máy → tính phụ phí mỗi tầng từ tầng 2 trở lên (xem EXTRA_PRICES.movingFloorFee).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Stepper, SwitchRow } from '@/components/ui';

interface Props {
  label: string;
  floor: number;
  elevator: boolean;
  onFloorChange: (v: number) => void;
  onElevatorChange: (v: boolean) => void;
}

export const FloorAccessPicker: React.FC<Props> = ({ label, floor, elevator, onFloorChange, onElevatorChange }) => (
  <View style={styles.wrap}>
    <AppText weight="bold" size={14} style={{ marginBottom: Spacing.sm }}>
      {label}
    </AppText>
    <View style={styles.floorRow}>
      <View style={{ flex: 1 }}>
        <AppText size={15} weight="semiBold">
          {floor === 0 ? 'Tầng trệt' : `Tầng ${floor}`}
        </AppText>
        <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          Số tầng cần bốc xếp lên/xuống
        </AppText>
      </View>
      <Stepper value={floor} onChange={onFloorChange} min={0} max={30} />
    </View>
    {floor > 0 ? (
      <SwitchRow
        label="Có thang máy"
        sublabel="Không có thang máy sẽ tính thêm phụ phí mỗi tầng"
        value={elevator}
        onValueChange={onElevatorChange}
        style={{ marginTop: Spacing.sm }}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.lg },
  floorRow: { flexDirection: 'row', alignItems: 'center' },
});

export default FloorAccessPicker;
