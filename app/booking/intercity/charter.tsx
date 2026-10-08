// app/booking/intercity/charter.tsx — "Thuê cả xe": chọn hạng xe riêng (dịch vụ nhóm Xe đường dài của catalog)
// + ngày giờ đi (theo luật đặt trước của dịch vụ). Đi tiếp màn xác nhận → báo giá → tạo đơn như mọi dịch vụ khác.
// Ngày giờ về (khứ hồi theo lịch) chưa có trên API — muốn xe quay về điểm đón thì chọn "Khứ hồi" ở màn xác nhận.
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Button, Icon, Screen, ServiceOption } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useBooking, completeReceivers, switchRideOption, setOptions, estimateFor, formatVnd } from '@/services/bookingStore';
import { optionsFor, useCatalog, type ServiceOptionView } from '@/services/catalog';
import { buildDateOptions } from '@/services/intercity';
import { ServiceInfoDialog, TripSchedulePicker, defaultTripSchedule, scheduleToTs, type TripScheduleValue } from '@/components/booking';

export default function CharterScreen() {
  const state = useBooking();
  const catalog = useCatalog();
  const options = optionsFor('intercity', catalog);
  const selected = options.find((o) => o.id === state.optionId) ?? options.find((o) => !o.paused) ?? null;
  const rules = selected?.service.rules;
  const lead = rules?.minScheduleLeadMinutes ?? 0;
  const dateOptions = useMemo(() => buildDateOptions(Math.max(1, Math.min(14, (rules?.maxScheduleDays ?? 7) + 1))), [rules?.maxScheduleDays]);
  const [info, setInfo] = useState<ServiceOptionView | null>(null);
  const [schedule, setSchedule] = useState<TripScheduleValue>(() => defaultTripSchedule(dateOptions, lead));
  const destLabel = completeReceivers(state)[0]?.place?.title ?? '';
  const pickupLabel = state.sender.place?.title ?? '';

  // chọn sẵn hạng xe đầu tiên đang bán
  useEffect(() => {
    if (selected && selected.id !== state.optionId) switchRideOption('intercity', selected.id);
  }, [selected, state.optionId]);

  // Đồng bộ ngày giờ đi vào bản nháp (scheduledAt của báo giá)
  useEffect(() => {
    setOptions({ scheduledAt: scheduleToTs(schedule) });
  }, [schedule]);

  const pick = (o: ServiceOptionView) => {
    if (!o.paused) switchRideOption('intercity', o.id);
  };

  return (
    <Screen
      header={<AppHeader title="Thuê cả xe" variant="dark" left="back" />}
      scroll
      footer={
        <Button
          title={selected ? `Tiếp tục · ~${formatVnd(estimateFor(selected, state))}` : 'Tiếp tục'}
          disabled={!selected || selected.paused}
          onPress={() => router.push('/booking/confirm')}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            {pickupLabel} → {destLabel}
          </AppText>
        </View>

        <TripSchedulePicker value={schedule} onChange={setSchedule} dateOptions={dateOptions} leadMinutes={lead} />

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Chọn hạng xe
        </AppText>
        <View style={styles.options}>
          {options.map((o) => (
            <ServiceOption
              key={o.id}
              name={o.name}
              description={o.description}
              price={o.paused ? undefined : `~${formatVnd(estimateFor(o, state))}`}
              priceHint={o.paused ? 'Tạm ngưng' : undefined}
              icon={o.icon}
              selected={o.id === selected?.id}
              onPress={() => pick(o)}
              onInfoPress={() => setInfo(o)}
            />
          ))}
          {catalog && options.length === 0 ? (
            <AppText size={13} color={Colors.textSecondary}>
              Hiện chưa mở dịch vụ thuê xe đường dài.
            </AppText>
          ) : null}
        </View>
        <AppText size={11} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg }}>
          Xe cỡ lớn (16 chỗ trở lên): ghi rõ nhu cầu (số khách, giờ đi) ở phần Ghi chú tại màn Xác nhận để nhà xe phù hợp nhận cuốc.
        </AppText>
      </View>
      <ServiceInfoDialog
        option={info}
        onClose={() => setInfo(null)}
        onSelect={(o) => {
          pick(o);
          setInfo(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { marginTop: Spacing.sm },
  options: { gap: 4 },
});
