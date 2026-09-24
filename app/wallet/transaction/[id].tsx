// Chi tiết giao dịch — Figma "Chi tiết GD": card viền, số tiền tím 30, các dòng key/value ngăn bằng kẻ đứt, "Yêu cầu hỗ trợ"
import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Dialog, EmptyState, Icons, Screen } from '@/components/ui';
import { walletApi, type WalletTransaction } from '@/services/wallet';
import { DashedDivider } from '@/components/wallet/DashedDivider';
import { KeyValueRow } from '@/components/wallet/KeyValueRow';
import { LinkRow } from '@/components/wallet/LinkRow';
import { STATUS_TEXT } from '@/components/wallet/TransactionRow';
import { formatDateTime, formatVndSigned } from '@/components/wallet/walletUtils';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = String(id ?? '');
  const [tx, setTx] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'info' | 'support' | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    walletApi.getTransaction(txId).then((t) => {
      if (!alive) return;
      setTx(t);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [txId]);

  const header = (
    <AppHeader
      variant="dark"
      title="Chi tiết giao dịch"
      right={{ icon: Icons.infoOutline, onPress: () => setDialog('info'), label: 'Thông tin' }}
    />
  );

  if (loading) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!tx) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <EmptyState title="Không tìm thấy giao dịch" icon={Icons.wallet} actionLabel="Quay lại" onAction={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const status = STATUS_TEXT[tx.status];

  return (
    <Screen header={header} keyboardAvoiding={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText size={14} color={Colors.textSecondary} align="center">
            {tx.description ?? tx.title}
          </AppText>
          <AppText weight="bold" size={30} color={Colors.primary} align="center" style={styles.amount}>
            {formatVndSigned(tx.amount)}
          </AppText>

          <DashedDivider style={styles.dash} />
          <KeyValueRow label="Trạng thái" value={status.label} valueColor={status.color} bold />
          <KeyValueRow label="Mã giao dịch" value={tx.code} />
          <KeyValueRow label="Thời gian" value={formatDateTime(tx.createdAt, ' - ')} />
          <KeyValueRow label="Nguồn tiền" value={tx.source} />
          <KeyValueRow label="Phí giao dịch" value={tx.fee} />
          {tx.failReason ? <KeyValueRow label="Lý do" value={tx.failReason} valueColor={Colors.error} /> : null}

          {tx.bank ? (
            <>
              <DashedDivider style={styles.dash} />
              <KeyValueRow label="Ngân hàng" value={tx.bank.name} />
              <KeyValueRow label="Số tài khoản" value={tx.bank.account} />
              <KeyValueRow label="Chủ tài khoản" value={tx.bank.holder} />
            </>
          ) : null}

          <DashedDivider style={styles.dash} />
          <LinkRow icon={Icons.headset} label="Yêu cầu hỗ trợ" onPress={() => setDialog('support')} />
        </View>
      </ScrollView>

      <Dialog
        visible={dialog === 'info'}
        onClose={() => setDialog(null)}
        title="Chi tiết giao dịch"
        message="Mọi thắc mắc về giao dịch, hãy chọn Yêu cầu hỗ trợ để tư vấn viên ZuumViet liên hệ với bạn."
        actions={[{ label: 'Đồng ý', onPress: () => setDialog(null) }]}
      />
      <Dialog
        visible={dialog === 'support'}
        onClose={() => setDialog(null)}
        title="Yêu cầu hỗ trợ"
        message={`Tư vấn viên ZuumViet sẽ liên hệ với bạn về giao dịch ${tx.code} trong thời gian sớm nhất.`}
        actions={[{ label: 'Đồng ý', onPress: () => setDialog(null) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.screen },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    backgroundColor: Colors.white,
  },
  amount: { marginTop: Spacing.xs, lineHeight: 38 },
  dash: { marginVertical: Spacing.md },
});
