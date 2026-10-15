// SupplyMarker — icon tài xế / thợ quanh điểm đón trong vòng quét (màn đang tìm). Không chạm được — chỉ để khách thấy có người.
// - Xe (máy / hơi / van / tải / khách): xe nhìn từ trên xuống, xoay theo hướng chạy (heading, 0 = bắc) để nằm dọc làn đường —
//   đang tiến lại điểm đón thì đầu xe hướng về điểm đón, đang đi xa thì hướng ra xa (server tính theo tuyến đường thật).
//   Bản đồ không cho xoay (luôn bắc lên trên) nên xoay theo heading là đủ.
// - Người (thợ, nhân công, tài xế lái thay): vòng trắng + icon minh hoạ của đúng gói khách đang đặt.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { ServiceIcon, type ServiceIconName } from '@/components/ui';
import type { SupplyMarkerData } from '@/services/supply';
import { VehicleTopIcon, VEHICLE_TOP_LENGTH, type VehicleTopKind } from './VehicleTopIcon';

export const SUPPLY_MARKER_SIZE = 36;

/** nhóm mà người làm không chạy xe tới (hoặc chạy xe của khách) → icon người, không xoay */
const PEOPLE_CATEGORIES = new Set(['handyman', 'labor', 'driver']);

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

/** loại xe nhìn từ trên xuống; null = hiện icon người */
export function vehicleKind(m: Pick<SupplyMarkerData, 'category' | 'vehicleType'>): VehicleTopKind | null {
  if (PEOPLE_CATEGORIES.has(m.category)) return null;
  switch (m.vehicleType) {
    case 'motorbike':
      return m.category === 'delivery' ? 'moto-box' : 'moto';
    case 'car':
      return 'car';
    case 'van':
      return 'van';
    case 'truck':
      return 'truck';
    case 'bus':
      return 'bus';
    default:
      return null;
  }
}

interface Props {
  marker: Pick<SupplyMarkerData, 'category' | 'vehicleType'>;
  /** hướng đang chạy (độ, 0 = bắc) — null thì để đầu xe hướng bắc */
  heading?: number | null;
  serviceArt?: ServiceIconName;
}

export const SupplyMarkerView: React.FC<Props> = ({ marker, heading, serviceArt }) => {
  const kind = vehicleKind(marker);
  if (kind) {
    const box = VEHICLE_TOP_LENGTH[kind];
    // khung vuông cạnh = chiều dài xe để xoay hướng nào cũng không bị cắt; tâm khung = toạ độ
    return (
      <View style={[styles.vehicleBox, { width: box, height: box }]} pointerEvents="none">
        <View style={{ transform: [{ rotate: `${Math.round(heading ?? 0)}deg` }] }}>
          <VehicleTopIcon kind={kind} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.wrap} pointerEvents="none">
      <ServiceIcon name={supplyArt(marker, serviceArt)} size={28} />
    </View>
  );
};

const styles = StyleSheet.create({
  vehicleBox: { alignItems: 'center', justifyContent: 'center' },
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
