// app/booking/intercity/bus/[id].tsx — Chi tiết Mua vé xe: nhà xe, chuyến cụ thể, chọn ghế, dịch vụ,
// hàng hoá gửi kèm (có phụ phí), chọn đón/trả tại nhà hay bến xe → "Đặt vé".
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, EmptyState, Icon, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { INTERCITY_CITIES, findBusTrip, findOperator, type PickupOption } from '@/constants/mockIntercity';
import { SeatPicker } from '@/components/booking';
import { startTicketDraft, toggleSeat, setCargo, setPickup, setDropoff, useTicketDraft, bookBusTrip } from '@/services/intercityTicketStore';

export default function BusTripDetailScreen() {
  const { id, dateLabel } = useLocalSearchParams<{ id: string; dateLabel?: string }>();
  const trip = findBusTrip(id ?? '');
  const operator = trip ? findOperator(trip.operatorId) : null;
  const city = trip ? INTERCITY_CITIES.find((c) => c.id === trip.cityId) : null;
  const draft = useTicketDraft();
  const [cargoNote, setCargoNote] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    startTicketDraft(dateLabel ?? '');
    if (trip) {
      setPickup(trip.pickupOptions[0]!);
      setDropoff(trip.dropoffOptions[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!trip || !operator || !city) {
    return (
      <Screen header={<AppHeader title="Vé xe" variant="light" left="back" />}>
        <EmptyState icon="mci:bus" title="Không tìm thấy chuyến này" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const seatCount = Math.max(1, draft.seatIds.length);
  const cargoFee = draft.hasCargo ? trip.cargoFee : 0;
  const pickupFee = draft.pickup?.fee ?? 0;
  const dropoffFee = draft.dropoff?.fee ?? 0;
  const total = trip.pricePerSeat * seatCount + cargoFee + pickupFee + dropoffFee;

  const confirm = async () => {
    if (booking) return;
    setBooking(true);
    try {
      setCargo(draft.hasCargo, cargoNote);
      const order = await bookBusTrip(trip, dateLabel ?? '');
      router.replace({ pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: order.id } });
    } finally {
      setBooking(false);
    }
  };

  const renderChoice = (options: PickupOption[], value: PickupOption | null, onPick: (p: PickupOption) => void) => (
    <View style={styles.choiceGroup}>
      {options.map((o) => (
        <Radio
          key={o.type}
          selected={value?.type === o.type}
          onPress={() => onPick(o)}
          style={styles.choiceRow}
          label={`${o.label}${o.fee > 0 ? ` (+đ${o.fee.toLocaleString('vi-VN')})` : ' (miễn phí)'}`}
        />
      ))}
      {value ? (
        <AppText size={12} color={Colors.textSecondary} style={styles.choiceSub}>
          {value.sub}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <Screen
      header={<AppHeader title="Chi tiết chuyến xe" variant="dark" left="arrow" />}
      scroll
      footer={
        <Button
          title={draft.seatIds.length ? `Đặt ${seatCount} vé · đ${total.toLocaleString('vi-VN')}` : 'Chọn ghế để tiếp tục'}
          disabled={!draft.seatIds.length}
          loading={booking}
          onPress={confirm}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.operatorCard}>
          <View style={styles.operatorLogo}>
            <Icon name={operator.icon} size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <AppText size={16} weight="bold">
              {operator.name}
            </AppText>
            <View style={styles.ratingRow}>
              <Icon name={Icons.star} size={13} color={Colors.secondary} />
              <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
                {operator.rating.toFixed(1)} ({operator.reviews.toLocaleString('vi-VN')} đánh giá)
              </AppText>
            </View>
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {operator.description}
            </AppText>
          </View>
        </View>

        <View style={styles.routeCard}>
          <Icon name={Icons.calendar} size={16} color={Colors.primary} />
          <AppText size={13} weight="semiBold" color={Colors.text} style={{ marginLeft: 6 }}>
            {dateLabel || 'Hôm nay'} · Khởi hành {trip.departTime} · {trip.vehicleType}
          </AppText>
        </View>
        <AppText size={13} color={Colors.textSecondary}>
          TP. Hồ Chí Minh → {city.name} · {city.durationLabel}
        </AppText>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Chọn ghế (tối đa 6)
        </AppText>
        <SeatPicker seats={trip.seats} selected={draft.seatIds} onToggle={(s) => toggleSeat(s.id, s.taken)} max={6} />

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Dịch vụ trên xe
        </AppText>
        <View style={styles.amenityWrap}>
          {trip.amenities.map((a) => (
            <View key={a} style={styles.amenityTag}>
              <Icon name={Icons.checkCircle} size={14} color={Colors.success} />
              <AppText size={13} color={Colors.text} style={{ marginLeft: 4 }}>
                {a}
              </AppText>
            </View>
          ))}
        </View>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Điểm đón
        </AppText>
        {renderChoice(trip.pickupOptions, draft.pickup, setPickup)}

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Điểm trả
        </AppText>
        {renderChoice(trip.dropoffOptions, draft.dropoff, setDropoff)}

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Hàng hoá gửi kèm
        </AppText>
        {trip.allowsCargo ? (
          <>
            <SwitchRow
              icon={Icons.box}
              label="Gửi thêm hàng hoá"
              sublabel={`Phụ thu đ${trip.cargoFee.toLocaleString('vi-VN')}/kiện`}
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
              Chuyến này không nhận gửi hàng hoá
            </AppText>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.xs },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  operatorLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  routeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
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
  choiceGroup: { gap: 2 },
  choiceRow: { paddingVertical: Spacing.sm },
  choiceSub: { marginLeft: 34, marginTop: -6, marginBottom: 4 },
  noCargoRow: { flexDirection: 'row', alignItems: 'center' },
});
