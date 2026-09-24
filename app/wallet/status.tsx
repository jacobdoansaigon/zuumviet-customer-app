// Trạng thái giao dịch — Figma "Trạng thái GD": X header, check xanh / X đỏ, tiêu đề, số tiền tím 30, lời nhắn, link, nút Đóng
// Params: ok=1|0, amount, title ("Nạp tiền (từ MoMo)"), message?, txId?
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Button, Dialog, Icon, Icons, Screen } from '@/components/ui';
import { DashedDivider } from '@/components/wallet/DashedDivider';
import { LinkRow } from '@/components/wallet/LinkRow';
import { formatVnd } from '@/components/wallet/walletUtils';

export default function TransactionStatusScreen() {
  const params = useLocalSearchParams<{ ok?: string; amount?: string; title?: string; message?: string; txId?: string }>();
  const [supportVisible, setSupportVisible] = useState(false);

  const ok = params.ok === '1' || params.ok === 'true';
  const amount = Number(params.amount) || 0;
  const title = params.title || 'Giao dịch';
  const heading = `${title} ${ok ? 'thành công' : 'thất bại'}`;
  const message =
    params.message ||
    (ok
      ? 'Cám ơn bạn. Bạn đã nạp thành công từ ví MoMo. Chúc bạn có chuyến đi vui vẻ!'
      : 'Rất tiếc, giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.');

  const close = () => router.navigate('/wallet');

  return (
    <Screen
      header={<AppHeader variant="dark" left="close" onLeftPress={close} title="Trạng thái giao dịch" />}
      footer={<Button title="Đóng" onPress={close} />}
      keyboardAvoiding={false}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: ok ? Colors.green : Colors.error }]}>
            <Icon name={ok ? Icons.check : Icons.close} size={30} color={Colors.white} />
          </View>
          <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.md }}>
            {heading}
          </AppText>
          <AppText weight="bold" size={30} color={Colors.primary} align="center" style={styles.amount}>
            {formatVnd(amount)}đ
          </AppText>
          <AppText size={14} color={Colors.textSecondary} align="center" style={styles.body}>
            {message}
          </AppText>

          <DashedDivider style={styles.dash} />
          <LinkRow
            label="Chi tiết giao dịch"
            onPress={() => router.push(params.txId ? `/wallet/transaction/${params.txId}` : '/wallet/history')}
          />
          <LinkRow label="Yêu cầu hỗ trợ" onPress={() => setSupportVisible(true)} />
        </View>
      </View>

      <Dialog
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
        title="Yêu cầu hỗ trợ"
        message="Tư vấn viên ZuumViet sẽ liên hệ với bạn về giao dịch này trong thời gian sớm nhất."
        actions={[{ label: 'Đồng ý', onPress: () => setSupportVisible(false) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: Spacing.screen },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.white,
    alignItems: 'stretch',
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  amount: { marginTop: Spacing.xs, lineHeight: 38 },
  body: { marginTop: Spacing.md, lineHeight: 21 },
  dash: { marginVertical: Spacing.base },
});
