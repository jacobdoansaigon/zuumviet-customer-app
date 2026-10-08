// components/booking/TripSchedulePicker.tsx — "Ngày giờ đi" cho Thuê cả xe (xe đường dài): dải ngày cuộn ngang (3 ô/màn)
// + dải giờ khởi hành. Giờ theo giờ Việt Nam; mốc giờ ngoài khoảng đặt trước của dịch vụ (catalog: tối thiểu
// minScheduleLeadMinutes, tối đa maxScheduleDays) bị làm mờ, không chọn được.
// Chuyến về (khứ hồi có ngày giờ về) chưa có trên API → không hỏi; muốn quay về điểm đón thì chọn "Khứ hồi" ở màn xác nhận.
import React from 'react';
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Chip } from '@/components/ui';
import type { DateOption } from '@/services/intercity';
import { vnDateTime } from '@/services/vnTime';

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
  return vnDateTime(v.dateKey, v.time);
}

/** Khoảng thời điểm đặt được: [bây giờ + lead (+ đệm), bây giờ + maxDays ngày] */
function scheduleWindow(leadMinutes: number, maxDays: number, bufferMinutes = 0) {
  const now = Date.now();
  return { earliest: now + (leadMinutes + bufferMinutes) * 60_000, latest: now + maxDays * 24 * 3600_000 };
}

/** Mốc sớm nhất còn đặt được trong danh sách ngày/giờ — ưu tiên 6:00 sáng; null nếu không có mốc nào hợp lệ */
export function defaultTripSchedule(dateOptions: DateOption[], leadMinutes: number, maxDays: number, preferred = '06:00'): TripScheduleValue | null {
  const { earliest, latest } = scheduleWindow(leadMinutes, maxDays, 5);
  const ok = (dateKey: string, time: string) => {
    const ts = scheduleToTs({ dateKey, time });
    return ts >= earliest && ts <= latest;
  };
  for (const d of dateOptions) {
    if (ok(d.key, preferred)) return { dateKey: d.key, time: preferred };
    const t = DEPART_TIME_CHOICES.find((time) => ok(d.key, time));
    if (t) return { dateKey: d.key, time: t };
  }
  return null;
}

interface Props {
  value: TripScheduleValue;
  onChange: (next: TripScheduleValue) => void;
  dateOptions: DateOption[];
  /** phút báo trước tối thiểu (rules.minScheduleLeadMinutes) */
  leadMinutes: number;
  /** số ngày đặt trước tối đa (rules.maxScheduleDays) */
  maxDays: number;
  timeChoices?: string[];
}

export const TripSchedulePicker: React.FC<Props> = ({ value, onChange, dateOptions, leadMinutes, maxDays, timeChoices = DEPART_TIME_CHOICES }) => {
  // Hiện đúng 3 ô ngày/màn hình rồi cuộn ngang cho các ngày còn lại
  const { width: winWidth } = useWindowDimensions();
  const dateCellWidth = Math.max(88, Math.floor((winWidth - Spacing.screen * 2 - Spacing.sm * 2) / 3));
  const { earliest, latest } = scheduleWindow(leadMinutes, maxDays);
  const usable = (dateKey: string, time: string) => {
    const ts = scheduleToTs({ dateKey, time });
    return ts >= earliest && ts <= latest;
  };

  return (
    <View style={styles.card}>
      <AppText size={15} weight="bold" style={styles.title}>
        Ngày giờ đi
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dateOptions.map((d) => {
          const on = d.key === value.dateKey;
          const any = timeChoices.some((t) => usable(d.key, t));
          return (
            <Pressable
              key={d.key}
              disabled={!any}
              onPress={() => {
                const time = usable(d.key, value.time) ? value.time : (timeChoices.find((t) => usable(d.key, t)) ?? value.time);
                onChange({ dateKey: d.key, time });
              }}
              style={[styles.dateCell, { width: dateCellWidth }, on && styles.dateCellActive, !any && { opacity: 0.35 }]}
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
      <AppText size={11} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
        {leadMinutes > 0 ? `Đặt trước tối thiểu ${leadMinutes >= 60 ? `${Math.round((leadMinutes / 60) * 10) / 10} giờ` : `${leadMinutes} phút`}, ` : ''}
        tối đa {maxDays} ngày (giờ Việt Nam)
      </AppText>
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
