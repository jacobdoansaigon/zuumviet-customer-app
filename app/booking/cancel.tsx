// app/booking/cancel.tsx — Huỷ 1.2.1 "Vui lòng chọn lý do": checklist lý do + "Gửi" (disabled tới khi chọn ≥1) → orderApi.cancelOrder → /orders
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Checkbox, ErrorSheet, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { CANCEL_REASONS } from '@/constants/mockBooking';
import { orderApi, ApiError } from '@/services/api';
import { cancelStoredOrder, isMockOrderId } from '@/services/bookingStore';
import { FlatFooter } from '@/components/booking';

export default function CancelScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (!selected.length || loading) return;
    const reasonText = CANCEL_REASONS.filter((r) => selected.includes(r.id))
      .map((r) => r.label)
      .join('; ');
    if (!orderId || isMockOrderId(orderId)) {
      if (orderId) cancelStoredOrder(orderId);
      router.replace('/orders');
      return;
    }
    setLoading(true);
    try {
      // TODO: cancel_reason phải là id trong bảng service_cancel_reason của BE — hiện gửi id mock 1..7
      await orderApi.cancelOrder(orderId, {
        cancel_reason: selected[0],
        cancel_reason_text: reasonText,
        cancel_reason_file_id_list: [],
        lat: 0,
        long: 0,
      });
      cancelStoredOrder(orderId);
      router.replace('/orders');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không huỷ được đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title="Vui lòng chọn lý do" left="close" />}
      scroll
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Gửi" disabled={!selected.length} loading={loading} onPress={submit} />}
    >
      <View style={styles.list}>
        {CANCEL_REASONS.map((r) => (
          <Checkbox key={r.id} checked={selected.includes(r.id)} onPress={() => toggle(r.id)} label={r.label} style={styles.row} />
        ))}
      </View>
      <ErrorSheet visible={!!error} title="Không huỷ được đơn" message={error ?? ''} actionLabel="Thử lại" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
});
