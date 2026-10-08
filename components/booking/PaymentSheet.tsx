// PaymentSheet — "Hình thức thanh toán": Tiền mặt / Ví ZuumViet (badge tím số dư khả dụng thật) (Figma 1706-6791)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Badge, BottomSheet, Icon, Icons } from '@/components/ui';
import { formatVnd, type PaymentMethod } from '@/services/bookingStore';
import { useWalletSummary } from '@/hooks/useWalletBalance';

interface Props {
  visible: boolean;
  value: PaymentMethod;
  onClose: () => void;
  onSelect: (m: PaymentMethod) => void;
  /** số tiền cần thanh toán — ví không đủ thì báo ngay dưới dòng Ví */
  amount?: number;
}

export const PaymentSheet: React.FC<Props> = ({ visible, value, onClose, onSelect, amount }) => {
  const wallet = useWalletSummary();
  const available = wallet?.available ?? null;
  const short = available != null && amount != null && amount > available;
  const Row = ({ m, icon, label, sub, right }: { m: PaymentMethod; icon: typeof Icons.cash; label: string; sub?: string; right?: React.ReactNode }) => {
    const on = value === m;
    return (
      <Pressable
        onPress={() => {
          onSelect(m);
          onClose();
        }}
        style={[styles.row, on && styles.rowOn]}
      >
        <Icon name={icon} size={24} color={Colors.primary} style={{ marginRight: Spacing.md }} />
        <View style={{ flex: 1 }}>
          <AppText size={15} weight={on ? 'bold' : 'medium'}>
            {label}
          </AppText>
          {sub ? (
            <AppText size={12} color={Colors.error} style={{ marginTop: 2 }}>
              {sub}
            </AppText>
          ) : null}
        </View>
        {right}
        {on ? <Icon name={Icons.checkCircle} size={20} color={Colors.primary} style={{ marginLeft: Spacing.sm }} /> : null}
      </Pressable>
    );
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Hình thức thanh toán" showClose showHandle={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingBottom: Spacing.sm }}>
        <Row m="cash" icon={Icons.cash} label="Tiền mặt" />
        <Row
          m="wallet"
          icon={Icons.wallet}
          label="Ví ZuumViet"
          sub={short ? 'Số dư khả dụng không đủ — nạp thêm ở mục Tài khoản' : undefined}
          right={available != null ? <Badge label={formatVnd(available)} size="sm" /> : undefined}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md },
  rowOn: { backgroundColor: Colors.primaryBg },
});

export default PaymentSheet;
