// PaymentSummary — hàng 3 cột: [icon] Tiền mặt | Tiền Tip 15k | Tổng tiền 93k (label xám 11, giá trị 14)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { ActivityOrder } from '@/constants/mockOrders';
import { formatShortVnd } from './orderUtils';

export const PaymentSummary: React.FC<{ payment: ActivityOrder['payment'] }> = ({ payment }) => (
  <View style={styles.row}>
    <View style={[styles.col, styles.method]}>
      <Icon name={payment.method === 'wallet' ? Icons.wallet : Icons.cash} size={22} color={Colors.primary} />
      <View style={{ marginLeft: Spacing.sm }}>
        <AppText size={11} color={Colors.textSecondary}>
          Thanh toán
        </AppText>
        <AppText size={14} weight="semiBold">
          {payment.methodLabel}
        </AppText>
      </View>
    </View>
    <View style={styles.divider} />
    <View style={styles.col}>
      <AppText size={11} color={Colors.textSecondary}>
        Tiền Tip
      </AppText>
      <AppText size={14} weight="semiBold">
        {payment.tip > 0 ? formatShortVnd(payment.tip) : '0đ'}
      </AppText>
    </View>
    <View style={styles.divider} />
    <View style={styles.col}>
      <AppText size={11} color={Colors.textSecondary}>
        Tổng tiền
      </AppText>
      <AppText size={14} weight="bold" color={Colors.primary}>
        {payment.total > 0 ? formatShortVnd(payment.total) : '0đ'}
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  col: { flex: 1, alignItems: 'center' },
  method: { flexDirection: 'row', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: Colors.gray300 },
});

export default PaymentSummary;
