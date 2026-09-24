// Rút tiền thưởng — Figma "Rút tiền": cùng bố cục Nạp tiền; Nguồn tiền rút về: Momo / Tài khoản chính / Chuyển khoản
import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Avatar, Button, Dialog, Icons, Screen, Toast } from '@/components/ui';
import { getStoredCustomer } from '@/services/api';
import { AMOUNT_PRESETS, WALLET_LIMITS, walletApi, type WithdrawDestination } from '@/services/wallet';
import { AmountPicker } from '@/components/wallet/AmountPicker';
import { SourceOption, IconBubble } from '@/components/wallet/SourceOption';
import { MomoMark } from '@/components/wallet/MomoMark';
import { formatVnd } from '@/components/wallet/walletUtils';

export default function WithdrawScreen() {
  const [amount, setAmount] = useState(0);
  const [destination, setDestination] = useState<WithdrawDestination>('momo');
  const [rewardBalance, setRewardBalance] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('Phan Thanh Tùng');
  const [submitting, setSubmitting] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [b, c] = await Promise.all([walletApi.getBalances(), getStoredCustomer()]);
    setRewardBalance(b.reward);
    const n = c?.fullname ?? c?.full_name;
    if (typeof n === 'string' && n.trim()) setCustomerName(n);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const max = rewardBalance ?? 0;
  const helper = `Số tiền Rút tối thiểu là ${formatVnd(WALLET_LIMITS.min)}đ - tối đa là ${formatVnd(max)}đ`;
  const tooMuch = amount > max && rewardBalance !== null;
  const tooLittle = amount > 0 && amount < WALLET_LIMITS.min;
  const canContinue = amount >= WALLET_LIMITS.min && !tooMuch && rewardBalance !== null;

  const submit = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      const res = await walletApi.withdraw({ amount, destination });
      router.replace({
        pathname: '/wallet/status',
        params: {
          ok: res.ok ? '1' : '0',
          amount: String(amount),
          title: res.transaction.title,
          message: res.message,
          txId: res.transaction.id,
        },
      });
    } catch {
      setToast('Có lỗi xảy ra trong quá trình rút tiền');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="dark"
          title="Rút tiền thưởng"
          right={{ icon: Icons.infoOutline, onPress: () => setInfoVisible(true), label: 'Thông tin rút tiền' }}
        />
      }
      footer={
        <Button
          flat
          title={canContinue ? 'Tiếp tục' : 'Lựa chọn số tiền để tiếp tục'}
          disabled={!canContinue}
          loading={submitting}
          onPress={submit}
        />
      }
      footerPadded={false}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AmountPicker
          title="Số tiền muốn rút"
          presets={AMOUNT_PRESETS}
          amount={amount}
          onChange={setAmount}
          helper={helper}
          error={tooMuch ? 'Số dư tài khoản thưởng không đủ' : tooLittle ? 'Số tiền không hợp lệ' : undefined}
        />

        <AppText weight="bold" size={15} style={styles.sectionTitle}>
          Nguồn tiền rút về
        </AppText>
        <View style={styles.options}>
          <SourceOption
            title="Momo"
            leading={<MomoMark />}
            selected={destination === 'momo'}
            onPress={() => setDestination('momo')}
          />
          <SourceOption
            title={customerName}
            subtitle="Tài khoản chính sử dụng thanh toán"
            leading={<Avatar size={40} name={customerName} />}
            selected={destination === 'main'}
            onPress={() => setDestination('main')}
          />
          <SourceOption
            title="Chuyển khoản ngân hàng"
            subtitle="Sẽ hỗ trợ trong thời gian tới"
            leading={<IconBubble icon="mci:bank-outline" />}
            disabled
          />
        </View>
      </ScrollView>

      <Dialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Rút tiền thưởng"
        message="Tiền thưởng từ cộng đồng có thể rút về ví MoMo hoặc chuyển sang Tài khoản chính để thanh toán chuyến đi. Giao dịch được xử lý ngay lập tức."
        actions={[{ label: 'Đồng ý', onPress: () => setInfoVisible(false) }]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="error" onHide={() => setToast(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md, color: Colors.text },
  options: { gap: Spacing.md },
});
