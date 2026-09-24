// MemberRow — dòng thành viên cộng đồng (Figma 1.1b): avatar 40 + tên bold 16 + "MS: ..." xám 14
// + phải "500k" bold 18 + "Doanh thu" xám 13 + chevron. Badge hạng Bạc/Vàng/Kim Cương.
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar, Badge, Icon, Icons } from '@/components/ui';
import { formatShortVnd, type CommunityMember } from '@/constants/mock';

interface MemberRowProps {
  member: CommunityMember;
  onPress?: () => void;
}

const TIER_TONE = { Bạc: 'neutral', Vàng: 'warning', 'Kim Cương': 'purpleSoft' } as const;

export const MemberRow: React.FC<MemberRowProps> = ({ member, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: Colors.primaryBg }]}>
    <Avatar name={member.name} size={40} />
    <View style={styles.texts}>
      <View style={styles.nameRow}>
        <AppText weight="bold" size={16} color={Colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
          {member.name}
        </AppText>
        {member.tier ? <Badge label={member.tier} tone={TIER_TONE[member.tier]} size="sm" style={{ marginLeft: Spacing.sm }} /> : null}
      </View>
      <AppText size={14} color={Colors.textSecondary}>
        {member.code}
      </AppText>
    </View>
    <View style={styles.right}>
      <AppText weight="bold" size={18} color={Colors.text}>
        {formatShortVnd(member.revenue)}
      </AppText>
      <AppText size={13} color={Colors.textSecondary}>
        Doanh thu
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
