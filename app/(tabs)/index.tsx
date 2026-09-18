// Home — ZUUMCUSTOMER: đặt giao hàng

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import {
  getStoredCustomer,
  orderApi,
  clearSession,
  type CustomerProfile,
  type DeliveryOrder,
} from '@/services/api';

export default function HomeScreen() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  useEffect(() => {
    (async () => {
      const c = await getStoredCustomer();
      setCustomer(c);
      if (!c) {
        router.replace('/(auth)/login');
        return;
      }
      try {
        const res = await orderApi.getOrders();
        setOrders(res.items ?? []);
      } catch {
        // ignore until authenticated against live data
      }
    })();
  }, []);

  const name =
    customer?.full_name || customer?.fullname || customer?.phone || 'Khách hàng';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>ZUUMCUSTOMER</Text>
      <Text style={styles.hello}>Xin chào, {name}</Text>
      <Text style={styles.sub}>Đặt giao hàng nhanh trong khu vực của bạn.</Text>

      <Button
        title="Đặt đơn mới"
        onPress={() => router.push('/map')}
        style={{ marginTop: Spacing.lg }}
      />

      <Text style={styles.section}>Đơn gần đây</Text>
      {orders.length === 0 ? (
        <Text style={styles.empty}>Chưa có đơn hàng.</Text>
      ) : (
        orders.slice(0, 5).map((o) => (
          <Pressable
            key={String(o.id)}
            style={styles.card}
            onPress={() => router.push(`/map?orderId=${o.id}`)}
          >
            <Text style={styles.cardTitle}>#{o.id}</Text>
            <Text style={styles.cardMeta}>Trạng thái: {String(o.status)}</Text>
          </Pressable>
        ))
      )}

      <Pressable
        onPress={async () => {
          await clearSession();
          router.replace('/(auth)/login');
        }}
        style={{ marginTop: Spacing.xl }}
      >
        <Text style={styles.logout}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl * 2 },
  brand: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  hello: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray900,
  },
  sub: { marginTop: Spacing.xs, color: Colors.gray500 },
  section: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  empty: { color: Colors.gray500 },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardTitle: { fontWeight: Typography.fontWeight.semibold },
  cardMeta: { color: Colors.gray500, marginTop: 4 },
  logout: { color: Colors.primary, textAlign: 'center' },
});
