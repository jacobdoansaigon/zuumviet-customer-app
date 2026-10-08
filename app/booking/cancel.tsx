// app/booking/cancel.tsx — Huỷ 1.2.1 "Vui lòng chọn lý do": chọn MỘT lý do (GET /v1/public/cancel-reasons theo dịch vụ
// của đơn) + ghi chú + ảnh bằng chứng khi lý do yêu cầu (tải lên purpose order_proof) → POST /orders/:id/cancel.
// Phí huỷ: còn trong thời gian huỷ miễn phí (cancelFreeUntil) → đếm ngược; qua mốc → tải lại đơn, hiện phí
// (cancelFeeIfNow). Ngay trước khi huỷ luôn đọc lại đơn — phí cao hơn số đang hiện thì hỏi lại. Chưa có tài xế: được huỷ
// không cần lý do.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Dialog, ErrorSheet, Icon, Icons, Radio, Screen, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { cancelOrder, cancelReasons, getOrder, type CancelReason, type OrderDetail } from '@/services/orders';
import { uploadFile } from '@/services/upload';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';
import { FlatFooter } from '@/components/booking';
import { PhotoActionSheet } from '@/components/profile';
import { useRealtime } from '@/hooks/useRealtime';
import { cancelFeePending, mmss, useFreeCancelCountdown } from '@/hooks/useCancelCountdown';

const hasPartnerNow = (o: OrderDetail | null) => o?.status === 'assigned' || o?.status === 'arrived_pickup';

export default function CancelScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reasons, setReasons] = useState<CancelReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mimeType: string | null } | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeConfirm, setFeeConfirm] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!orderId) return;
    try {
      setOrder(await getOrder(orderId));
    } catch {
      /* giữ đơn đang có; lúc huỷ sẽ đọc lại */
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    (async () => {
      try {
        const o = await getOrder(orderId);
        if (!alive) return;
        setOrder(o);
        const list = await cancelReasons(o.service.id);
        if (alive) setReasons(list);
      } catch (e) {
        if (alive) setError(errorMessage(e, 'Không tải được thông tin đơn'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId]);

  // tài xế vừa nhận / đơn đổi trạng thái trong lúc đang chọn lý do → cập nhật
  useRealtime('order.updated', (p) => {
    if (p.orderId === orderId) void reload();
  });
  const freeLeft = useFreeCancelCountdown(order?.cancelFreeUntil, () => void reload());

  const reason = reasons.find((r) => r.id === selected) ?? null;
  const hasPartner = hasPartnerNow(order);
  const needsReason = hasPartner;
  const needsProof = !!reason?.requiresProof;
  const canCancel = !!order?.allowedActions.includes('cancel');
  const feePending = !!order && cancelFeePending(order, freeLeft);
  const fee = freeLeft != null ? 0 : (order?.cancelFeeIfNow ?? 0);
  const ready = !!order && canCancel && (!needsReason || !!reason) && (!needsProof || !!photo) && !submitting;

  /** acceptedFee: phí khách đã đồng ý (mặc định = phí đang hiện trên nút) */
  const submit = async (acceptedFee: number = fee) => {
    if (!order || !ready) return;
    setFeeConfirm(null);
    setSubmitting(true);
    try {
      // đọc lại đơn ngay trước khi huỷ: phí / trạng thái có thể đã đổi từ lúc mở màn
      const fresh = await getOrder(order.id);
      setOrder(fresh);
      if (!fresh.allowedActions.includes('cancel')) {
        setError('Đơn vừa chuyển trạng thái nên không thể tự huỷ nữa — vui lòng liên hệ tổng đài hỗ trợ.');
        return;
      }
      if (hasPartnerNow(fresh) && !reason) {
        setError('Tài xế vừa nhận đơn — vui lòng chọn lý do huỷ.');
        return;
      }
      const freshFee = fresh.cancelFeeIfNow ?? 0;
      if (freshFee > acceptedFee) {
        setFeeConfirm(freshFee);
        return;
      }
      const proofFileId = needsProof && photo ? await uploadFile(photo.uri, 'order_proof', photo.mimeType) : undefined;
      await cancelOrder(order.id, {
        ...(reason ? { reasonId: reason.id } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(proofFileId ? { proofFileId } : {}),
      });
      router.replace({ pathname: '/booking/tracking', params: { orderId: order.id } });
    } catch (e) {
      setError(errorMessage(e, 'Không huỷ được đơn hàng. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const footerTitle = fee > 0 ? `Huỷ đơn · phí ${formatVnd(fee)}` : feePending ? 'Huỷ đơn · có phí huỷ' : 'Gửi';

  return (
    <Screen
      header={<AppHeader variant="dark" title="Vui lòng chọn lý do" left="close" />}
      scroll
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title={footerTitle} disabled={!ready} loading={submitting} onPress={() => void submit()} />}
    >
      <View style={styles.list}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
              Đang tải lý do huỷ...
            </AppText>
          </View>
        ) : (
          <>
            {order && !canCancel ? (
              <AppText size={14} color={Colors.error} style={styles.notice}>
                Đơn ở trạng thái này không thể tự huỷ — vui lòng liên hệ tổng đài hỗ trợ.
              </AppText>
            ) : null}
            {canCancel && freeLeft != null ? (
              <View style={[styles.feeBox, styles.freeBox]}>
                <Icon name={Icons.clock} size={18} color={Colors.primary} />
                <AppText size={13} style={{ flex: 1, marginLeft: Spacing.sm }}>
                  Còn <AppText size={13} weight="bold" color={Colors.primary}>{mmss(freeLeft)}</AppText> để huỷ miễn phí. Sau thời
                  gian này, huỷ đơn sẽ mất phí huỷ.
                </AppText>
              </View>
            ) : canCancel && (fee > 0 || feePending) ? (
              <View style={styles.feeBox}>
                <Icon name={Icons.alert} size={18} color={Colors.error} />
                <AppText size={13} style={{ flex: 1, marginLeft: Spacing.sm }}>
                  {fee > 0
                    ? `Đã quá thời gian huỷ miễn phí — huỷ bây giờ sẽ mất phí ${formatVnd(fee)}.`
                    : 'Đã quá thời gian huỷ miễn phí — đang cập nhật phí huỷ...'}
                </AppText>
              </View>
            ) : null}
            {reasons.map((r) => (
              <Radio key={r.id} selected={selected === r.id} onPress={() => setSelected(r.id)} label={r.label} style={styles.row} />
            ))}
            {!needsReason && reasons.length ? (
              <AppText size={12} color={Colors.textMuted} style={{ marginTop: Spacing.sm }}>
                Chưa có tài xế nhận đơn — bạn có thể huỷ mà không cần chọn lý do.
              </AppText>
            ) : null}

            {needsProof ? (
              <View style={{ marginTop: Spacing.lg }}>
                <AppText weight="bold" size={14} style={{ marginBottom: Spacing.sm }}>
                  Ảnh bằng chứng (bắt buộc)
                </AppText>
                {photo ? (
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.thumb} />
                    <Pressable onPress={() => setPhoto(null)} style={styles.removeBtn} hitSlop={8} accessibilityLabel="Xoá ảnh">
                      <Icon name={Icons.closeCircle} size={18} color={Colors.white} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => setPhotoSheet(true)} style={styles.addTile}>
                    <Icon name={Icons.camera} size={22} color={Colors.primary} />
                    <AppText size={11} color={Colors.primary} style={{ marginTop: 4 }}>
                      Thêm ảnh
                    </AppText>
                  </Pressable>
                )}
              </View>
            ) : null}

            <TextField label="Ghi chú thêm" value={note} onChangeText={setNote} placeholder="Mô tả thêm lý do (không bắt buộc)" maxLength={500} containerStyle={{ marginTop: Spacing.lg }} />
          </>
        )}
      </View>
      <PhotoActionSheet
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        allowsEditing={false}
        onPicked={(uri, mimeType) => setPhoto({ uri, mimeType: mimeType ?? null })}
        onError={setError}
      />
      <Dialog
        visible={feeConfirm != null}
        onClose={() => setFeeConfirm(null)}
        title="Phí huỷ đã thay đổi"
        message={`Đã quá thời gian huỷ miễn phí — huỷ bây giờ sẽ mất phí ${formatVnd(feeConfirm ?? 0)}. Bạn vẫn muốn huỷ đơn?`}
        actions={[
          { label: 'Không huỷ', variant: 'secondary', onPress: () => setFeeConfirm(null) },
          { label: 'Vẫn huỷ', variant: 'danger', onPress: () => void submit(feeConfirm ?? 0) },
        ]}
      />
      <ErrorSheet visible={!!error} title="Không huỷ được đơn" message={error ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  loading: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  notice: { paddingVertical: Spacing.md },
  feeBox: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.errorBg },
  freeBox: { backgroundColor: Colors.primaryBg },
  thumbWrap: { width: THUMB, height: THUMB },
  thumb: { width: THUMB, height: THUMB, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
