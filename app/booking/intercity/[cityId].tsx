// app/booking/intercity/[cityId].tsx — Xe đường dài đi {tỉnh}: chọn ngày đi (giờ VN) + khung giờ, xem chuyến đang bán
// GET /v1/public/intercity/trips?from=ho-chi-minh&to=<cityId>&date=YYYY-MM-DD&kind=bus|carpool.
// kind=bus: "Mua vé xe" (nhà xe); kind=carpool: "Xe ghép" (tài xế cùng tuyến bán ghế trống) — cùng một luồng chọn ghế.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import {
  TIME_SLOTS,
  TRIP_KIND_LABEL,
  buildDateOptions,
  durationLabel,
  ensureIntercityCities,
  findCity,
  searchTrips,
  useIntercityCities,
  vnHour,
  vnTime,
  type IntercityTrip,
  type TripKind,
} from '@/services/intercity';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';

const DATE_OPTIONS = buildDateOptions(7);

export default function IntercityTripsScreen() {
  const { cityId, kind: kindParam } = useLocalSearchParams<{ cityId: string; kind?: string }>();
  const cities = useIntercityCities();
  const city = findCity(cityId, cities);
  const [kind, setKind] = useState<TripKind>(kindParam === 'carpool' ? 'carpool' : 'bus');
  const [dateKey, setDateKey] = useState(DATE_OPTIONS[0]!.key);
  const [slotId, setSlotId] = useState<(typeof TIME_SLOTS)[number]['id']>('all');
  const [trips, setTrips] = useState<IntercityTrip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const slot = TIME_SLOTS.find((s) => s.id === slotId)!;
  const dateOption = DATE_OPTIONS.find((d) => d.key === dateKey);

  useEffect(() => {
    void ensureIntercityCities().catch((e) => setError(errorMessage(e)));
  }, []);

  const load = useCallback(async () => {
    if (!cityId) return;
    setError(null);
    try {
      setTrips(await searchTrips({ to: cityId, date: dateKey, kind }));
    } catch (e) {
      setTrips([]);
      setError(errorMessage(e, 'Không tải được danh sách chuyến'));
    }
  }, [cityId, dateKey, kind]);

  useEffect(() => {
    setTrips(null);
    void load();
  }, [load]);

  // Nhóm theo nhà xe / tài xế, lọc khung giờ
  const groups = useMemo(() => {
    const list = (trips ?? []).filter((t) => slot.id === 'all' || (vnHour(t.departAt) >= slot.from && vnHour(t.departAt) < slot.to));
    const map = new Map<string, { operator: IntercityTrip['operator']; trips: IntercityTrip[] }>();
    for (const t of list.sort((a, b) => Date.parse(a.departAt) - Date.parse(b.departAt))) {
      const g = map.get(t.operator.id) ?? { operator: t.operator, trips: [] };
      g.trips.push(t);
      map.set(t.operator.id, g);
    }
    return [...map.values()];
  }, [trips, slot]);

  if (cities && !city) {
    return (
      <Screen header={<AppHeader title="Xe đường dài" variant="light" left="back" />}>
        <EmptyState icon="mci:bus" title="Không tìm thấy tuyến này" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const openTrip = (t: IntercityTrip) => router.push({ pathname: '/booking/intercity/bus/[id]', params: { id: t.id } });
  const count = groups.reduce((n, g) => n + g.trips.length, 0);

  return (
    <Screen
      header={
        <AppHeader
          title={`${kind === 'bus' ? 'Mua vé đi' : 'Xe ghép đi'} ${city?.name ?? ''}`}
          variant="dark"
          left="back"
          right={{ icon: Icons.ticket, onPress: () => router.push('/booking/intercity/tickets'), label: 'Vé của tôi' }}
        />
      }
      background={Colors.white}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            TP. Hồ Chí Minh → {city?.name ?? ''}
            {city ? ` · ${city.stationName}` : ''}
          </AppText>
        </View>

        <View style={styles.kindRow}>
          {(['bus', 'carpool'] as const).map((k) => (
            <Chip key={k} label={TRIP_KIND_LABEL[k]} icon={k === 'bus' ? 'mci:bus' : 'mci:car-multiple'} active={kind === k} onPress={() => setKind(k)} style={styles.kindChip} />
          ))}
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

        {trips === null ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['2xl'] }} />
        ) : (
          <>
            <View style={styles.sectionLabelWrap}>
              <AppText size={12} weight="semiBold" color={error ? Colors.error : Colors.textSecondary}>
                {error ?? `${count} chuyến còn chỗ · ${dateOption ? `${dateOption.label} ${dateOption.sub}` : ''}`}
              </AppText>
            </View>

            {groups.length ? (
              <View style={styles.list}>
                {groups.map((g) => (
                  <View key={g.operator.id} style={styles.operatorGroup}>
                    <View style={styles.operatorHead}>
                      <View style={styles.operatorLogo}>
                        <Icon name={kind === 'bus' ? 'mci:bus' : 'mci:car-side'} size={20} color={Colors.white} />
                      </View>
                      <AppText size={15} weight="bold" style={{ flex: 1, marginLeft: Spacing.sm }} numberOfLines={1}>
                        {g.operator.name}
                      </AppText>
                    </View>
                    {g.trips.map((t) => (
                      <Pressable key={t.id} onPress={() => openTrip(t)} style={styles.tripRow}>
                        <View style={{ flex: 1 }}>
                          <AppText size={16} weight="bold">
                            {vnTime(t.departAt)} → {vnTime(t.arriveAt)}
                          </AppText>
                          <AppText size={12} color={Colors.textSecondary} numberOfLines={1}>
                            {[t.vehicle.name, durationLabel(t.departAt, t.arriveAt), `còn ${t.seatsAvailable} chỗ`].filter(Boolean).join(' · ')}
                          </AppText>
                        </View>
                        <AppText size={15} weight="extraBold" color={Colors.primary}>
                          {formatVnd(t.pricePerSeat)}
                        </AppText>
                        <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} style={{ marginLeft: Spacing.sm }} />
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: Spacing['2xl'] }}>
                <EmptyState icon={kind === 'bus' ? 'mci:bus' : 'mci:car-multiple'} title={slot.id === 'all' ? 'Chưa có chuyến nào ngày này' : 'Không có chuyến trong khung giờ này'} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing.base },
  kindRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.screen, paddingTop: Spacing.md },
  kindChip: { flex: 1, justifyContent: 'center' },
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
