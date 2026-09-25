// app/booking/intercity/[cityId].tsx — Mua vé xe đi {city}: chọn ngày đi + khung giờ, xem chuyến theo từng
// nhà xe (1 nhà xe có thể chạy nhiều chuyến/ngày). Xe ghép giờ là màn riêng (carpool-request.tsx, mô hình
// gửi yêu cầu → tài xế nhận cuốc), không còn ở màn kết quả này — vào từ 3 thẻ phương án ở app/booking/index.tsx.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { INTERCITY_CITIES, TIME_SLOTS, buildDateOptions, operatorsForCity, timeInSlot, type BusTrip } from '@/constants/mockIntercity';

const DATE_OPTIONS = buildDateOptions();

export default function IntercityResultsScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const city = INTERCITY_CITIES.find((c) => c.id === cityId);
  const [dateKey, setDateKey] = useState(DATE_OPTIONS[0]!.key);
  const [slotId, setSlotId] = useState<(typeof TIME_SLOTS)[number]['id']>('all');
  const slot = TIME_SLOTS.find((s) => s.id === slotId)!;
  const dateLabel = DATE_OPTIONS.find((d) => d.key === dateKey);

  const operatorGroups = useMemo(
    () => (city ? operatorsForCity(city.id).map((g) => ({ ...g, trips: g.trips.filter((t) => timeInSlot(t.departTime, slot)) })).filter((g) => g.trips.length > 0) : []),
    [city, slot],
  );

  if (!city) {
    return (
      <Screen header={<AppHeader title="Xe đường dài" variant="light" left="back" />}>
        <EmptyState icon="mci:bus" title="Không tìm thấy tuyến này" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const openBusTrip = (t: BusTrip) =>
    router.push({ pathname: '/booking/intercity/bus/[id]', params: { id: t.id, dateKey, dateLabel: dateLabel ? `${dateLabel.label} ${dateLabel.sub}` : '' } });

  return (
    <Screen header={<AppHeader title={`Mua vé đi ${city.name}`} variant="dark" left="back" />} background={Colors.white}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6 }}>
            TP. Hồ Chí Minh → {city.name} · {city.durationLabel} · {city.station.name}
          </AppText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {DATE_OPTIONS.map((d) => (
            <Pressable key={d.key} onPress={() => setDateKey(d.key)} style={[styles.dateCell, d.key === dateKey && styles.dateCellActive]}>
              <AppText size={13} weight={d.key === dateKey ? 'bold' : 'medium'} color={d.key === dateKey ? Colors.white : Colors.text}>
                {d.label}
              </AppText>
              <AppText size={11} color={d.key === dateKey ? 'rgba(255,255,255,0.85)' : Colors.textSecondary}>
                {d.sub}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotStrip}>
          {TIME_SLOTS.map((s) => (
            <Chip key={s.id} label={s.label} active={s.id === slotId} size="sm" onPress={() => setSlotId(s.id)} style={styles.slotChip} />
          ))}
        </ScrollView>

        <View style={styles.sectionLabelWrap}>
          <AppText size={12} weight="semiBold" color={Colors.textSecondary}>
            {operatorGroups.reduce((n, g) => n + g.trips.length, 0)} chuyến khả dụng
          </AppText>
        </View>

        {operatorGroups.length ? (
          <View style={styles.list}>
            {operatorGroups.map((g) => (
              <View key={g.operator.id} style={styles.operatorGroup}>
                <View style={styles.operatorHead}>
                  <View style={styles.operatorLogo}>
                    <Icon name={g.operator.icon} size={20} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <AppText size={15} weight="bold">
                      {g.operator.name}
                    </AppText>
                    <AppText size={12} color={Colors.textSecondary} numberOfLines={2}>
                      {g.operator.description}
                    </AppText>
                  </View>
                  <View style={styles.ratingPill}>
                    <Icon name={Icons.star} size={12} color={Colors.secondary} />
                    <AppText size={12} weight="bold" color={Colors.text} style={{ marginLeft: 2 }}>
                      {g.operator.rating.toFixed(1)}
                    </AppText>
                  </View>
                </View>
                {g.trips.map((t) => {
                  const left = t.seats.filter((s) => !s.taken).length;
                  return (
                    <Pressable key={t.id} onPress={() => openBusTrip(t)} style={styles.tripRow}>
                      <View style={{ flex: 1 }}>
                        <AppText size={16} weight="bold">
                          {t.departTime}
                        </AppText>
                        <AppText size={12} color={Colors.textSecondary} numberOfLines={1}>
                          {t.vehicleType} · còn {left} chỗ
                        </AppText>
                      </View>
                      <AppText size={15} weight="extraBold" color={Colors.primary}>
                        {t.priceLabel}
                      </AppText>
                      <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} style={{ marginLeft: Spacing.sm }} />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ marginTop: Spacing['2xl'] }}>
            <EmptyState icon="mci:bus" title="Không có chuyến trong khung giờ này" />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing.base },
  dateStrip: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, gap: Spacing.sm },
  dateCell: {
    width: 68,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dateCellActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotStrip: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm, gap: Spacing.sm },
  slotChip: { marginRight: 0 },
  sectionLabelWrap: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: 2 },
  list: { padding: Spacing.screen, gap: Spacing.md },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  operatorGroup: { borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, overflow: 'hidden', ...Shadow.sm },
  operatorHead: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.primaryBg },
  operatorLogo: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
