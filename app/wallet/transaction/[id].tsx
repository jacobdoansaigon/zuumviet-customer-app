// Chi tiết giao dịch — Figma "Chi tiết GD": card viền, số tiền tím 30, các dòng key/value ngăn bằng kẻ đứt, hỗ trợ.
// Bút toán lấy từ danh sách đã tải ở Lịch sử giao dịch (API không có GET 1 bút toán).
import React, { useState } from 'react';
import { View, ScrollView, Linking, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Dialog, EmptyState, Icons, Screen } from '@/components/ui';
import { ENTRY_TYPE_LABEL, getCachedEntry } from '@/services/wallet';
import { DashedDivider } from '@/components/wallet/DashedDivider';
import { KeyValueRow } from '@/components/wallet/KeyValueRow';
import { LinkRow } from '@/components/wallet/LinkRow';
import { formatDateTime, formatVndSigned } from '@/components/wallet/walletUtils';

const SUPPORT_PHONE = '19001234';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = getCachedEntry(String(id ?? ''));
  const [dialog, setDialog] = useState<'info' | 'support' | null>(null);

  const header = <AppHeader variant="dark" title="Chi tiết giao dịch" right={{ icon: Icons.infoOutline, onPress: () => setDialog('info'), label: 'Thông tin' }} />;

  if (!entry) {
    return (
      <Screen header={header}>
        <View style={styles.center}>
          <EmptyState title="Không tìm thấy giao dịch" icon={Icons.wallet} actionLabel="Xem lịch sử giao dịch" onAction={() => router.replace('/wallet/history')} />
        </View>
      </Screen>
    );
  }

  const order = entry.order;

  return (
    <Screen header={header} keyboardAvoiding={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText size={14} color={Colors.textSecondary} align="center">
            {entry.description || ENTRY_TYPE_LABEL[entry.type]}
          </AppText>
          <AppText weight="bold" size={30} color={Colors.primary} align="center" style={styles.amount}>
            {formatVndSigned(entry.amount, { plus: true })}
          </AppText>

          <DashedDivider style={styles.dash} />
          <KeyValueRow label="Loại giao dịch" value={ENTRY_TYPE_LABEL[entry.type]} bold />
          <KeyValueRow label="Mã giao dịch" value={entry.transactionId.slice(0, 8).toUpperCase()} />
          <KeyValueRow label="Thời gian" value={formatDateTime(Date.parse(entry.createdAt), ' - ')} />
          <KeyValueRow label="Số dư sau giao dịch" value={formatVndSigned(entry.balanceAfter)} />
          {order ? <KeyValueRow label="Đơn hàng" value={order.code} /> : null}

          <DashedDivider style={styles.dash} />
          {order ? <LinkRow icon={Icons.doc} label="Xem đơn hàng" onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })} /> : null}
          <LinkRow icon={Icons.headset} label="Yêu cầu hỗ trợ" onPress={() => setDialog('support')} />
        </View>
      </ScrollView>

      <Dialog
        visible={dialog === 'info'}
        onClose={() => setDialog(null)}
        title="Chi tiết giao dịch"
        message="Mỗi dòng là một lần số dư ví thay đổi: nạp tiền, giữ / thanh toán / hoàn tiền đơn hàng, phí huỷ, vé xe."
        actions={[{ label: 'Đồng ý', onPress: () => setDialog(null) }]}
      />
      <Dialog
        visible={dialog === 'support'}
        onClose={() => setDialog(null)}
        title="Yêu cầu hỗ trợ"
        message={`Gọi tổng đài ZuumViet ${SUPPORT_PHONE} và đọc mã giao dịch ${entry.transactionId.slice(0, 8).toUpperCase()} để được hỗ trợ.`}
        actions={[
          { label: 'Đóng', variant: 'secondary', onPress: () => setDialog(null) },
          {
            label: 'Gọi tổng đài',
            onPress: () => {
              setDialog(null);
              void Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => undefined);
            },
          },
        ]}
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
