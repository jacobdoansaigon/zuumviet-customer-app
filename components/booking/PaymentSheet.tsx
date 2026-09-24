// PaymentSheet — "Hình thức thanh toán": Tiền mặt / Tài khoản (badge tím đ24.000) (Figma 1706-6791)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Badge, BottomSheet, Icon, Icons } from '@/components/ui';
import { WALLET_BALANCE } from '@/constants/mockBooking';
import { formatVnd, type PaymentMethod } from '@/services/bookingStore';

interface Props {
  visible: boolean;
  value: PaymentMethod;
  onClose: () => void;
  onSelect: (m: PaymentMethod) => void;
}

export const PaymentSheet: React.FC<Props> = ({ visible, value, onClose, onSelect }) => {
  const Row = ({ m, icon, label, right }: { m: PaymentMethod; icon: typeof Icons.cash; label: string; right?: React.ReactNode }) => {
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
        <AppText size={15} weight={on ? 'bold' : 'medium'} style={{ flex: 1 }}>
          {label}
        </AppText>
        {right}
        {on ? <Icon name={Icons.checkCircle} size={20} color={Colors.primary} style={{ marginLeft: Spacing.sm }} /> : null}
      </Pressable>
    );
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Hình thức thanh toán" showClose showHandle={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingBottom: Spacing.sm }}>
        <Row m="cash" icon={Icons.cash} label="Tiền mặt" />
        <Row m="wallet" icon={Icons.wallet} label="Tài khoản" right={<Badge label={formatVnd(WALLET_BALANCE)} size="sm" />} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md },
  rowOn: { backgroundColor: Colors.primaryBg },
});

export default PaymentSheet;
