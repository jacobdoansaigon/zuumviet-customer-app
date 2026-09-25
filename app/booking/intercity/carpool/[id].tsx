// app/booking/intercity/carpool/[id].tsx — Chi tiết Xe ghép: xe/tài xế, chọn ghế, dịch vụ tiện ích,
// khai báo hàng hoá đi kèm (nếu tài xế nhận) → "Đặt chỗ".
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Avatar, Button, EmptyState, Icon, Icons, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { INTERCITY_CITIES, findCarpool } from '@/constants/mockIntercity';
import { SeatPicker } from '@/components/booking';
import { startTicketDraft, toggleSeat, setCargo, useTicketDraft, bookCarpool } from '@/services/intercityTicketStore';

export default function CarpoolDetailScreen() {
  const { id, dateLabel } = useLocalSearchParams<{ id: string; dateLabel?: string }>();
  const listing = findCarpool(id ?? '');
  const city = listing ? INTERCITY_CITIES.find((c) => c.id === listing.cityId) : null;
  const draft = useTicketDraft();
  const [cargoNote, setCargoNote] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    startTicketDraft(dateLabel ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!listing || !city) {
    return (
      <Screen header={<AppHeader title="Xe ghép" variant="light" left="back" />}>
        <EmptyState icon="mci:car-multiple" title="Không tìm thấy chuyến này" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const seatCount = Math.max(1, draft.seatIds.length);
  const total = listing.pricePerSeat * seatCount;

  const confirm = async () => {
    if (booking) return;
    setBooking(true);
    try {
      setCargo(draft.hasCargo, cargoNote);
      const order = await bookCarpool(listing, dateLabel ?? '');
      router.replace({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: order.id } });
    } finally {
      setBooking(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Chi tiết xe ghép" variant="dark" left="arrow" />}
      scroll
      footer={
        <Button
          title={draft.seatIds.length ? `Đặt ${seatCount} chỗ · đ${total.toLocaleString('vi-VN')}` : 'Chọn ghế để tiếp tục'}
          disabled={!draft.seatIds.length}
          loading={booking}
          onPress={confirm}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.routeCard}>
          <Icon name={Icons.calendar} size={16} color={Colors.primary} />
          <AppText size={13} weight="semiBold" color={Colors.text} style={{ marginLeft: 6 }}>
            {dateLabel || 'Hôm nay'} · Khởi hành {listing.departTime}
          </AppText>
        </View>
        <AppText size={13} color={Colors.textSecondary}>
          TP. Hồ Chí Minh → {city.name} ({city.station.name})
        </AppText>

        <View style={styles.driverCard}>
          <Avatar name={listing.driverName} size={52} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <AppText size={16} weight="bold">
              {listing.driverName}
            </AppText>
            <View style={styles.ratingRow}>
              <Icon name={Icons.star} size={13} color={Colors.secondary} />
              <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
                {listing.driverRating.toFixed(1)} ({listing.driverReviews} đánh giá)
              </AppText>
            </View>
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {listing.vehicleModel} · {listing.vehicleColor} · {listing.vehiclePlate}
            </AppText>
          </View>
          <Icon name={Icons.phone} size={20} color={Colors.primary} />
        </View>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Chọn ghế (tối đa 6)
        </AppText>
        <SeatPicker seats={listing.seats} selected={draft.seatIds} onToggle={(s) => toggleSeat(s.id, s.taken)} max={6} />

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Dịch vụ trên xe
        </AppText>
        <View style={styles.amenityWrap}>
          {listing.amenities.map((a) => (
            <View key={a} style={styles.amenityTag}>
              <Icon name={Icons.checkCircle} size={14} color={Colors.success} />
              <AppText size={13} color={Colors.text} style={{ marginLeft: 4 }}>
                {a}
              </AppText>
            </View>
          ))}
        </View>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Hàng hoá đi kèm
        </AppText>
        {listing.allowsCargo ? (
          <>
            <SwitchRow
              icon={Icons.box}
              label="Tôi có mang theo hàng hoá"
              sublabel={listing.cargoNote}
              value={draft.hasCargo}
              onValueChange={(v) => setCargo(v, cargoNote)}
            />
            {draft.hasCargo ? (
              <TextField
                placeholder="Mô tả hàng hoá (loại hàng, kích thước ước tính...)"
                value={cargoNote}
                onChangeText={(t) => {
                  setCargoNote(t);
                  setCargo(true, t);
                }}
                containerStyle={{ marginTop: Spacing.sm }}
              />
            ) : null}
          </>
        ) : (
          <View style={styles.noCargoRow}>
            <Icon name={Icons.closeCircle} size={16} color={Colors.textMuted} />
            <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6 }}>
              {listing.cargoNote}
            </AppText>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.xs },
  routeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  noCargoRow: { flexDirection: 'row', alignItems: 'center' },
});
