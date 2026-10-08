// Trạng thái giao dịch nạp tiền — Figma "Trạng thái GD": X header, biểu tượng theo trạng thái, số tiền tím 30, lời nhắn,
// link, nút Đóng. Params: topupId, amount. Theo dõi GET /v1/customer/wallet/topups/:id (3 giây/lần khi đang chờ, khi quay
// lại app từ trình duyệt, và khi có sự kiện realtime wallet.updated) tới khi thành công / thất bại / hết hạn. Chỉ tin trạng
// thái máy chủ (không tự coi là hết hạn theo đồng hồ máy): máy chủ chờ IPN đến trễ thêm 10 phút sau expiresAt; IPN tới
// sau cả mốc đó vẫn cộng tiền → màn "hết hạn" vẫn nghe wallet.updated.
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, AppState, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Button, Dialog, Icon, Icons, Screen } from '@/components/ui';
import { getTopup, paymentUrlOf, PROVIDER_LABEL, refreshWallet, type Topup } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { useRealtime } from '@/hooks/useRealtime';
import { DashedDivider } from '@/components/wallet/DashedDivider';
import { LinkRow } from '@/components/wallet/LinkRow';
import { formatVnd } from '@/components/wallet/walletUtils';
import { SUPPORT_HOTLINE as SUPPORT_PHONE } from '@/constants/content';

const POLL_MS = 3000;

export default function TransactionStatusScreen() {
  const params = useLocalSearchParams<{ topupId?: string; amount?: string }>();
  const topupId = typeof params.topupId === 'string' ? params.topupId : '';
  const [topup, setTopup] = useState<Topup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportVisible, setSupportVisible] = useState(false);

  const load = useCallback(async () => {
    if (!topupId) return;
    try {
      const t = await getTopup(topupId);
      setTopup(t);
      setError(null);
      if (t.status === 'succeeded') void refreshWallet().catch(() => undefined);
    } catch (e) {
      setError(errorMessage(e, 'Không kiểm tra được trạng thái giao dịch'));
    }
  }, [topupId]);

  const status = topup?.status ?? 'pending';
  const pending = status === 'pending';
  // quá giờ thanh toán nhưng máy chủ còn chờ cổng xác nhận → không mời mở lại trang thanh toán nữa
  const awaitingGateway = pending && !!topup && Date.parse(topup.expiresAt) <= Date.now();

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => void load(), POLL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void load();
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [pending, load]);

  useRealtime('wallet.updated', () => void load(), status !== 'succeeded');

  const amount = topup?.amount ?? (Number(params.amount) || 0);
  const ok = status === 'succeeded';
  const failed = !pending && !ok;
  const LATE_NOTE = 'Nếu bạn đã thanh toán, tiền sẽ được cộng vào ví khi cổng thanh toán xác nhận.';
  const heading = ok
    ? 'Nạp tiền thành công'
    : awaitingGateway
      ? 'Đang chờ cổng thanh toán xác nhận'
      : pending
        ? 'Đang chờ thanh toán'
        : status === 'failed'
          ? 'Nạp tiền thất bại'
          : 'Giao dịch đã hết hạn';
  const message = ok
    ? 'Cám ơn bạn. Tiền đã được cộng vào ví ZuumViet. Chúc bạn có chuyến đi vui vẻ!'
    : awaitingGateway
      ? `Đã hết thời gian thanh toán. ${LATE_NOTE}`
      : pending
        ? `Hoàn tất thanh toán trên trang ${topup ? PROVIDER_LABEL[topup.provider] : 'cổng thanh toán'} rồi quay lại ứng dụng — trạng thái sẽ tự cập nhật.`
        : status === 'failed'
          ? 'Rất tiếc, cổng thanh toán báo giao dịch không thành công — vui lòng thử lại.'
          : `Giao dịch đã hết thời gian thanh toán. ${LATE_NOTE}`;
  const payUrl = topupId ? paymentUrlOf(topupId) : null;

  const close = () => router.navigate('/wallet');

  return (
    <Screen
      header={<AppHeader variant="dark" left="close" onLeftPress={close} title="Trạng thái giao dịch" />}
      footer={failed ? <Button title="Nạp lại" onPress={() => router.replace('/wallet/topup')} /> : <Button title="Đóng" onPress={close} />}
      keyboardAvoiding={false}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          {pending ? (
            <ActivityIndicator color={Colors.primary} size="large" style={{ alignSelf: 'center' }} />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: ok ? Colors.green : Colors.error }]}>
              <Icon name={ok ? Icons.check : Icons.close} size={30} color={Colors.white} />
            </View>
          )}
          <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.md }}>
            {heading}
          </AppText>
          <AppText weight="bold" size={30} color={Colors.primary} align="center" style={styles.amount}>
            {formatVnd(amount)}đ
          </AppText>
          <AppText size={14} color={Colors.textSecondary} align="center" style={styles.body}>
            {message}
          </AppText>
          {error ? (
            <AppText size={13} color={Colors.error} align="center" style={{ marginTop: Spacing.sm }}>
              {error}
            </AppText>
          ) : null}
          {topup ? (
            <AppText size={12} color={Colors.textMuted} align="center" style={{ marginTop: Spacing.sm }}>
              Mã giao dịch {topup.reference}
            </AppText>
          ) : null}

          <DashedDivider style={styles.dash} />
          {pending && !awaitingGateway && payUrl ? <LinkRow label="Mở lại trang thanh toán" onPress={() => void Linking.openURL(payUrl).catch(() => undefined)} /> : null}
          <LinkRow label="Lịch sử giao dịch" onPress={() => router.push('/wallet/history')} />
          <LinkRow label="Yêu cầu hỗ trợ" onPress={() => setSupportVisible(true)} />
        </View>
      </View>

      <Dialog
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
        title="Yêu cầu hỗ trợ"
        message={`Gọi tổng đài ZuumViet ${SUPPORT_PHONE}${topup ? ` và đọc mã giao dịch ${topup.reference}` : ''} để được hỗ trợ.`}
        actions={[
          { label: 'Đóng', variant: 'secondary', onPress: () => setSupportVisible(false) },
          {
            label: 'Gọi tổng đài',
            onPress: () => {
              setSupportVisible(false);
              void Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => undefined);
            },
          },
        ]}
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
