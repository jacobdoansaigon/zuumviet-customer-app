// app/booking/intercity/[cityId].tsx — Xe ghép & Mua vé xe đi {city}: chọn ngày đi + khung giờ,
// 2 tab kết quả (Xe ghép của tài xế / Vé xe theo nhà xe, mỗi nhà xe có thể có nhiều chuyến).
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Avatar, Chip, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import {
  INTERCITY_CITIES,
  TIME_SLOTS,
  buildDateOptions,
  carpoolsForCity,
  operatorsForCity,
  timeInSlot,
  type CarpoolListing,
  type BusTrip,
} from '@/constants/mockIntercity';

const DATE_OPTIONS = buildDateOptions();

export default function IntercityResultsScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const city = INTERCITY_CITIES.find((c) => c.id === cityId);
  const [tab, setTab] = useState<'carpool' | 'bus'>('carpool');
  const [dateKey, setDateKey] = useState(DATE_OPTIONS[0]!.key);
  const [slotId, setSlotId] = useState<(typeof TIME_SLOTS)[number]['id']>('all');
  const slot = TIME_SLOTS.find((s) => s.id === slotId)!;
  const dateLabel = DATE_OPTIONS.find((d) => d.key === dateKey);

  const carpools = useMemo(() => (city ? carpoolsForCity(city.id).filter((c) => timeInSlot(c.departTime, slot)) : []), [city, slot]);
  const operatorGroups = useMemo(() => (city ? operatorsForCity(city.id).map((g) => ({ ...g, trips: g.trips.filter((t) => timeInSlot(t.departTime, slot)) })).filter((g) => g.trips.length > 0) : []), [city, slot]);

  if (!city) {
    return (
      <Screen header={<AppHeader title="Xe đường dài" variant="light" left="back" />}>
        <EmptyState icon="mci:bus" title="Không tìm thấy tuyến này" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const openCarpool = (c: CarpoolListing) =>
    router.push({ pathname: '/booking/intercity/carpool/[id]', params: { id: c.id, dateKey, dateLabel: dateLabel ? `${dateLabel.label} ${dateLabel.sub}` : '' } });
  const openBusTrip = (t: BusTrip) =>
    router.push({ pathname: '/booking/intercity/bus/[id]', params: { id: t.id, dateKey, dateLabel: dateLabel ? `${dateLabel.label} ${dateLabel.sub}` : '' } });

  return (
    <Screen header={<AppHeader title={`Đi ${city.name}`} variant="dark" left="back" />} background={Colors.white}>
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

        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('carpool')} style={[styles.tabBtn, tab === 'carpool' && styles.tabBtnActive]}>
            <AppText size={14} weight="bold" color={tab === 'carpool' ? Colors.primary : Colors.textSecondary}>
              Xe ghép ({carpools.length})
            </AppText>
          </Pressable>
          <Pressable onPress={() => setTab('bus')} style={[styles.tabBtn, tab === 'bus' && styles.tabBtnActive]}>
            <AppText size={14} weight="bold" color={tab === 'bus' ? Colors.primary : Colors.textSecondary}>
              Mua vé xe ({operatorGroups.reduce((n, g) => n + g.trips.length, 0)})
            </AppText>
          </Pressable>
        </View>

        {tab === 'carpool' ? (
          carpools.length ? (
            <View style={styles.list}>
              {carpools.map((c) => {
                const left = c.seats.filter((s) => !s.taken).length;
                return (
                  <Pressable key={c.id} onPress={() => openCarpool(c)} style={styles.card}>
                    <View style={styles.cardHead}>
                      <Avatar name={c.driverName} size={40} />
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <AppText size={14} weight="bold">
                          {c.driverName}
                        </AppText>
                        <AppText size={12} color={Colors.textSecondary}>
                          {c.vehicleModel} · {c.vehiclePlate}
                        </AppText>
                      </View>
                      <View style={styles.ratingPill}>
                        <Icon name={Icons.star} size={12} color={Colors.secondary} />
                        <AppText size={12} weight="bold" color={Colors.text} style={{ marginLeft: 2 }}>
                          {c.driverRating.toFixed(1)}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <View>
                        <AppText size={18} weight="extraBold" color={Colors.text}>
                          {c.departTime}
                        </AppText>
                        <AppText size={12} color={Colors.textSecondary}>
                          Còn {left} chỗ
                        </AppText>
                      </View>
                      <AppText size={18} weight="extraBold" color={Colors.primary}>
                        {c.priceLabel}
                      </AppText>
                    </View>
                    <View style={styles.amenityRow}>
                      {c.amenities.slice(0, 3).map((a) => (
                        <View key={a} style={styles.amenityTag}>
                          <AppText size={11} color={Colors.textSecondary}>
                            {a}
                          </AppText>
                        </View>
                      ))}
                      {c.allowsCargo ? (
                        <View style={[styles.amenityTag, styles.cargoTag]}>
                          <AppText size={11} color={Colors.successDark}>
                            Nhận hàng hoá
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{ marginTop: Spacing['2xl'] }}>
              <EmptyState icon="mci:car-multiple" title="Không có xe ghép trong khung giờ này" />
            </View>
          )
        ) : operatorGroups.length ? (
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
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, marginTop: Spacing.xs },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  list: { padding: Spacing.screen, gap: Spacing.md },
  card: { borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, padding: Spacing.md, ...Shadow.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.md },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  amenityTag: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  cargoTag: { backgroundColor: Colors.successBg },
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
