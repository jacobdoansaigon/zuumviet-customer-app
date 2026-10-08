// TransactionRow — dòng lịch sử ví (Figma Lịch sử GD): icon tròn theo loại bút toán, tiêu đề 15, ngày 13 (+ mã đơn),
// số tiền đậm 16 có dấu. Dữ liệu: GET /v1/customer/wallet/entries.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';
import { ENTRY_TYPE_LABEL, type WalletEntry, type WalletEntryType } from '@/services/wallet';
import { formatDateTime, formatVndSigned } from './walletUtils';

type Tone = { name: IconName; color: string; bg: string };

const TOPUP: Tone = { name: 'mci:wallet-plus', color: Colors.secondary, bg: Colors.warningBg };
const ORDER: Tone = { name: Icons.scooter, color: Colors.primary, bg: Colors.primaryTint };
const REFUND: Tone = { name: 'mci:cash-refund', color: Colors.primary, bg: Colors.primaryTint };
const REWARD: Tone = { name: 'mci:cash-multiple', color: Colors.primary, bg: Colors.primaryTint };
const OUT: Tone = { name: 'mci:wallet-outline', color: '#E07A2F', bg: '#FDEBDD' };
const BUS: Tone = { name: 'mci:bus', color: Colors.primary, bg: Colors.primaryTint };

export const ENTRY_ICON: Record<WalletEntryType, Tone> = {
  topup: TOPUP,
  order_hold: ORDER,
  order_settle: ORDER,
  order_refund: REFUND,
  cancel_fee: OUT,
  withdrawal_request: OUT,
  withdrawal_paid: OUT,
  withdrawal_rejected: REFUND,
  adjustment: REWARD,
  affiliate_accrual: REWARD,
  affiliate_payout: REWARD,
  affiliate_forfeit: OUT,
  intercity_hold: BUS,
  intercity_refund: REFUND,
  intercity_settle: BUS,
};

export const TransactionRow: React.FC<{ entry: WalletEntry; onPress?: () => void }> = ({ entry, onPress }) => {
  const icon = ENTRY_ICON[entry.type];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
        <Icon name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.texts}>
        <AppText size={15} weight="medium" numberOfLines={1}>
          {ENTRY_TYPE_LABEL[entry.type]}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
          {formatDateTime(Date.parse(entry.createdAt))}
          {entry.order ? ` · ${entry.order.code}` : ''}
        </AppText>
      </View>
      <View style={styles.right}>
        <AppText weight="bold" size={16} color={entry.amount < 0 ? Colors.text : Colors.green}>
          {formatVndSigned(entry.amount, { plus: true })}
        </AppText>
        <AppText size={11} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          Số dư {formatVndSigned(entry.balanceAfter)}
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
