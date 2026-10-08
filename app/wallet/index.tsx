// Tài khoản (Ví) — Figma "Tài khoản 1.1": header tím, thẻ ví (gradient) + Lịch sử giao dịch.
// GET /v1/customer/wallet: số dư khả dụng (tiền giữ cho đơn đang chạy đã trừ sẵn), nợ phí huỷ (khi số dư âm). Một ví duy nhất — không có ví thưởng
// / rút tiền cho khách. Tự cập nhật khi có sự kiện realtime wallet.updated (services/wallet.ts).
import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Avatar, Dialog, Icons, ListRow, Screen } from '@/components/ui';
import { displayName, useProfile } from '@/services/session';
import { refreshWallet, useWallet } from '@/services/wallet';
import { errorMessage } from '@/services/zuum';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { formatVnd } from '@/components/wallet/walletUtils';

export default function WalletScreen() {
  const wallet = useWallet();
  const profile = useProfile();
  const [info, setInfo] = useState(false);
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
            title="Ví ZuumViet"
            amount={wallet.available}
            actionLabel="Nạp tiền"
            actionIcon={Icons.plusCircle}
            onAction={() => router.push('/wallet/topup')}
            onInfo={() => setInfo(true)}
          />
          {wallet.debt > 0 ? (
            <View style={styles.debt}>
              <AppText size={13} color={Colors.error}>
                Bạn còn nợ phí huỷ đơn đ{formatVnd(wallet.debt)} — được trừ khi nạp ví hoặc thu kèm ở đơn trả tiền mặt tiếp theo.
              </AppText>
            </View>
          ) : null}
          {error ? (
            <AppText size={13} color={Colors.error}>
              {error}
            </AppText>
          ) : null}
          <ListRow icon="mci:history" label="Lịch sử giao dịch" onPress={() => router.push('/wallet/history')} style={styles.historyRow} divider={false} />
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
        visible={info}
        onClose={() => setInfo(false)}
        title="Ví ZuumViet"
        message="Ví dùng để thanh toán cước phí chuyến đi, vé xe và các dịch vụ trên ZuumViet. Nạp tiền qua cổng thanh toán; tiền được giữ lại khi bạn đặt đơn trả bằng ví và hoàn lại nếu đơn bị huỷ."
        actions={[{ label: 'Đồng ý', onPress: () => setInfo(false) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.screen, gap: Spacing.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screen },
  debt: { padding: Spacing.md, borderRadius: 8, backgroundColor: Colors.errorBg },
  historyRow: { paddingHorizontal: 0, marginTop: Spacing.xs },
});
