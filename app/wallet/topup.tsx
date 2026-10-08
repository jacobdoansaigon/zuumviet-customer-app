// Nạp tiền — Figma "Nạp tiền": chip số tiền, ô nhập + đ, cổng thanh toán, nút "Tiếp tục".
// POST /v1/customer/wallet/topups {amount, provider} → mở paymentUrl (VNPay) trong trình duyệt → màn Trạng thái giao dịch
// theo dõi kết quả (GET /wallet/topups/:id + realtime wallet.updated). Cổng "thử nghiệm" chỉ có ở môi trường dev.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Button, Dialog, Icons, Screen, Toast } from '@/components/ui';
import { AMOUNT_PRESETS, PROVIDER_LABEL, TOPUP_LIMITS, createTopup, refreshWallet, useWallet, type TopupProvider } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { AmountPicker } from '@/components/wallet/AmountPicker';
import { SourceOption, IconBubble } from '@/components/wallet/SourceOption';
import { formatVnd } from '@/components/wallet/walletUtils';

const HELPER = `Số tiền nạp tối thiểu là ${formatVnd(TOPUP_LIMITS.min)}đ - tối đa là ${formatVnd(TOPUP_LIMITS.max)}đ`;

export default function TopupScreen() {
  const wallet = useWallet();
  const providers = wallet?.topupProviders ?? [];
  const [amount, setAmount] = useState(0);
  const [provider, setProvider] = useState<TopupProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void refreshWallet().catch((e) => setToast(errorMessage(e)));
  }, []);

  // chọn sẵn cổng đầu tiên server bật (ưu tiên VNPay)
  useEffect(() => {
    if (!provider && providers.length) setProvider(providers.includes('vnpay') ? 'vnpay' : providers[0]!);
  }, [providers, provider]);

  const invalid = amount > 0 && (amount < TOPUP_LIMITS.min || amount > TOPUP_LIMITS.max);
  const canContinue = !!provider && amount >= TOPUP_LIMITS.min && amount <= TOPUP_LIMITS.max;

  const submit = async () => {
    if (!canContinue || !provider || submitting) return;
    setSubmitting(true);
    try {
      const t = await createTopup(amount, provider);
      if (t.paymentUrl) await Linking.openURL(t.paymentUrl);
      router.replace({ pathname: '/wallet/status', params: { topupId: t.id, amount: String(t.amount) } });
    } catch (e) {
      setToast(errorMessage(e, 'Không tạo được lần nạp tiền'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title="Nạp tiền" right={{ icon: Icons.infoOutline, onPress: () => setInfoVisible(true), label: 'Thông tin nạp tiền' }} />}
      footer={
        <Button flat title={canContinue ? 'Tiếp tục thanh toán' : 'Lựa chọn số tiền để tiếp tục'} disabled={!canContinue} loading={submitting} onPress={() => void submit()} />
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
          Cổng thanh toán
        </AppText>
        <View style={styles.options}>
          {providers.map((p) => (
            <SourceOption
              key={p}
              title={PROVIDER_LABEL[p]}
              subtitle={p === 'vnpay' ? 'Thẻ ATM, Internet Banking, QR ngân hàng' : 'Chỉ dùng khi thử nghiệm'}
              leading={<IconBubble icon={p === 'vnpay' ? 'mci:bank-outline' : 'mci:flask-outline'} />}
              selected={provider === p}
              onPress={() => setProvider(p)}
            />
          ))}
          {wallet && providers.length === 0 ? (
            <SourceOption title="Cổng thanh toán chưa sẵn sàng" subtitle="Vui lòng thử lại sau" leading={<IconBubble icon="mci:bank-off-outline" />} disabled />
          ) : null}
        </View>
      </ScrollView>

      <Dialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Nạp tiền"
        message={`Sau khi thanh toán thành công trên trang của cổng thanh toán, tiền được cộng vào ví ZuumViet. ${HELPER}.`}
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
