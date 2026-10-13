// AddressMapPreview — màn "chỉ xem": khối địa chỉ (padded) phía trên + bản đồ tràn hết phần còn lại của khung
// (không viền, không bo góc, không margin), chạm bản đồ hoặc "Thay đổi địa chỉ" đều mở lại màn chọn địa điểm.
// Dùng cho điểm đi / điểm đến của các dịch vụ chở khách (Xe máy, Xe hơi, Xe đường dài, Tài xế lái thay).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { AddressBlock } from './AddressBlock';
import { BookingMap } from './BookingMap';
import type { MapStop } from './mapTypes';
import { useRouteShape } from './useRouteShape';
import type { RouteMode } from '@/services/places';

interface AddressMapPreviewProps {
  address?: string | null;
  placeholder: string;
  markerType: 'pickup' | 'dropoff';
  stops: MapStop[];
  showRoute?: boolean;
  /** loại xe của dịch vụ đang chọn → tuyến theo đường xe máy / ô tô / xe tải */
  routeMode?: RouteMode;
  hintLabel: string;
  onChange: () => void;
}

export const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({ address, placeholder, markerType, stops, showRoute = true, routeMode = 'car', hintLabel, onChange }) => {
  // đủ 2 điểm → lấy hình dạng tuyến thật; chưa có thì không vẽ đường (không nối thẳng)
  const route = useRouteShape(showRoute && stops.length > 1 ? stops.map((s) => ({ lat: s.lat, lng: s.lng })) : null, routeMode);
  return (
  <View style={{ flex: 1 }}>
    <View style={styles.addressPad}>
      <AddressBlock address={address} placeholder={placeholder} markerType={markerType} onChange={onChange} />
    </View>

    <Pressable onPress={onChange} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={hintLabel}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <BookingMap stops={stops} showRoute={showRoute && stops.length > 1 && !!route} routePath={route?.path ?? null} bottomPadding={0} />
      </View>
      <View style={styles.hint}>
        <Icon name={Icons.locationFilled} size={16} color={Colors.primary} />
        <AppText size={13} weight="semiBold" color={Colors.primary} style={{ marginLeft: 6 }}>
          {hintLabel}
        </AppText>
      </View>
    </Pressable>
  </View>
  );
};

const styles = StyleSheet.create({
  addressPad: { paddingHorizontal: Spacing.screen },
  hint: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingVertical: 10,
  },
});

export default AddressMapPreview;
