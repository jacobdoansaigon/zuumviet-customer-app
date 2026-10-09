// Kiểu dùng chung cho BookingMap (bản đồ Goong qua ZMap, hoặc bản đồ thay thế khi chưa có Maptiles key)
import type { StyleProp, ViewStyle } from 'react-native';

export type MapStopType = 'pickup' | 'dropoff' | 'driver';

export interface MapStop {
  id: string;
  lat: number;
  lng: number;
  type: MapStopType;
  label?: string;
}

export interface BookingMapProps {
  stops: MapStop[];
  center?: { lat: number; lng: number };
  showsUserLocation?: boolean;
  /** vẽ đường nối điểm lấy → các điểm giao */
  showRoute?: boolean;
  /** tuyến theo đường (giải mã từ routePolyline của báo giá / đơn); không có → nối thẳng các điểm */
  routePath?: { lat: number; lng: number }[] | null;
  /** phần đáy bị bottom sheet che (px) để canh khung nhìn */
  bottomPadding?: number;
  style?: StyleProp<ViewStyle>;
  /** "Chọn trên bản đồ": kéo bản đồ → báo toạ độ tâm khung hình mới, dùng làm ghim đang chọn (bản đồ không tự canh lại khung) */
  onRegionChangeComplete?: (center: { lat: number; lng: number }) => void;
}
