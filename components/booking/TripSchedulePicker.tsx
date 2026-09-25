// components/booking/TripSchedulePicker.tsx — "Lịch trình" dùng chung cho Thuê cả xe & Xe ghép: chọn
// một chiều (mặc định) hoặc khứ hồi (đi & về), ngày + giờ đi (mặc định 6:00 sáng), và nếu khứ hồi thì
// thêm ngày + giờ về.
import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Chip } from '@/components/ui';
import { DEPART_TIME_CHOICES, type DateOption, type TripScheduleValue } from '@/constants/mockIntercity';

interface Props {
  value: TripScheduleValue;
  onChange: (patch: Partial<TripScheduleValue>) => void;
  dateOptions: DateOption[];
  timeChoices?: string[];
}

export const TripSchedulePicker: React.FC<Props> = ({ value, onChange, dateOptions, timeChoices = DEPART_TIME_CHOICES }) => {
  const returnDateOptions = dateOptions.filter((d) => d.key >= value.departDateKey);

  return (
    <View>
      <AppText size={15} weight="bold" style={styles.title}>
        Lịch trình
      </AppText>

      <View style={styles.tripTypeRow}>
        <Pressable
          onPress={() => onChange({ tripType: 'oneway' })}
          style={[styles.tripTypeBtn, value.tripType === 'oneway' && styles.tripTypeBtnActive]}
        >
          <AppText size={14} weight="bold" color={value.tripType === 'oneway' ? Colors.white : Colors.text}>
            Chỉ chiều đi
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => onChange({ tripType: 'roundtrip', returnDateKey: value.returnDateKey < value.departDateKey ? value.departDateKey : value.returnDateKey })}
          style={[styles.tripTypeBtn, value.tripType === 'roundtrip' && styles.tripTypeBtnActive]}
        >
          <AppText size={14} weight="bold" color={value.tripType === 'roundtrip' ? Colors.white : Colors.text}>
            Khứ hồi (đi &amp; về)
          </AppText>
        </Pressable>
      </View>

      <AppText size={13} weight="semiBold" color={Colors.textSecondary} style={styles.subLabel}>
        Ngày giờ đi
      </AppText>
      <DateStrip options={dateOptions} value={value.departDateKey} onChange={(k) => onChange({ departDateKey: k, returnDateKey: value.returnDateKey < k ? k : value.returnDateKey })} />
      <TimeChips choices={timeChoices} value={value.departTime} onChange={(t) => onChange({ departTime: t })} />

      {value.tripType === 'roundtrip' ? (
        <>
          <AppText size={13} weight="semiBold" color={Colors.textSecondary} style={styles.subLabel}>
            Ngày giờ về
          </AppText>
          <DateStrip options={returnDateOptions} value={value.returnDateKey} onChange={(k) => onChange({ returnDateKey: k })} />
          <TimeChips choices={timeChoices} value={value.returnTime} onChange={(t) => onChange({ returnTime: t })} />
        </>
      ) : null}
    </View>
  );
};

const DateStrip: React.FC<{ options: DateOption[]; value: string; onChange: (key: string) => void }> = ({ options, value, onChange }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
    {options.map((d) => (
      <Pressable key={d.key} onPress={() => onChange(d.key)} style={[styles.dateCell, d.key === value && styles.dateCellActive]}>
        <AppText size={13} weight={d.key === value ? 'bold' : 'medium'} color={d.key === value ? Colors.white : Colors.text}>
          {d.label}
        </AppText>
        <AppText size={11} color={d.key === value ? 'rgba(255,255,255,0.85)' : Colors.textSecondary}>
          {d.sub}
        </AppText>
      </Pressable>
    ))}
  </ScrollView>
);

const TimeChips: React.FC<{ choices: string[]; value: string; onChange: (t: string) => void }> = ({ choices, value, onChange }) => (
  <View style={styles.timeWrap}>
    {choices.map((t) => (
      <Chip key={t} label={t} active={t === value} size="sm" onPress={() => onChange(t)} style={styles.timeChip} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  title: { marginBottom: Spacing.sm },
  tripTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tripTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tripTypeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subLabel: { marginTop: Spacing.sm, marginBottom: 6 },
  dateStrip: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  dateCell: {
    width: 64,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dateCellActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeChip: { marginRight: 0, marginBottom: 0 },
});

export default TripSchedulePicker;
