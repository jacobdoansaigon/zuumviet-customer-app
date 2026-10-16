// LiveTrackingMap — bản đồ màn theo dõi đơn: BookingMap + xe tài xế bám đường (useLiveVehicle). Tách riêng để xe trượt 10 khung
// hình / giây chỉ vẽ lại bản đồ, không vẽ lại cả khung thông tin đơn bên dưới.
// - Xe: đúng loại xe của tài xế (xe máy / xe máy thùng giao hàng / xe hơi / van / tải / khách) nhìn từ trên xuống, xoay theo
//   hướng đoạn đường; thợ / nhân công / tài xế lái thay: vòng tròn icon dịch vụ (giống icon quét tìm — SupplyMarkerView).
// - Đường: đoạn từ xe tới điểm kế (tím đậm, bám đường) vẽ trên lộ trình đã báo giá (tím nhạt).
import React, { useEffect, useMemo } from 'react';
import { Palette } from '@/constants/theme';
import type { ZMapLine, ZMapMarker } from '@/components/map/types';
import { orderArt } from '@/components/activity/orderUtils';
import type { OrderDetail } from '@/services/orders';
import type { SupplyMarkerData } from '@/services/supply';
import { BookingMap } from './BookingMap';
import { SupplyMarkerView } from './SupplyMarker';
import { useLiveVehicle, type PartnerFix } from './useLiveVehicle';
import type { BookingMapProps } from './mapTypes';

/** lộ trình đã báo giá khi đang vẽ đoạn xe đang chạy phía trên */
const ROUTE_DIM = Palette.primary[200];

interface Props extends BookingMapProps {
  order: OrderDetail | null;
  /** GPS mới nhất của tài xế */
  fix: PartnerFix | null;
  /** đơn có tài xế đang chạy (đang tới / đã tới / đang thực hiện) */
  live: boolean;
  /** số phút (khoảng) tới điểm kế theo tuyến — null khi chưa tính được */
  onEta?: (minutes: number | null) => void;
}

export const LiveTrackingMap: React.FC<Props> = ({ order, fix, live, onEta, extraMarkers, fitOverride, ...map }) => {
  const v = useLiveVehicle(order, fix, live);

  useEffect(() => {
    onEta?.(v.etaMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.etaMinutes]);

  const category = order?.service.category;
  const vehicleType = order?.vehicle?.type ?? order?.service.vehicleType;
  const art = order ? orderArt(order) : undefined;
  const markers = useMemo<ZMapMarker[] | undefined>(() => {
    if (!v.position || !category || !vehicleType) return extraMarkers;
    const vehicle: ZMapMarker = {
      id: 'live-vehicle',
      at: { lat: v.position.lat, lng: v.position.lng },
      anchor: 'center',
      children: <SupplyMarkerView marker={{ category, vehicleType } as Pick<SupplyMarkerData, 'category' | 'vehicleType'>} heading={v.position.heading} serviceArt={art} />,
    };
    return [...(extraMarkers ?? []), vehicle];
  }, [v.position, category, vehicleType, art, extraMarkers]);

  const lines = useMemo<ZMapLine[] | undefined>(() => (v.ahead ? [{ id: 'live-ahead', coords: v.ahead, color: Palette.primary[600], width: 5 }] : undefined), [v.ahead]);

  return (
    <BookingMap
      {...map}
      extraMarkers={markers}
      extraLines={lines}
      routeColor={v.ahead ? ROUTE_DIM : map.routeColor}
      fitOverride={fitOverride ?? v.fit}
    />
  );
};

export default LiveTrackingMap;
