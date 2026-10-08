// PackageSizePicker — các ô mức cân nặng của gói hàng (Figma GH 1.4.1). Mức + phụ phí lấy từ `weightTiers` của
// dịch vụ đang chọn trong catalog API (không còn kích cỡ cứng trong app).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { WeightTier } from '@/services/catalog';

interface Props {
  tiers: WeightTier[];
  /** id mức đang chọn — null = mức đầu tiên (nhẹ nhất) */
  value: string | null;
  onChange: (id: string) => void;
}

const vnd = (n: number) => `đ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const PackageSizePicker: React.FC<Props> = ({ tiers, value, onChange }) => {
  const current = value && tiers.some((t) => t.id === value) ? value : (tiers[0]?.id ?? null);
  return (
    <View style={styles.row}>
      {tiers.map((t, i) => {
        const on = t.id === current;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={[styles.tile, on && styles.tileOn, i > 0 && { marginLeft: Spacing.sm }]}>
            <Icon name={Icons.box} size={16 + Math.min(i, 3) * 4} color={on ? Colors.primary : Colors.textSecondary} />
            <AppText weight="bold" size={13} color={on ? Colors.primary : Colors.text} style={{ marginTop: 6 }} numberOfLines={1}>
              {t.label}
            </AppText>
            <AppText size={11} color={Colors.textSecondary} numberOfLines={1}>
              {t.surcharge > 0 ? `+${vnd(t.surcharge)}` : 'Không phụ phí'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

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
