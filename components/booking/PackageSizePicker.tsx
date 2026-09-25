// PackageSizePicker — 4 ô kích cỡ gói hàng: Siêu nhỏ / Nhỏ / Vừa / Lớn (Figma GH 1.4.1)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { PACKAGE_SIZES, type PackageSizeId, type PackageSizeDef } from '@/constants/mockBooking';

interface Props {
  value: PackageSizeId;
  onChange: (v: PackageSizeId) => void;
  /** Vận tải dùng mức tải trọng riêng (FREIGHT_WEIGHTS) thay vì kích cỡ gói nhỏ mặc định */
  sizes?: PackageSizeDef[];
}

export const PackageSizePicker: React.FC<Props> = ({ value, onChange, sizes = PACKAGE_SIZES }) => (
  <View style={styles.row}>
    {sizes.map((p, i) => {
      const on = p.id === value;
      return (
        <Pressable key={p.id} onPress={() => onChange(p.id)} style={[styles.tile, on && styles.tileOn, i > 0 && { marginLeft: Spacing.sm }]}>
          <Icon name={Icons.box} size={16 + i * 4} color={on ? Colors.primary : Colors.textSecondary} />
          <AppText weight="bold" size={13} color={on ? Colors.primary : Colors.text} style={{ marginTop: 6 }} numberOfLines={1}>
            {p.label}
          </AppText>
          <AppText size={11} color={Colors.textSecondary} numberOfLines={1}>
            {p.sub}
          </AppText>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  tile: {
    flex: 1,
    minHeight: 84,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  tileOn: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
});

export default PackageSizePicker;
