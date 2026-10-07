// app/booking/cancel.tsx — Huỷ 1.2.1 "Vui lòng chọn lý do": checklist lý do + "Gửi" (disabled tới khi chọn ≥1) → orderApi.cancelOrder → /orders
// Lý do lấy từ BE (GET /site/servicecancelreasons?service_id=…&account_type=1) vì zv-delivery bắt cancel_reason
// phải là id thuộc ĐÚNG dịch vụ của đơn (khi đơn đã có tài xế). Đơn mock (demo) vẫn dùng danh sách mẫu.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Checkbox, ErrorSheet, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { CANCEL_REASONS } from '@/constants/mockBooking';
import { orderApi, serviceApi, ApiError, type DeliveryOrder } from '@/services/api';
import { cancelStoredOrder, isMockOrderId, getStoredOrder, normalizeApiOrder, rememberOrder } from '@/services/bookingStore';
import { FlatFooter } from '@/components/booking';
import { getCurrentPositionSafe } from '@/hooks/useLocation';

type Reason = { id: number; label: string };

export default function CancelScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const isMock = !orderId || isMockOrderId(orderId);
  const [reasons, setReasons] = useState<Reason[]>(isMock ? CANCEL_REASONS : []);
  const [loadingReasons, setLoadingReasons] = useState(!isMock);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đơn thật: tải lý do huỷ của đúng dịch vụ (cần service_id → lấy từ đơn)
  useEffect(() => {
    if (isMock || !orderId) return;
    let alive = true;
    (async () => {
      try {
        const order: DeliveryOrder = await orderApi.getOrderDetail(orderId);
        rememberOrder(normalizeApiOrder(order, getStoredOrder(orderId)));
        const res = await serviceApi.cancelReasons(Number(order.service_id));
        if (!alive) return;
        const items = (res.items ?? []).map((r) => ({ id: Number(r.id), label: String(r.name) }));
        // BE chưa cấu hình lý do cho dịch vụ này → vẫn cho huỷ với lý do tự do (cancel_reason = 0, chỉ hợp lệ khi chưa có tài xế)
        setReasons(items.length ? items : CANCEL_REASONS.map((r) => ({ ...r, id: 0 })));
      } catch (e) {
        if (!alive) return;
        setReasons(CANCEL_REASONS.map((r) => ({ ...r, id: 0 })));
        setError(e instanceof ApiError ? e.message : 'Không tải được danh sách lý do.');
      } finally {
        if (alive) setLoadingReasons(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, isMock]);

  const toggle = (index: number) => setSelected((s) => (s.includes(index) ? s.filter((x) => x !== index) : [...s, index]));

  const submit = async () => {
    if (!selected.length || loading) return;
    const chosen = selected.map((i) => reasons[i]).filter(Boolean) as Reason[];
    const reasonText = chosen.map((r) => r.label).join('; ');
    if (isMock) {
      if (orderId) cancelStoredOrder(orderId);
      router.replace('/orders');
      return;
    }
    setLoading(true);
    try {
      const pos = await getCurrentPositionSafe();
      await orderApi.cancelOrder(orderId!, {
        cancel_reason: chosen.find((r) => r.id > 0)?.id ?? 0,
        cancel_reason_text: reasonText,
        cancel_reason_file_id_list: [],
        lat: pos?.latitude ?? 0,
        long: pos?.longitude ?? 0,
      });
      cancelStoredOrder(orderId!);
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
      footer={<FlatFooter title="Gửi" disabled={!selected.length || loadingReasons} loading={loading} onPress={submit} />}
    >
      <View style={styles.list}>
        {loadingReasons ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
              Đang tải lý do huỷ...
            </AppText>
          </View>
        ) : (
          reasons.map((r, i) => <Checkbox key={`${r.id}-${i}`} checked={selected.includes(i)} onPress={() => toggle(i)} label={r.label} style={styles.row} />)
        )}
      </View>
      <ErrorSheet visible={!!error} title="Không huỷ được đơn" message={error ?? ''} actionLabel="Thử lại" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  loading: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
});
