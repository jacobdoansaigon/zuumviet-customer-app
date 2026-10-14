// SupplyMarker — icon tài xế / thợ quanh điểm đón trong vòng quét (màn đang tìm): vòng trắng, icon minh hoạ của đúng gói khách
// đang đặt (danh sách tải theo serviceId — đặt thợ điện thì quanh điểm đón là thợ điện); không biết gói thì theo nhóm dịch vụ / loại xe.
// Không chạm được — chỉ để khách thấy có người.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { ServiceIcon, type ServiceIconName } from '@/components/ui';
import type { SupplyMarkerData } from '@/services/supply';

export const SUPPLY_MARKER_SIZE = 36;

/** nhóm mà loại xe không nói lên dịch vụ (giao hàng vẫn là xe máy, chuyển nhà vẫn là xe tải…) */
const CATEGORY_ART: Record<string, ServiceIconName> = {
  delivery: 'delivery',
  bike: 'bike',
  rental: 'rental',
  driver: 'driver',
  handyman: 'handyman',
  labor: 'labor',
};
const VEHICLE_ART: Record<string, ServiceIconName> = {
  motorbike: 'bike',
  car: 'car',
  truck: 'transport',
  van: 'pickup',
  bus: 'intercity',
};

export function supplyArt(m: Pick<SupplyMarkerData, 'category' | 'vehicleType'>, serviceArt?: ServiceIconName): ServiceIconName {
  return serviceArt ?? CATEGORY_ART[m.category] ?? VEHICLE_ART[m.vehicleType] ?? 'labor';
}

export const SupplyMarkerView: React.FC<{ marker: Pick<SupplyMarkerData, 'category' | 'vehicleType'>; serviceArt?: ServiceIconName }> = ({ marker, serviceArt }) => (
  <View style={styles.wrap} pointerEvents="none">
    <ServiceIcon name={supplyArt(marker, serviceArt)} size={28} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: SUPPLY_MARKER_SIZE,
    height: SUPPLY_MARKER_SIZE,
    borderRadius: SUPPLY_MARKER_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
});

export default SupplyMarkerView;
