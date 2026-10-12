// SavedPlaceMarker — nhãn nhỏ trên bản đồ cho vị trí đã lưu (Nhà / Công ty / Khác): chạm để chọn làm điểm đón.
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';
import type { SavedAddressKind } from '@/services/addresses';

const KIND_ICON: Record<SavedAddressKind, IconName> = { home: Icons.home, work: 'ion:briefcase-outline' as IconName, other: Icons.locationFilled };

export const SavedPlaceMarker: React.FC<{ kind: SavedAddressKind; label: string; onPress?: () => void }> = ({ kind, label, onPress }) => (
  <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={`Chọn ${label} làm điểm đón`} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.8 }]}>
    <View style={styles.icon}>
      <Icon name={KIND_ICON[kind]} size={13} color={Colors.white} />
    </View>
    <AppText size={11} weight="semiBold" color={Colors.text} numberOfLines={1} style={{ maxWidth: 110 }}>
      {label}
    </AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingRight: 8,
    paddingLeft: 3,
    height: 26,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    ...Shadow.sm,
  },
  icon: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
});

export default SavedPlaceMarker;
