// EntranceChips — cổng / lối vào của địa điểm đón theo dữ liệu bản đồ (kiểu Grab): hàng chip ngay dưới địa chỉ điểm đón,
// chọn một cổng → điểm đón dời tới đúng cổng đó + ghi chú cho tài xế; bấm lại để bỏ chọn.
// Chỉ hiện khi API trả về cổng của đúng địa điểm đó (siêu thị, bệnh viện, trường, chung cư…) — nhà dân thì không có.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { AppText, Chip, Icon, Icons } from '@/components/ui';
import type { PlaceEntrance } from '@/services/places';

interface Props {
  /** địa điểm mẹ của các cổng (vd "Aeon Mall Tân Phú") */
  parent: string | null;
  items: PlaceEntrance[];
  selectedId: string | null;
  onPick: (gate: PlaceEntrance) => void;
}

export const EntranceChips: React.FC<Props> = ({ parent, items, selectedId, onPick }) => (
  <View>
    <View style={styles.head}>
      <Icon name={Icons.entrance} size={13} color={Colors.textSecondary} />
      <AppText size={11} color={Colors.textSecondary} style={{ marginLeft: 4, flexShrink: 1 }} numberOfLines={1}>
        {parent ? `Cổng / lối vào · ${parent}` : 'Cổng / lối vào'}
      </AppText>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.row}>
      {items.map((g) => (
        <Chip key={g.placeId} label={g.name} size="sm" variant="soft" active={g.placeId === selectedId} onPress={() => onPick(g)} />
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 },
  row: { gap: 8, paddingRight: 8 },
});

export default EntranceChips;
