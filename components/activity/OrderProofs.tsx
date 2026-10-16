// OrderProofs — ảnh xác nhận của đơn (anh Jacob 16/10/2026): ảnh tài xế / thợ chụp lúc lấy hàng / bắt đầu làm, ảnh từng điểm
// giao (đã giao, giao không được, hoàn hàng) và ảnh bằng chứng huỷ — lấy từ `proofs` của GET /v1/customer/orders/:id (link ký
// sẵn tới kho file, hết hạn sau ~10 phút; màn hình tải lại đơn khi quay lại nên link luôn mới). Dải ảnh theo nhóm, chạm để xem
// lớn, vuốt qua lại giữa mọi ảnh của đơn.
import React, { useState } from 'react';
import { View, ScrollView, Image, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { SERVICE_GROUPS } from '@/constants/booking';
import { groupOfOrder, STOP_STATUS_LABEL, type OrderDetail } from '@/services/orders';

interface ProofGroup {
  title: string;
  uris: string[];
}

const THUMB = 84;

/** Nhóm ảnh theo bước: lấy hàng / bắt đầu → từng điểm giao → huỷ (chỉ khi đơn đã huỷ: ảnh đối tác trả đơn thì đơn vẫn chạy tiếp) */
export function proofGroups(order: Pick<OrderDetail, 'proofs' | 'stops' | 'service' | 'status'>): ProofGroup[] {
  const proofs = order.proofs.filter((p): p is typeof p & { url: string } => !!p.url);
  if (!proofs.length) return [];
  const kind = SERVICE_GROUPS[groupOfOrder(order.service)].kind;
  const groups: ProofGroup[] = [];
  const pickup = proofs.filter((p) => p.kind === 'pickup').map((p) => p.url);
  if (pickup.length) {
    groups.push({ title: kind === 'onsite' ? 'Hiện trạng lúc bắt đầu làm' : kind === 'ride' ? 'Ảnh lúc đón' : 'Ảnh lấy hàng', uris: pickup });
  }
  const many = order.stops.length > 1;
  for (const s of order.stops) {
    const uris = proofs.filter((p) => p.kind === 'delivery' && p.stopId === s.id).map((p) => p.url);
    if (uris.length) groups.push({ title: `Ảnh giao hàng${many ? ` · điểm ${s.seq}` : ''} · ${STOP_STATUS_LABEL[s.status]}`, uris });
  }
  const cancel = order.status === 'cancelled' ? proofs.filter((p) => p.kind === 'cancel').map((p) => p.url) : [];
  if (cancel.length) groups.push({ title: 'Ảnh bằng chứng huỷ', uris: cancel });
  return groups;
}

export const OrderProofs: React.FC<{ order: Pick<OrderDetail, 'proofs' | 'stops' | 'service' | 'status'>; title?: string }> = ({ order, title = 'Hình ảnh xác nhận' }) => {
  const [open, setOpen] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const { width, height } = useWindowDimensions();
  const groups = proofGroups(order);
  if (!groups.length) return null;
  // mọi ảnh của đơn theo thứ tự hiển thị — trình xem lớn vuốt qua hết các nhóm
  const all = groups.flatMap((g) => g.uris.map((uri) => ({ uri, label: g.title })));
  let index = 0;

  return (
    <View>
      <AppText weight="bold" size={14} style={styles.heading}>
        {title}
      </AppText>
      {groups.map((g) => (
        <View key={g.title} style={styles.group}>
          <AppText size={13} color={Colors.textSecondary} style={styles.groupTitle}>
            {g.title}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {g.uris.map((uri) => {
              const i = index++;
              return (
                <Pressable
                  key={`${uri}-${i}`}
                  onPress={() => {
                    setPage(i);
                    setOpen(i);
                  }}
                  accessibilityLabel={`${g.title}, ảnh ${i + 1}`}
                >
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ))}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.viewer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (open ?? 0) * width, y: 0 }}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {all.map((p, i) => (
              <View key={`full-${i}`} style={{ width, justifyContent: 'center' }}>
                <Image source={{ uri: p.uri }} style={{ width, height: height * 0.72 }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          <View style={styles.viewerBar}>
            <AppText size={13} color={Colors.white} align="center">
              {all[page]?.label} · {page + 1}/{all.length}
            </AppText>
          </View>
          <Pressable style={styles.close} onPress={() => setOpen(null)} accessibilityLabel="Đóng">
            <Icon name={Icons.close} size={22} color={Colors.white} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { marginBottom: Spacing.xs },
  group: { marginTop: Spacing.sm },
  groupTitle: { marginBottom: 6 },
  strip: { gap: Spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' },
  viewerBar: { position: 'absolute', bottom: 48, left: Spacing.screen, right: Spacing.screen, alignItems: 'center' },
  close: { position: 'absolute', top: 48, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

export default OrderProofs;
