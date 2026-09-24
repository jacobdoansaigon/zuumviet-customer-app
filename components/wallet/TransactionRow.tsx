// TransactionRow — dòng lịch sử giao dịch (Figma Lịch sử GD): icon tròn, tiêu đề 15, ngày 13, số tiền đậm 16, trạng thái 11
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';
import type { WalletTransaction, WalletTransactionType } from '@/services/wallet';
import { formatDateTime, formatVndSigned } from './walletUtils';

const ICON: Record<WalletTransactionType, { name: IconName; color: string; bg: string }> = {
  reward: { name: 'mci:cash-multiple', color: Colors.primary, bg: Colors.primaryTint },
  reward_transfer: { name: 'mci:cash-refund', color: Colors.primary, bg: Colors.primaryTint },
  topup: { name: 'mci:wallet-plus', color: Colors.secondary, bg: Colors.warningBg },
  withdraw: { name: 'mci:wallet-outline', color: '#E07A2F', bg: '#FDEBDD' },
  trip: { name: Icons.scooter, color: Colors.primary, bg: Colors.primaryTint },
};

export const STATUS_TEXT: Record<WalletTransaction['status'], { label: string; color: string }> = {
  success: { label: 'Thành công', color: Colors.green },
  failed: { label: 'Thất bại', color: Colors.error },
  pending: { label: 'Đang xử lý', color: Colors.warning },
};

export const TransactionRow: React.FC<{ tx: WalletTransaction; onPress?: () => void }> = ({ tx, onPress }) => {
  const icon = ICON[tx.type];
  const status = STATUS_TEXT[tx.status];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
        <Icon name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.texts}>
        <AppText size={15} weight="medium" numberOfLines={1}>
          {tx.title}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          {formatDateTime(tx.createdAt)}
        </AppText>
        {tx.status === 'failed' && tx.failReason ? (
          <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {tx.failReason}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText weight="bold" size={16} color={tx.status === 'failed' ? Colors.textSecondary : Colors.text}>
          {formatVndSigned(tx.amount, { plus: true })}
        </AppText>
        <AppText size={11} weight="semiBold" color={status.color} style={{ marginTop: 2 }}>
          {status.label}
        </AppText>
      </View>
      <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pressed: { backgroundColor: Colors.primaryBg },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, marginLeft: Spacing.md },
  right: { alignItems: 'flex-end', marginLeft: Spacing.sm },
});

export default TransactionRow;
