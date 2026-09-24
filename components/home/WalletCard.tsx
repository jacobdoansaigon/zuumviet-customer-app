// WalletCard — thẻ ví thưởng gradient tím → vệt cam/vàng bên phải (Figma Home 3385-663):
// icon ví trắng, "đ 10.000" bold 18 trắng, "Ví thưởng của bạn" 13, pill trắng bên phải = số thành viên cộng đồng của bạn
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { formatMoney } from '@/constants/mock';

interface WalletCardProps {
  balance: number;
  /** số thành viên trong cộng đồng của bạn (hiện ở pill bên phải) */
  members?: number;
  onPress?: () => void;
  onMembersPress?: () => void;
  label?: string;
  membersLabel?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({ balance, members, onPress, onMembersPress, label = 'Ví thưởng của bạn', membersLabel = 'thành viên' }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.94 }]} accessibilityRole="button" accessibilityLabel={label}>
    <LinearGradient colors={[Colors.primary, '#6E2F98', '#7E37AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {/* vệt cam/vàng góc phải */}
      <LinearGradient colors={['#F26B4A', Colors.secondary]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.swooshBig} />
      <LinearGradient colors={['rgba(240,179,65,0.55)', 'rgba(242,107,74,0.0)']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.swooshSmall} />

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name={Icons.walletFilled} size={26} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="bold" size={18} color={Colors.white} style={{ lineHeight: 24 }}>
            {formatMoney(balance, true)}
          </AppText>
          <AppText size={13} color="rgba(255,255,255,0.9)">
            {label}
          </AppText>
        </View>
        {typeof members === 'number' ? (
          <Pressable
            onPress={onMembersPress ?? onPress}
            hitSlop={6}
            style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={`${members} ${membersLabel}`}
          >
            <View style={styles.pillIcon}>
              <Icon name={Icons.network} size={16} color={Colors.primary} />
            </View>
            <View>
              <AppText weight="extraBold" size={15} color={Colors.primary} style={{ lineHeight: 18 }}>
                {members}
              </AppText>
              <AppText size={10} weight="semiBold" color={Colors.textSecondary} style={{ lineHeight: 12 }}>
                {membersLabel}
              </AppText>
            </View>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: { borderRadius: BorderRadius.lg, ...Shadow.md },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.base, overflow: 'hidden', minHeight: 84, justifyContent: 'center' },
  swooshBig: {
    position: 'absolute',
    right: -70,
    top: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.9,
    transform: [{ scaleX: 1.25 }, { rotate: '-20deg' }],
  },
  swooshSmall: {
    position: 'absolute',
    right: 30,
    bottom: -90,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    height: 40,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});

export default WalletCard;
