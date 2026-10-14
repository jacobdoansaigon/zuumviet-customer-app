// Tài khoản (Ví) — Figma "Tài khoản 1.1": header tím, thẻ ví chính (gradient tím) + thẻ Ví thưởng (xám, pill tím),
// Lịch sử giao dịch / Lịch sử Ví thưởng. GET /v1/customer/wallet: số dư khả dụng (tiền giữ cho đơn đang chạy đã trừ sẵn),
// nợ phí huỷ (khi số dư âm), `bonus` = Ví thưởng (thưởng cộng đồng cộng vào mỗi sáng thứ Hai) → "Chuyển sang ví chính"
// (components/wallet/BonusTransfer.tsx). Khách không rút tiền. Tự cập nhật khi có sự kiện realtime wallet.updated.
import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Avatar, Dialog, Icons, ListRow, Screen } from '@/components/ui';
import { displayName, useProfile } from '@/services/session';
import { refreshWallet, useWallet } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { useBonusTransfer } from '@/components/wallet/BonusTransfer';
import { COMMUNITY_REWARD_NOTE } from '@/services/affiliate';
import { formatVnd } from '@/components/wallet/walletUtils';

export default function WalletScreen() {
  const wallet = useWallet();
  const profile = useProfile();
  const [info, setInfo] = useState<'main' | 'bonus' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await refreshWallet();
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được số dư ví'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const transfer = useBonusTransfer();
  const name = displayName(profile);

  return (
    <Screen header={<AppHeader variant="dark" title="Tài khoản" rightNode={<Avatar size={32} name={name} uri={profile?.avatarUrl} bordered />} />} keyboardAvoiding={false}>
      {wallet ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={Colors.primary}
            />
          }
        >
          <BalanceCard
            tone="main"
            title="Ví chính"
            amount={wallet.available}
            actionLabel="Nạp tiền"
            actionIcon={Icons.plusCircle}
            onAction={() => router.push('/wallet/topup')}
            onInfo={() => setInfo('main')}
          />
          {wallet.debt > 0 ? (
            <View style={styles.debt}>
              <AppText size={13} color={Colors.error}>
                Bạn còn nợ phí huỷ đơn đ{formatVnd(wallet.debt)} — được trừ khi nạp ví hoặc thu kèm ở đơn trả tiền mặt tiếp theo.
              </AppText>
            </View>
          ) : null}
          <BalanceCard
            tone="reward"
            title="Ví thưởng"
            amount={wallet.bonus}
            actionLabel="Chuyển sang ví chính"
            actionIcon={Icons.swap}
            onAction={transfer.start}
            onInfo={() => setInfo('bonus')}
          />
          <AppText size={13} color={Colors.textSecondary} style={styles.note}>
            {COMMUNITY_REWARD_NOTE}
          </AppText>
          {error ? (
            <AppText size={13} color={Colors.error}>
              {error}
            </AppText>
          ) : null}
          <View>
            <ListRow icon="mci:history" label="Lịch sử giao dịch" onPress={() => router.push('/wallet/history')} style={styles.historyRow} />
            <ListRow icon="mci:gift-outline" label="Lịch sử Ví thưởng" onPress={() => router.push('/wallet/bonus')} style={styles.historyRow} divider={false} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          {error ? (
            <AppText size={14} color={Colors.error} align="center" onPress={() => void load()}>
              {error} — chạm để thử lại
            </AppText>
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </View>
      )}

      <Dialog
        visible={info !== null}
        onClose={() => setInfo(null)}
        title={info === 'bonus' ? 'Ví thưởng' : 'Ví chính'}
        message={
          info === 'bonus'
            ? `${COMMUNITY_REWARD_NOTE} Bấm "Chuyển sang ví chính" để dùng số tiền này thanh toán chuyến đi, vé xe và các dịch vụ trên ZuumViet.`
            : 'Ví ZuumViet dùng để thanh toán cước phí chuyến đi, vé xe và các dịch vụ trên ZuumViet. Nạp tiền qua cổng thanh toán; tiền được giữ lại khi bạn đặt đơn trả bằng ví và hoàn lại nếu đơn bị huỷ.'
        }
        actions={[{ label: 'Đồng ý', onPress: () => setInfo(null) }]}
      />
      {transfer.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.screen, gap: Spacing.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screen },
  debt: { padding: Spacing.md, borderRadius: 8, backgroundColor: Colors.errorBg },
  note: { marginTop: -Spacing.sm, lineHeight: 19 },
  historyRow: { paddingHorizontal: 0 },
});
