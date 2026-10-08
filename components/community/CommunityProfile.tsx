// CommunityProfile — khối hồ sơ trong cộng đồng (Figma Cộng đồng 1.1a): avatar 56, tên bold 20,
// cấp thành viên tím 15, dòng "MS: <mã giới thiệu>" | <chỉ số> bold
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar } from '@/components/ui';

interface CommunityProfileProps {
  name: string;
  role: string;
  code: string;
  /** chỉ số bên phải mã, vd { label: 'Đã nhận', value: 'đ 120.000' } */
  stat?: { label: string; value: string };
  avatarUri?: string | null;
}

export const CommunityProfile: React.FC<CommunityProfileProps> = ({ name, role, code, stat, avatarUri }) => (
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
          {code}
        </AppText>
      </AppText>
      {stat ? (
        <>
          <View style={styles.sep} />
          <AppText size={14} color={Colors.textSecondary}>
            {stat.label}:{' '}
            <AppText size={14} weight="bold" color={Colors.text}>
              {stat.value}
            </AppText>
          </AppText>
        </>
      ) : null}
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
