// app/booking/intercity/choose.tsx — Xe đường dài, sau khi đã nhập điểm đến: chọn 1 trong 3 phương án đi
// (đúng yêu cầu sản phẩm): Thuê cả xe / Xe ghép / Mua vé xe. Mua vé xe cần tỉnh/thành đang có nhà xe chạy;
// Thuê cả xe & Xe ghép nhận mọi địa chỉ (Xe ghép gửi yêu cầu, tài xế gần tuyến sẽ nhận).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Icon, Icons, Screen } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { useBooking, isReceiverComplete } from '@/services/bookingStore';
import { matchIntercityCity, suggestNearestCity } from '@/constants/mockIntercity';

export default function ChooseIntercityModeScreen() {
  const state = useBooking();
  const dest = state.receivers.filter(isReceiverComplete)[0]?.place ?? null;
  const destLabel = dest?.title ?? '';
  const matchedCity = dest ? matchIntercityCity(`${dest.title} ${dest.address}`) : null;
  const nearest = !matchedCity ? suggestNearestCity() : null;

  const openCharter = () => router.push('/booking/intercity/charter');
  const openCarpool = () =>
    router.push({
      pathname: '/booking/intercity/carpool-request',
      params: matchedCity ? { cityId: matchedCity.id, cityName: matchedCity.name, destinationLabel: destLabel } : { destinationLabel: destLabel },
    });
  const openTickets = () => {
    if (!matchedCity) return;
    router.push({ pathname: '/booking/intercity/[cityId]', params: { cityId: matchedCity.id } });
  };

  return (
    <Screen header={<AppHeader title="Chọn phương án đi" variant="dark" left="back" />} scroll background={Colors.white}>
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Icon name="mci:map-marker-distance" size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.textSecondary} style={{ marginLeft: 6, flex: 1 }} numberOfLines={2}>
            TP. Hồ Chí Minh → {destLabel}
          </AppText>
        </View>

        <OptionCard
          icon={Icons.carSide}
          title="Thuê cả xe"
          subtitle="Xe riêng theo yêu cầu · 4 đến 45 chỗ, đón tận nơi. Xe cỡ lớn theo yêu cầu, nhà xe phù hợp sẽ nhận."
          onPress={openCharter}
        />

        <OptionCard
          icon="mci:car-multiple"
          title="Xe ghép"
          subtitle="Chọn số chỗ, thời gian, hàng hoá — gửi yêu cầu để tài xế đang chạy tuyến này nhận cuốc."
          onPress={openCarpool}
        />

        <OptionCard
          icon="mci:bus"
          title="Mua vé xe"
          subtitle={
            matchedCity
              ? 'Chọn nhà xe, chuyến, ghế ngồi, đưa đón tận nơi, thanh toán và nhận vé điện tử.'
              : `Chưa có nhà xe chạy đúng tuyến này. Gần nhất: ${nearest?.name} (${nearest?.region}) · cách khoảng ${nearest?.distanceKm}km.`
          }
          onPress={matchedCity ? openTickets : undefined}
          disabled={!matchedCity}
        />
      </View>
    </Screen>
  );
}

const OptionCard: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; title: string; subtitle: string; onPress?: () => void; disabled?: boolean }> = ({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}) => (
  <Pressable onPress={onPress} disabled={disabled} style={[styles.card, disabled && styles.cardDisabled]}>
    <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled]}>
      <Icon name={icon} size={24} color={disabled ? Colors.gray400 : Colors.white} />
    </View>
    <View style={{ flex: 1 }}>
      <AppText size={16} weight="bold" color={disabled ? Colors.textSecondary : Colors.text}>
        {title}
      </AppText>
      <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
        {subtitle}
      </AppText>
    </View>
    {!disabled ? <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} /> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, gap: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardDisabled: { opacity: 0.6, borderStyle: 'dashed' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  iconWrapDisabled: { backgroundColor: Colors.gray200 },
});
