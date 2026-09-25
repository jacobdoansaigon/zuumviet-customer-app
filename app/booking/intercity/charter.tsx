// app/booking/intercity/charter.tsx — "Thuê cả xe": chọn hạng xe riêng (4 → 45 chỗ) + lịch trình (một chiều
// mặc định, khởi hành 6:00 sáng, hoặc khứ hồi có ngày giờ về). Dùng lại nguyên bộ máy đặt xe hiện có
// (confirm.tsx → tracking.tsx) — Xe lớn (16/29/45 chỗ) hiện có thể chưa có xe đăng ký sẵn liên tục, khách ghi
// rõ nhu cầu ở phần "Ghi chú" (màn Xác nhận) để nhà xe/tài xế phù hợp nhận cuốc.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Button, Icon, Screen, ServiceOption } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { SERVICE_GROUPS, type ServiceOptionDef } from '@/constants/mockBooking';
import { useBooking, isReceiverComplete, switchRideOption, setOptions, computePrice, formatVnd } from '@/services/bookingStore';
import { ServiceInfoDialog, TripSchedulePicker } from '@/components/booking';
import { buildDateOptions, defaultTripSchedule, dateTimeToTs, type TripScheduleValue } from '@/constants/mockIntercity';

// Ngày đi: 3 ô hiện sẵn + cuộn ngang cho 10 ngày còn lại (13 ngày). Ngày về: 3 ô hiện sẵn + cuộn ngang cho
// 20 ngày còn lại (23 ngày) — dài hơn vì chuyến về có thể chọn xa hơn chuyến đi.
const DATE_OPTIONS = buildDateOptions(13);
const RETURN_DATE_OPTIONS = buildDateOptions(23);

export default function CharterScreen() {
  const state = useBooking();
  const group = SERVICE_GROUPS.intercity;
  const options = group.options;
  const selected = options.find((o) => o.id === state.optionId) ?? options[0]!;
  const [info, setInfo] = useState<ServiceOptionDef | null>(null);
  const [schedule, setSchedule] = useState<TripScheduleValue>(() => defaultTripSchedule(DATE_OPTIONS));
  const destLabel = state.receivers.filter(isReceiverComplete)[0]?.place?.title ?? '';

  // Đồng bộ lịch trình đã chọn vào đơn (dùng chung field scheduledAt/returnAt/waitForReturn sẵn có của bookingStore)
  useEffect(() => {
    setOptions({
      scheduledAt: dateTimeToTs(schedule.departDateKey, schedule.departTime),
      returnAt: schedule.tripType === 'roundtrip' ? dateTimeToTs(schedule.returnDateKey, schedule.returnTime) : null,
      waitForReturn: schedule.waitForReturn,
    });
  }, [schedule]);

  const pick = (o: ServiceOptionDef) => {
    switchRideOption('intercity', o.id);
  };

  return (
    <Screen
      header={<AppHeader title="Thuê cả xe" variant="dark" left="back" />}
      scroll
      footer={<Button title={`Tiếp tục · ${formatVnd(computePrice(state, selected.id).total)}`} onPress={() => router.push('/booking/confirm')} />}
    >
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            TP. Hồ Chí Minh → {destLabel}
          </AppText>
        </View>

        <TripSchedulePicker
          value={schedule}
          onChange={(patch) => setSchedule((s) => ({ ...s, ...patch }))}
          dateOptions={DATE_OPTIONS}
          returnDateOptions={RETURN_DATE_OPTIONS}
        />

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Chọn hạng xe
        </AppText>
        <View style={styles.options}>
          {options.map((o) => (
            <ServiceOption
              key={o.id}
              name={o.name}
              description={o.description}
              price={formatVnd(computePrice(state, o.id).total)}
              icon={o.icon}
              selected={o.id === selected.id}
              onPress={() => pick(o)}
              onInfoPress={() => setInfo(o)}
            />
          ))}
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
