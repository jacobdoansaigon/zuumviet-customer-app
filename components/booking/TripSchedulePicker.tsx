// components/booking/TripSchedulePicker.tsx — "Lịch trình" dùng chung cho Thuê cả xe & Xe ghép: chọn
// một chiều (mặc định) hoặc khứ hồi (đi & về), ngày + giờ đi (mặc định 6:00 sáng), và nếu khứ hồi thì
// thêm ngày + giờ về. Mỗi dòng (ngày đi / giờ đi / ngày về / giờ về) là 1 dải cuộn ngang riêng: ngày hiện
// 3 ô rồi cuộn tiếp, giờ hiện ~5 mốc rồi cuộn tiếp.
import React from 'react';
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Chip, Icons, SwitchRow } from '@/components/ui';
import { DEPART_TIME_CHOICES, type DateOption, type TripScheduleValue } from '@/constants/mockIntercity';

interface Props {
  value: TripScheduleValue;
  onChange: (patch: Partial<TripScheduleValue>) => void;
  /** danh sách ngày cho chiều đi */
  dateOptions: DateOption[];
  /** danh sách ngày cho chiều về (phạm vi có thể xa hơn chiều đi); mặc định dùng chung dateOptions nếu không truyền */
  returnDateOptions?: DateOption[];
  timeChoices?: string[];
}

export const TripSchedulePicker: React.FC<Props> = ({ value, onChange, dateOptions, returnDateOptions, timeChoices = DEPART_TIME_CHOICES }) => {
  const returnOptions = (returnDateOptions ?? dateOptions).filter((d) => d.key >= value.departDateKey);
  // Hiện đúng 3 ô ngày/màn hình rồi cuộn ngang cho các ngày còn lại
  const { width: winWidth } = useWindowDimensions();
  const dateCellWidth = Math.max(88, Math.floor((winWidth - Spacing.screen * 2 - Spacing.sm * 2) / 3));

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
      <DateStrip
        options={dateOptions}
        value={value.departDateKey}
        cellWidth={dateCellWidth}
        onChange={(k) => onChange({ departDateKey: k, returnDateKey: value.returnDateKey < k ? k : value.returnDateKey })}
      />
      <TimeChips choices={timeChoices} value={value.departTime} onChange={(t) => onChange({ departTime: t })} />

      {value.tripType === 'roundtrip' ? (
        <>
          <AppText size={13} weight="semiBold" color={Colors.textSecondary} style={styles.subLabel}>
            Ngày giờ về
          </AppText>
          <DateStrip options={returnOptions} value={value.returnDateKey} cellWidth={dateCellWidth} onChange={(k) => onChange({ returnDateKey: k })} />
          <TimeChips choices={timeChoices} value={value.returnTime} onChange={(t) => onChange({ returnTime: t })} />

          <SwitchRow
            icon={Icons.steering}
            label="Phục vụ suốt hành trình"
            sublabel={
              value.waitForReturn
                ? 'Có — xe & tài xế ở lại đón bạn cho chuyến về'
                : 'Không — xe không cần ở lại, chỉ đưa bạn đi chiều đi'
            }
            value={value.waitForReturn}
            onValueChange={(v) => onChange({ waitForReturn: v })}
            style={styles.waitRow}
          />
        </>
      ) : null}
    </View>
  );
};

const DateStrip: React.FC<{ options: DateOption[]; value: string; cellWidth: number; onChange: (key: string) => void }> = ({ options, value, cellWidth, onChange }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
    {options.map((d) => (
      <Pressable key={d.key} onPress={() => onChange(d.key)} style={[styles.dateCell, { width: cellWidth }, d.key === value && styles.dateCellActive]}>
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
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeStrip}>
    {choices.map((t) => (
      <Chip key={t} label={t} active={t === value} size="sm" onPress={() => onChange(t)} style={styles.timeChip} />
    ))}
  </ScrollView>
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dateCellActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeStrip: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  timeChip: { marginRight: 0, marginBottom: 0 },
  waitRow: { marginTop: Spacing.sm },
});

export default TripSchedulePicker;
