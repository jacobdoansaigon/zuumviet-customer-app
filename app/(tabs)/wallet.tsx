// Wallet screen — Ví tài xế
// Design: Figma [Driver] Ví

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';

type TxType = 'income' | 'withdraw' | 'fee';

type Transaction = {
  id: string;
  type: TxType;
  title: string;
  amount: string;
  date: string;
};

const MOCK_TXS: Transaction[] = [
  { id: '1', type: 'income', title: 'Thu nhập đơn DH001234', amount: '+35.000đ', date: 'Hôm nay, 14:30' },
  { id: '2', type: 'income', title: 'Thu nhập đơn DH001233', amount: '+28.000đ', date: 'Hôm nay, 12:15' },
  { id: '3', type: 'fee', title: 'Phí dịch vụ', amount: '-6.300đ', date: 'Hôm nay' },
  { id: '4', type: 'withdraw', title: 'Rút tiền về ngân hàng', amount: '-500.000đ', date: 'Hôm qua' },
];

const TX_ICON: Record<TxType, string> = {
  income: '💚',
  withdraw: '💸',
  fee: '📋',
};

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceAmount}>256.700đ</Text>
          <Text style={styles.balancePending}>Đang chờ thanh toán: 63.000đ</Text>

          <View style={styles.walletActions}>
            <WalletAction icon="📥" label="Nạp tiền" onPress={() => {}} />
            <WalletAction icon="📤" label="Rút tiền" onPress={() => {}} />
            <WalletAction icon="📜" label="Lịch sử" onPress={() => {}} />
          </View>
        </View>

        {/* This month summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tháng này</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>1.250.000đ</Text>
              <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>125.000đ</Text>
              <Text style={styles.summaryLabel}>Phí dịch vụ</Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {MOCK_TXS.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function WalletAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={walletActionStyles.btn} onPress={onPress}>
      <View style={walletActionStyles.iconCircle}>
        <Text style={walletActionStyles.icon}>{icon}</Text>
      </View>
      <Text style={walletActionStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.amount.startsWith('+');
  return (
    <View style={txStyles.row}>
      <Text style={txStyles.icon}>{TX_ICON[tx.type]}</Text>
      <View style={txStyles.info}>
        <Text style={txStyles.title}>{tx.title}</Text>
        <Text style={txStyles.date}>{tx.date}</Text>
      </View>
      <Text style={[txStyles.amount, { color: isPositive ? Colors.success : Colors.text }]}>
        {tx.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  content: {
    padding: Spacing['2xl'],
    gap: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },

  // Balance card
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    gap: Spacing.xs,
    ...Shadow.lg,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  balancePending: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
});

const walletActionStyles = StyleSheet.create({
  btn: { alignItems: 'center', gap: Spacing.xs },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
});

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
