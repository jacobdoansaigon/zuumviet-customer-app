// Nạp tiền — Figma "Nạp tiền": chip số tiền, ô nhập + đ, Nguồn tiền nạp (Momo / Chuyển khoản), nút "Tiếp tục"
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Button, Dialog, Icons, Screen, Toast } from '@/components/ui';
import { AMOUNT_PRESETS, WALLET_LIMITS, walletApi, type TopupSource } from '@/services/wallet';
import { AmountPicker } from '@/components/wallet/AmountPicker';
import { SourceOption, IconBubble } from '@/components/wallet/SourceOption';
import { MomoMark } from '@/components/wallet/MomoMark';
import { formatVnd } from '@/components/wallet/walletUtils';

const HELPER = `Số tiền Nạp tối thiểu là ${formatVnd(WALLET_LIMITS.min)}đ - tối đa là ${formatVnd(WALLET_LIMITS.max)}đ`;

export default function TopupScreen() {
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<TopupSource>('momo');
  const [submitting, setSubmitting] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const invalid = amount > 0 && (amount < WALLET_LIMITS.min || amount > WALLET_LIMITS.max);
  const canContinue = amount >= WALLET_LIMITS.min && amount <= WALLET_LIMITS.max;

  const submit = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      const res = await walletApi.topup({ amount, source });
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
      setToast('Có lỗi xảy ra trong quá trình nạp tiền');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="dark"
          title="Nạp tiền"
          right={{ icon: Icons.infoOutline, onPress: () => setInfoVisible(true), label: 'Thông tin nạp tiền' }}
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
          title="Số tiền muốn nạp"
          presets={AMOUNT_PRESETS}
          amount={amount}
          onChange={setAmount}
          helper={HELPER}
          error={invalid ? 'Số tiền không hợp lệ' : undefined}
        />

        <AppText weight="bold" size={15} style={styles.sectionTitle}>
          Nguồn tiền nạp
        </AppText>
        <View style={styles.options}>
          <SourceOption title="Momo" leading={<MomoMark />} selected={source === 'momo'} onPress={() => setSource('momo')} />
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
        title="Nạp tiền"
        message={`Tiền nạp sẽ được cộng vào Tài khoản chính ngay sau khi giao dịch thành công. ${HELPER}.`}
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
