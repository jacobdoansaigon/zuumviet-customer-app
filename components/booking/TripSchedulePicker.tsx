// components/booking/TripSchedulePicker.tsx — "Ngày giờ đi" cho Thuê cả xe (xe đường dài): dải ngày cuộn ngang (3 ô/màn)
// + dải giờ khởi hành. Giờ theo giờ Việt Nam; mốc giờ không đủ "đặt trước tối thiểu" của dịch vụ (catalog) bị làm mờ.
// Chuyến về (khứ hồi có ngày giờ về) chưa có trên API → không hỏi; muốn quay về điểm đón thì chọn "Khứ hồi" ở màn xác nhận.
import React from 'react';
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Chip } from '@/components/ui';
import type { DateOption } from '@/services/intercity';

export interface TripScheduleValue {
  /** YYYY-MM-DD (giờ VN) */
  dateKey: string;
  /** "06:00" */
  time: string;
}

/** Giờ khởi hành thường gặp cho tuyến liên tỉnh */
export const DEPART_TIME_CHOICES = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

/** Ngày (giờ VN) + giờ → epoch ms */
export function scheduleToTs(v: TripScheduleValue): number {
  return Date.parse(`${v.dateKey}T${v.time}:00+07:00`);
}

/** Mốc sớm nhất còn đặt được (đủ `leadMinutes` báo trước) trong danh sách ngày/giờ — mặc định 6:00 sáng nếu được */
export function defaultTripSchedule(dateOptions: DateOption[], leadMinutes: number, preferred = '06:00'): TripScheduleValue {
  const earliest = Date.now() + (leadMinutes + 5) * 60_000;
  for (const d of dateOptions) {
    const pref = { dateKey: d.key, time: preferred };
    if (scheduleToTs(pref) >= earliest) return pref;
    const t = DEPART_TIME_CHOICES.find((time) => scheduleToTs({ dateKey: d.key, time }) >= earliest);
    if (t) return { dateKey: d.key, time: t };
  }
  const last = dateOptions[dateOptions.length - 1]!;
  return { dateKey: last.key, time: preferred };
}

interface Props {
  value: TripScheduleValue;
  onChange: (next: TripScheduleValue) => void;
  dateOptions: DateOption[];
  /** phút báo trước tối thiểu (rules.minScheduleLeadMinutes) */
  leadMinutes: number;
  timeChoices?: string[];
}

export const TripSchedulePicker: React.FC<Props> = ({ value, onChange, dateOptions, leadMinutes, timeChoices = DEPART_TIME_CHOICES }) => {
  // Hiện đúng 3 ô ngày/màn hình rồi cuộn ngang cho các ngày còn lại
  const { width: winWidth } = useWindowDimensions();
  const dateCellWidth = Math.max(88, Math.floor((winWidth - Spacing.screen * 2 - Spacing.sm * 2) / 3));
  const earliest = Date.now() + leadMinutes * 60_000;
  const usable = (dateKey: string, time: string) => scheduleToTs({ dateKey, time }) >= earliest;

  return (
    <View style={styles.card}>
      <AppText size={15} weight="bold" style={styles.title}>
        Ngày giờ đi
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dateOptions.map((d) => {
          const on = d.key === value.dateKey;
          return (
            <Pressable
              key={d.key}
              onPress={() => {
                const time = usable(d.key, value.time) ? value.time : (timeChoices.find((t) => usable(d.key, t)) ?? value.time);
                onChange({ dateKey: d.key, time });
              }}
              style={[styles.dateCell, { width: dateCellWidth }, on && styles.dateCellActive]}
            >
              <AppText size={13} weight={on ? 'bold' : 'medium'} color={on ? Colors.primary : Colors.text}>
                {d.label}
              </AppText>
              <AppText size={11} color={on ? Colors.primary : Colors.textSecondary}>
                {d.sub}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeStrip}>
        {timeChoices.map((t) => {
          const ok = usable(value.dateKey, t);
          return (
            <Chip
              key={t}
              label={t}
              active={t === value.time}
              variant="soft"
              size="sm"
              onPress={ok ? () => onChange({ ...value, time: t }) : undefined}
              style={[styles.timeChip, !ok && { opacity: 0.35 }]}
            />
          );
        })}
      </ScrollView>
      {leadMinutes > 0 ? (
        <AppText size={11} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
          Đặt trước tối thiểu {leadMinutes >= 60 ? `${Math.round((leadMinutes / 60) * 10) / 10} giờ` : `${leadMinutes} phút`}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  title: { marginBottom: Spacing.sm },
  dateStrip: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  dateCell: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  dateCellActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  timeStrip: { gap: Spacing.sm, paddingBottom: Spacing.xs, marginTop: Spacing.sm },
  timeChip: { marginRight: 0, marginBottom: 0 },
});

export default TripSchedulePicker;
