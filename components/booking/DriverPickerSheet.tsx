// DriverPickerSheet — Đặt xe 1.4.7a: "Lựa chọn tài xế yêu thích" + "Chọn hết", danh sách avatar/tên/đánh giá + checkbox
import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, BottomSheet, Button, Checkbox, Icon, Icons } from '@/components/ui';
import { FAVORITE_DRIVERS } from '@/constants/mockBooking';

interface Props {
  visible: boolean;
  selected: number[];
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
}

export const DriverPickerSheet: React.FC<Props> = ({ visible, selected, onClose, onConfirm }) => {
  const [ids, setIds] = useState<number[]>(selected);
  useEffect(() => {
    if (visible) setIds(selected);
  }, [visible, selected]);

  const all = ids.length === FAVORITE_DRIVERS.length;
  const toggle = (id: number) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <BottomSheet visible={visible} onClose={onClose} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={styles.head}>
        <Pressable onPress={onClose} hitSlop={10} style={{ marginRight: Spacing.sm }}>
          <Icon name={Icons.close} size={22} color={Colors.text} />
        </Pressable>
        <AppText weight="bold" size={16} style={{ flex: 1 }}>
          Lựa chọn tài xế yêu thích
        </AppText>
        <Pressable onPress={() => setIds(all ? [] : FAVORITE_DRIVERS.map((d) => d.id))} hitSlop={8}>
          <AppText weight="semiBold" size={14} color={Colors.primary}>
            {all ? 'Bỏ chọn hết' : 'Chọn hết'}
          </AppText>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 340 }}>
        {FAVORITE_DRIVERS.map((d) => {
          const on = ids.includes(d.id);
          return (
            <Pressable key={d.id} onPress={() => toggle(d.id)} style={styles.row}>
              <Avatar name={d.name} size={44} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <AppText weight="bold" size={16}>
                  {d.name}
                </AppText>
                <AppText size={13} color={Colors.textSecondary}>
                  {d.reviews} đánh giá, {d.rating.toFixed(1)} sao
                </AppText>
              </View>
              <Checkbox checked={on} onPress={() => toggle(d.id)} />
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Xác Nhận" onPress={() => onConfirm(ids)} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  footer: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base },
});

export default DriverPickerSheet;
