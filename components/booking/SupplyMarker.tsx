// SupplyMarker — icon tài xế / thợ quanh điểm đón trong vòng quét (màn đang tìm): vòng trắng viền tím, icon theo loại xe,
// không có xe (thợ, nhân công, tài xế lái thay) thì icon theo nhóm dịch vụ. Không chạm được — chỉ để khách thấy có người.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { Icon, Icons, type IconName } from '@/components/ui';
import type { SupplyMarkerData } from '@/services/supply';

export const SUPPLY_MARKER_SIZE = 28;

const VEHICLE_ICON: Record<string, IconName> = {
  motorbike: Icons.scooter,
  car: Icons.carSide,
  truck: Icons.truck,
  van: Icons.van,
  bus: 'mci:bus' as IconName,
};
const CATEGORY_ICON: Record<string, IconName> = {
  handyman: Icons.tools,
  labor: Icons.hardHat,
  driver: Icons.steering,
};

export function supplyIcon(m: Pick<SupplyMarkerData, 'category' | 'vehicleType'>): IconName {
  return VEHICLE_ICON[m.vehicleType] ?? CATEGORY_ICON[m.category] ?? ('mci:account' as IconName);
}

export const SupplyMarkerView: React.FC<{ marker: Pick<SupplyMarkerData, 'category' | 'vehicleType'> }> = ({ marker }) => (
  <View style={styles.wrap} pointerEvents="none">
    <Icon name={supplyIcon(marker)} size={16} color={Colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: SUPPLY_MARKER_SIZE,
    height: SUPPLY_MARKER_SIZE,
    borderRadius: SUPPLY_MARKER_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
});

export default SupplyMarkerView;
