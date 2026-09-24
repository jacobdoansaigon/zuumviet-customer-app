// Tài khoản (Ví) — Figma "Tài khoản 1.1": header tím, thẻ Tài khoản chính (gradient) + Tài khoản thưởng (xám), Lịch sử giao dịch
import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, Avatar, Dialog, Icons, ListRow, Screen } from '@/components/ui';
import { getStoredCustomer, type CustomerProfile } from '@/services/api';
import { subscribeWallet, walletApi, type WalletBalances } from '@/services/wallet';
import { BalanceCard } from '@/components/wallet/BalanceCard';

const INFO = {
  main: {
    title: 'Tài khoản chính',
    message:
      'Tài khoản chính dùng để thanh toán cước phí chuyến đi và các dịch vụ trên ZuumViet. Bạn có thể nạp thêm tiền từ ví MoMo.',
  },
  reward: {
    title: 'Tài khoản Thưởng',
    message: 'Tài khoản COD là tài khoản để khách hàng nhận tiền hàng COD của các đơn hàng Giao Hàng Liên Tỉnh',
  },
} as const;

export default function WalletScreen() {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [info, setInfo] = useState<keyof typeof INFO | null>(null);

  const load = useCallback(async () => {
    setBalances(await walletApi.getBalances());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      getStoredCustomer().then(setCustomer);
    }, [load])
  );

  useEffect(() => subscribeWallet(() => { load(); }), [load]);

  const name = String(customer?.fullname ?? customer?.full_name ?? 'Khách hàng');

  return (
    <Screen
      header={<AppHeader variant="dark" title="Tài khoản" rightNode={<Avatar size={32} name={name} bordered />} />}
      keyboardAvoiding={false}
    >
      {balances ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BalanceCard
            tone="main"
            title="Tài khoản chính"
            amount={balances.main}
            actionLabel="Nạp tiền"
            actionIcon={Icons.plusCircle}
            onAction={() => router.push('/wallet/topup')}
            onInfo={() => setInfo('main')}
          />
          <BalanceCard
            tone="reward"
            title="Tài khoản thưởng"
            amount={balances.reward}
            actionLabel="Rút tiền"
            actionIcon={Icons.refresh}
            onAction={() => router.push('/wallet/withdraw')}
            onInfo={() => setInfo('reward')}
          />
          <ListRow
            icon="mci:history"
            label="Lịch sử giao dịch"
            onPress={() => router.push('/wallet/history')}
            style={styles.historyRow}
            divider={false}
          />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      <Dialog
        visible={info !== null}
        onClose={() => setInfo(null)}
        title={info ? INFO[info].title : undefined}
        message={info ? INFO[info].message : undefined}
        actions={[{ label: 'Đồng ý', onPress: () => setInfo(null) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.screen, gap: Spacing.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  historyRow: { paddingHorizontal: 0, marginTop: Spacing.xs },
});
