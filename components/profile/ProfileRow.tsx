// ProfileRow — dòng hồ sơ đầu tab Hồ sơ (Figma): avatar 48 + tên bold 17 + link "Chỉnh sửa hồ sơ" xám 13
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, Icon, Icons } from '@/components/ui';

interface ProfileRowProps {
  name: string;
  phone?: string;
  avatarUri?: string | null;
  onEdit?: () => void;
}

export const ProfileRow: React.FC<ProfileRowProps> = ({ name, phone, avatarUri, onEdit }) => (
  <Pressable onPress={onEdit} style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.primaryBg }]}>
    <Avatar uri={avatarUri} name={name} size={48} />
    <View style={styles.texts}>
      <AppText weight="bold" size={17} color={Colors.text} numberOfLines={1}>
        {name}
      </AppText>
      <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
        {phone ? `${phone} · ` : ''}Chỉnh sửa hồ sơ
      </AppText>
    </View>
    <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  texts: { flex: 1, marginLeft: Spacing.md },
});

export default ProfileRow;
