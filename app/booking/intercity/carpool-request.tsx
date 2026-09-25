// app/booking/intercity/carpool-request.tsx — "Xe ghép": khách chọn số chỗ, lịch trình (một chiều mặc định,
// khởi hành 6:00 sáng, hoặc khứ hồi có ngày giờ về), hàng hoá, yêu cầu đón/trả tận nơi hay ra bến gần rồi GỬI
// YÊU CẦU (chưa thấy xe/tài xế cụ thể). Tài xế xe ghép đang chạy tuyến này "nhận cuốc" (mô phỏng ở màn
// carpool-tracking) rồi mới gửi chi tiết xe cho khách.
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Button, Icon, Icons, Radio, Screen, Stepper, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { buildDateOptions, suggestNearestCity } from '@/constants/mockIntercity';
import { TripSchedulePicker } from '@/components/booking';
import { useCarpoolDraft, setSeatCount, setCarpoolSchedule, setCarpoolCargo, setDropoffPref, submitCarpoolRequest } from '@/services/carpoolRequestStore';

const DATE_OPTIONS = buildDateOptions();

export default function CarpoolRequestScreen() {
  const { cityId, cityName, destinationLabel } = useLocalSearchParams<{ cityId?: string; cityName?: string; destinationLabel?: string }>();
  const draft = useCarpoolDraft();
  const [cargoNote, setCargoNoteLocal] = useState('');
  const [sending, setSending] = useState(false);

  // Điểm đến chưa khớp tỉnh/thành đang phục vụ → vẫn nhận yêu cầu, dùng tài xế của tỉnh gần nhất để mô phỏng ghép chuyến
  const fallback = !cityId ? suggestNearestCity() : null;
  const finalCityId = cityId ?? fallback!.id;
  const finalCityName = cityName ?? fallback!.name;
  const finalDestLabel = destinationLabel || finalCityName;

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      setCarpoolCargo(draft.hasCargo, cargoNote);
      const req = await submitCarpoolRequest(finalCityId, finalCityName, finalDestLabel);
      router.replace({ pathname: '/booking/intercity/carpool-tracking/[requestId]', params: { requestId: req.id } });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title="Xe ghép" variant="dark" left="back" />}
      scroll
      footer={<Button title="Tìm xe ghép" loading={sending} onPress={() => void submit()} />}
    >
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            TP. Hồ Chí Minh → {finalDestLabel}
          </AppText>
        </View>
        {fallback ? (
          <AppText size={12} color={Colors.textSecondary} style={styles.fallbackNote}>
            Chưa có tài xế xe ghép đăng đúng tuyến này — hệ thống sẽ tìm tài xế gần nhất đang chạy tuyến {fallback.name}, ghi rõ điểm đến ở phần hàng hoá/ghi chú bên dưới nếu cần.
          </AppText>
        ) : null}

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <AppText size={15} weight="bold">
                Số chỗ
              </AppText>
              <AppText size={12} color={Colors.textSecondary}>
                Tối đa 6 chỗ / yêu cầu
              </AppText>
            </View>
            <Stepper value={draft.seatCount} onChange={setSeatCount} min={1} max={6} />
          </View>
        </View>

        <View style={styles.scheduleWrap}>
          <TripSchedulePicker value={draft.schedule} onChange={setCarpoolSchedule} dateOptions={DATE_OPTIONS} />
        </View>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Đón / trả
        </AppText>
        <View style={styles.choiceGroup}>
          <Radio selected={draft.dropoffPref === 'home'} onPress={() => setDropoffPref('home')} label="Đón/trả tận nơi" style={styles.choiceRow} />
          <AppText size={12} color={Colors.textSecondary} style={styles.choiceSub}>
            Tài xế ghé đón và trả gần địa chỉ của bạn (có thể phụ thu tuỳ tuyến)
          </AppText>
          <Radio selected={draft.dropoffPref === 'station'} onPress={() => setDropoffPref('station')} label="Ra bến xe / điểm hẹn gần nhất" style={styles.choiceRow} />
          <AppText size={12} color={Colors.textSecondary} style={styles.choiceSub}>
            Bạn tự ra điểm hẹn chung — thường nhanh hơn và không phụ thu
          </AppText>
        </View>

        <AppText size={15} weight="bold" style={styles.sectionTitle}>
          Hàng hoá gửi kèm
        </AppText>
        <SwitchRow
          icon={Icons.box}
          label="Gửi thêm hàng hoá"
          sublabel="Tài xế nhận hàng nhỏ gọn, phụ thu thoả thuận trực tiếp"
          value={draft.hasCargo}
          onValueChange={(v) => setCarpoolCargo(v, cargoNote)}
        />
        {draft.hasCargo ? (
          <TextField
            placeholder="Mô tả hàng hoá và nhu cầu khác cho tài xế (loại hàng, kích thước, ghi chú thêm...)"
            value={cargoNote}
            onChangeText={(t) => {
              setCargoNoteLocal(t);
              setCarpoolCargo(true, t);
            }}
            containerStyle={{ marginTop: Spacing.sm }}
          />
        ) : null}

        <AppText size={11} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg }}>
          Giá xe ghép sẽ được tài xế báo khi nhận cuốc (dữ liệu mẫu, demo)
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  fallbackNote: { marginTop: Spacing.xs, marginBottom: Spacing.sm },
  card: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleWrap: { marginTop: Spacing.xl },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  choiceGroup: { gap: 2 },
  choiceRow: { paddingVertical: Spacing.sm },
  choiceSub: { marginLeft: 34, marginTop: -6, marginBottom: 4 },
});
