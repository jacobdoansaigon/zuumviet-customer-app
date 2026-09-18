// Wallet — Ví khách hàng

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type Transaction = {
  id: string;
  title: string;
  amount: string;
  date: string;
};

const MOCK_TXS: Transaction[] = [
  { id: '1', title: 'Thanh toán đơn #124', amount: '-45.000đ', date: 'Hôm nay' },
  { id: '2', title: 'Nạp ví MoMo', amount: '+200.000đ', date: 'Hôm qua' },
];

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư</Text>
          <Text style={styles.balanceValue}>0đ</Text>
          <TouchableOpacity style={styles.topUp}>
            <Text style={styles.topUpText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Giao dịch gần đây</Text>
        {MOCK_TXS.map((tx) => (
          <View key={tx.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={styles.txAmount}>{tx.amount}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          Ví thật sẽ nối API wallet khi bật zv-wallet trên Railway.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  content: { padding: Spacing.lg },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)' },
  balanceValue: {
    color: Colors.white,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.sm,
  },
  topUp: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  topUpText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  section: {
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  txTitle: { color: Colors.text },
  txDate: { color: Colors.textSecondary, marginTop: 2, fontSize: 12 },
  txAmount: { fontWeight: Typography.fontWeight.semibold, color: Colors.text },
  note: {
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
});
