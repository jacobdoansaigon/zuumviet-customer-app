// app/booking/intercity/carpool-tracking/[requestId].tsx — Theo dõi yêu cầu Xe ghép: "Đang tìm tài xế..."
// → tài xế nhận cuốc (mô phỏng) → hiện chi tiết xe/tài xế + theo dõi chuyến + chia sẻ cho người thân.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Avatar, Button, EmptyState, Icon, Icons, Screen, Toast } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { acceptCarpoolRequest, cancelCarpoolRequest, useCarpoolRequest } from '@/services/carpoolRequestStore';
import { buildTrackingLink, shareTrackingLink } from '@/services/shareLink';

const MATCH_DELAY_MS = 6000;

export default function CarpoolTrackingScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const req = useCarpoolRequest(requestId ?? '');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!req || req.status !== 'searching') return;
    const t = setTimeout(() => acceptCarpoolRequest(req.id), MATCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [req?.id, req?.status]);

  const done = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  if (!req) {
    return (
      <Screen header={<AppHeader title="Xe ghép" variant="light" left="close" />}>
        <EmptyState icon={Icons.doc} title="Không tìm thấy yêu cầu này" actionLabel="Về trang chủ" onAction={done} />
      </Screen>
    );
  }

  const call = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => setToast('Không thể thực hiện cuộc gọi trên thiết bị này'));
  };

  const share = async () => {
    const res = await shareTrackingLink({
      title: 'Theo dõi chuyến xe ghép của tôi trên ZuumViet',
      message: `Mình đang đi xe ghép tới ${req.destinationLabel}, khởi hành ${req.departLabel}. Bạn theo dõi giúp mình nhé.`,
      url: buildTrackingLink('carpool', req.id),
    });
    setToast(res === 'copied' ? 'Đã sao chép liên kết chia sẻ' : res === 'unavailable' ? 'Thiết bị không hỗ trợ chia sẻ' : 'Đã mở hộp thoại chia sẻ');
  };

  const cancel = () => {
    cancelCarpoolRequest(req.id);
    setToast('Đã huỷ yêu cầu xe ghép');
  };

  if (req.status === 'cancelled') {
    return (
      <Screen header={<AppHeader title="Xe ghép" variant="light" left="close" onLeftPress={done} />}>
        <EmptyState icon={Icons.closeCircle} title="Đã huỷ yêu cầu xe ghép" actionLabel="Về trang chủ" onAction={done} />
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppHeader title="Xe ghép" variant="dark" left="close" onLeftPress={done} />}
      scroll
      footer={
        req.status === 'searching' ? (
          <Button title="Huỷ yêu cầu" variant="secondary" onPress={cancel} />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Button title="Chia sẻ với người thân" variant="outline" iconLeft={Icons.share} onPress={() => void share()} />
            <Button title="Về trang chủ" onPress={done} />
          </View>
        )
      }
    >
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            TP. Hồ Chí Minh → {req.destinationLabel} · {req.departLabel}
          </AppText>
        </View>
        {req.status === 'searching' ? (
          <View style={styles.searchingCard}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <AppText size={15} weight="bold" style={{ marginTop: Spacing.md }}>
              Đang tìm tài xế xe ghép phù hợp...
            </AppText>
            <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
              Yêu cầu {req.seatCount} chỗ của bạn đã được gửi tới các tài xế đang chạy tuyến này. Vui lòng chờ trong giây lát.
            </AppText>
            <AppText size={22} weight="extraBold" color={Colors.primary} style={{ marginTop: Spacing.md }}>
              đ{req.estimatedTotal.toLocaleString('vi-VN')}
            </AppText>
            <AppText size={12} color={Colors.textSecondary}>
              Giá dự kiến — tài xế nhận cuốc sẽ báo giá chính thức
            </AppText>
          </View>
        ) : (
          <>
            <View style={styles.matchedBanner}>
              <Icon name={Icons.checkCircle} size={20} color={Colors.success} />
              <AppText size={14} weight="bold" color={Colors.text} style={{ marginLeft: Spacing.sm }}>
                Đã có tài xế nhận cuốc!
              </AppText>
            </View>
            {req.matchedListing ? (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Avatar name={req.matchedListing.driverName} size={44} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText size={16} weight="bold">
                      {req.matchedListing.driverName}
                    </AppText>
                    <AppText size={12} color={Colors.textSecondary}>
                      {req.matchedListing.vehicleModel} · {req.matchedListing.vehicleColor} · {req.matchedListing.vehiclePlate}
                    </AppText>
                    <View style={styles.ratingRow}>
                      <Icon name={Icons.star} size={13} color={Colors.secondary} />
                      <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
                        {req.matchedListing.driverRating.toFixed(1)} ({req.matchedListing.driverReviews} đánh giá)
                      </AppText>
                    </View>
                  </View>
                  <Button title="Gọi" size="sm" variant="teal" fullWidth={false} onPress={() => call(req.matchedListing?.driverPhone)} />
                </View>
                <Row label="Khởi hành dự kiến" value={req.matchedListing.departTime} />
                <Row label="Giá mỗi chỗ" value={req.matchedListing.priceLabel} />
                <Row label="Đón / trả" value={req.dropoffPref === 'home' ? 'Tận nơi' : 'Bến xe / điểm hẹn gần nhất'} />
                <Row label="Hàng hoá đi kèm" value={req.hasCargo ? req.cargoNote || 'Có' : 'Không'} />
                <View style={styles.amenityWrap}>
                  {req.matchedListing.amenities.map((a) => (
                    <View key={a} style={styles.amenityTag}>
                      <AppText size={11} color={Colors.textSecondary}>
                        {a}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState icon="mci:car-multiple" title="Chưa có tài xế phù hợp lúc này" description="Bạn có thể thử lại sau hoặc chuyển sang Mua vé xe / Thuê cả xe" />
            )}
          </>
        )}

        <AppText size={11} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg }}>
          Dữ liệu tài xế đang là dữ liệu mẫu (demo)
        </AppText>
      </View>
      <Toast visible={!!toast} message={toast ?? ''} tone="info" onHide={() => setToast(null)} />
    </Screen>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <AppText size={13} color={Colors.textSecondary}>
      {label}
    </AppText>
    <AppText size={13} weight="semiBold" color={Colors.text} style={{ flexShrink: 1, textAlign: 'right' }} numberOfLines={2}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  searchingCard: { alignItems: 'center', paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.md },
  matchedBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  amenityTag: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
});
