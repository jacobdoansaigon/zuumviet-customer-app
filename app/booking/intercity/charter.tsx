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
import { useVnToday } from '@/hooks/useVnToday';
import { ServiceInfoDialog, TripSchedulePicker, defaultTripSchedule, scheduleToTs, type TripScheduleValue } from '@/components/booking';

export default function CharterScreen() {
  const state = useBooking();
  const catalog = useCatalog();
  const options = optionsFor('intercity', catalog);
  const selected = options.find((o) => o.id === state.optionId) ?? options.find((o) => !o.paused) ?? null;
  const rules = selected?.service.rules;
  const canSchedule = !!rules?.allowScheduling;
  const lead = rules?.minScheduleLeadMinutes ?? 0;
  const maxDays = rules?.maxScheduleDays ?? 0;
  const today = useVnToday();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `today`: dựng lại dải ngày khi qua nửa đêm (giờ VN)
  const dateOptions = useMemo(() => buildDateOptions(Math.max(1, Math.min(14, maxDays + 1))), [maxDays, today]);
  const [info, setInfo] = useState<ServiceOptionView | null>(null);
  const [schedule, setSchedule] = useState<TripScheduleValue | null>(() => (canSchedule ? defaultTripSchedule(dateOptions, lead, maxDays) : null));
  const destLabel = completeReceivers(state)[0]?.place?.title ?? '';
  const pickupLabel = state.sender.place?.title ?? '';

  // chọn sẵn hạng xe đầu tiên đang bán
  useEffect(() => {
    if (selected && selected.id !== state.optionId) switchRideOption('intercity', selected.id);
  }, [selected, state.optionId]);

  // Catalog tải xong sau khi mở màn / qua ngày mới làm ngày đang chọn rơi khỏi dải → chọn lại mặc định hợp lệ
  useEffect(() => {
    if (!canSchedule) return;
    if (!schedule || !dateOptions.some((d) => d.key === schedule.dateKey)) setSchedule(defaultTripSchedule(dateOptions, lead, maxDays));
  }, [canSchedule, schedule, dateOptions, lead, maxDays]);

  // Đồng bộ ngày giờ đi vào bản nháp (scheduledAt của báo giá); dịch vụ không nhận hẹn giờ → đi ngay
  useEffect(() => {
    setOptions({ scheduledAt: canSchedule && schedule ? scheduleToTs(schedule) : null });
  }, [schedule, canSchedule]);

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

        {canSchedule && schedule ? (
          <TripSchedulePicker value={schedule} onChange={setSchedule} dateOptions={dateOptions} leadMinutes={lead} maxDays={maxDays} />
        ) : null}

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
