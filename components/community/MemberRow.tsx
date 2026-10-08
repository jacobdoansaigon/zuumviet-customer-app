// MemberRow — dòng thành viên cộng đồng (Figma 1.1b): avatar 40 + tên bold 16 + "MS: ..." xám 14 + badge cấp,
// bên phải số F1 của thành viên đó. (API không có doanh thu từng thành viên → không hiện doanh thu.)
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, Badge, Icon, Icons } from '@/components/ui';
import type { AffiliateMemberItem } from '@/services/affiliate';

interface MemberRowProps {
  member: AffiliateMemberItem;
  /** tên cấp hiển thị (từ policy.levels) */
  levelName?: string;
  onPress?: () => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, levelName, onPress }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: Colors.primaryBg }]}>
    <Avatar name={member.fullName} size={40} />
    <View style={styles.texts}>
      <View style={styles.nameRow}>
        <AppText weight="bold" size={16} color={Colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
          {member.fullName}
        </AppText>
        {levelName ? <Badge label={levelName} tone="purpleSoft" size="sm" style={{ marginLeft: Spacing.sm }} /> : null}
      </View>
      <AppText size={14} color={Colors.textSecondary}>
        MS: {member.code}
        {member.active ? '' : ' · chưa hoạt động'}
      </AppText>
    </View>
    <View style={styles.right}>
      <AppText weight="bold" size={18} color={Colors.text}>
        {member.f1Count}
      </AppText>
      <AppText size={13} color={Colors.textSecondary}>
        Thành viên
      </AppText>
    </View>
    {onPress ? <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} style={{ marginLeft: Spacing.xs }} /> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.screen,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  texts: { flex: 1, marginLeft: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  right: { alignItems: 'flex-end' },
});

export default MemberRow;
