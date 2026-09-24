// BalanceCard — thẻ số dư theo Figma Tài khoản:
//  main:   gradient tím #59267C→#7E37AF + vệt cam/hồng góc dưới phải, chữ trắng, pill trắng "Nạp tiền" + dấu cộng xanh
//  reward: gradient xám #D9D9D9→#BFBFBF, logo tím, chữ đậm, pill tím "Rút tiền" + icon refresh
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, LogoMark, type IconName } from '@/components/ui';
import { formatVnd } from './walletUtils';

interface BalanceCardProps {
  tone: 'main' | 'reward';
  title: string;
  amount: number;
  actionLabel: string;
  actionIcon: IconName;
  onAction?: () => void;
  onInfo?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ tone, title, amount, actionLabel, actionIcon, onAction, onInfo }) => {
  const main = tone === 'main';
  const fg = main ? Colors.white : Colors.text;
  const colors: [string, string] = main ? ['#59267C', '#7E37AF'] : ['#D9D9D9', '#BFBFBF'];
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, main && Shadow.md]}>
      {main ? (
        <>
          <View style={[styles.blob, styles.blobOrange]} />
          <View style={[styles.blob, styles.blobPink]} />
        </>
      ) : null}

      <View style={styles.topRow}>
        <LogoMark size={26} tone={main ? 'white' : 'purple'} />
      </View>

      <View style={styles.titleRow}>
        <AppText size={15} weight="medium" color={fg}>
          {title}
        </AppText>
        <Pressable onPress={onInfo} hitSlop={10} style={styles.infoBtn} accessibilityLabel={`Thông tin ${title}`}>
          <Icon name={Icons.infoOutline} size={18} color={fg} />
        </Pressable>
      </View>

      <View style={styles.amountRow}>
        <AppText weight="bold" size={30} color={fg} style={styles.currency}>
          đ
        </AppText>
        <AppText weight="bold" size={30} color={fg} style={{ lineHeight: 36 }}>
          {formatVnd(amount)}
        </AppText>
      </View>

      <Pressable
        onPress={onAction}
        style={({ pressed }) => [styles.pill, main ? styles.pillWhite : styles.pillPurple, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <AppText weight="bold" size={14} color={main ? Colors.primary : Colors.white}>
          {actionLabel}
        </AppText>
        <Icon name={actionIcon} size={20} color={main ? Colors.green : Colors.white} style={{ marginLeft: 6 }} />
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 170,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blobOrange: { width: 190, height: 190, right: -70, bottom: -110, backgroundColor: 'rgba(240,179,65,0.85)' },
  blobPink: { width: 150, height: 150, right: 40, bottom: -120, backgroundColor: 'rgba(232,99,155,0.55)' },
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  infoBtn: { marginLeft: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  currency: { textDecorationLine: 'underline', lineHeight: 36, marginRight: 2 },
  pill: {
    position: 'absolute',
    right: Spacing.base,
    bottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  pillWhite: { backgroundColor: Colors.white },
  pillPurple: { backgroundColor: Colors.primary },
});

export default BalanceCard;
