// CommunityProfile — khối hồ sơ nhóm trưởng (Figma Cộng đồng 1.1a): avatar 56, tên bold 20,
// "Nhóm trưởng" tím 15, dòng "MS: ..." | "Doanh thu: đ 1.000.000" bold
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar } from '@/components/ui';
import { formatMoney } from '@/constants/mock';

interface CommunityProfileProps {
  name: string;
  role: string;
  code: string;
  revenue: number;
  avatarUri?: string | null;
}

export const CommunityProfile: React.FC<CommunityProfileProps> = ({ name, role, code, revenue, avatarUri }) => (
  <View style={styles.wrap}>
    <View style={styles.top}>
      <Avatar uri={avatarUri} name={name} size={56} />
      <View style={{ marginLeft: Spacing.md, flex: 1 }}>
        <AppText weight="bold" size={20} color={Colors.text} numberOfLines={1}>
          {name}
        </AppText>
        <AppText size={15} weight="semiBold" color={Colors.primary}>
          {role}
        </AppText>
      </View>
    </View>
    <View style={styles.metaRow}>
      <AppText size={14} color={Colors.textSecondary}>
        MS:{' '}
        <AppText size={14} weight="semiBold" color={Colors.text}>
          {code.replace(/^MS:\s*/, '')}
        </AppText>
      </AppText>
      <View style={styles.sep} />
      <AppText size={14} color={Colors.textSecondary}>
        Doanh thu:{' '}
        <AppText size={14} weight="bold" color={Colors.text}>
          {formatMoney(revenue, true)}
        </AppText>
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, flexWrap: 'wrap' },
  sep: { width: 1, height: 14, backgroundColor: Colors.gray300, marginHorizontal: Spacing.md },
});

export default CommunityProfile;
