// ContactPickerSheet — Figma 1.4 danh bạ: chọn nhanh tên + SĐT (mock, expo-contacts chưa cài)
import React from 'react';
import { Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, BottomSheet } from '@/components/ui';
import { MOCK_CONTACTS, type ContactDef } from '@/constants/mockBooking';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (c: ContactDef) => void;
}

export const ContactPickerSheet: React.FC<Props> = ({ visible, onClose, onPick }) => (
  <BottomSheet visible={visible} onClose={onClose} title="Danh bạ" showClose showHandle={false} contentStyle={{ paddingHorizontal: 0 }}>
    <ScrollView style={{ maxHeight: 360 }}>
      {MOCK_CONTACTS.map((c) => (
        <Pressable
          key={c.phone}
          onPress={() => {
            onPick(c);
            onClose();
          }}
          style={styles.row}
        >
          <Avatar name={c.name} size={40} />
          <AppText weight="semiBold" size={15} style={{ flex: 1, marginLeft: Spacing.md }}>
            {c.name}
          </AppText>
          <AppText size={14} color={Colors.textSecondary}>
            {c.phone}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  </BottomSheet>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
});

export default ContactPickerSheet;
