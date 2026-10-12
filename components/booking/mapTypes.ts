// Kiểu dùng chung cho BookingMap (bản đồ Goong qua ZMap, hoặc bản đồ thay thế khi chưa có Maptiles key)
import type { StyleProp, ViewStyle } from 'react-native';
import type { ZMapMarker } from '@/components/map/types';

export type MapStopType = 'pickup' | 'dropoff' | 'driver';

export interface MapStop {
  id: string;
  lat: number;
  lng: number;
  type: MapStopType;
  label?: string;
}

/** Phần bản đồ tối thiểu còn nhìn thấy phía trên khung thông tin (dp) — lề canh tuyến lớn hơn thì bớt đi */
export const MAP_MIN_VISIBLE = 280;
/** lề dưới cho bản đồ = chiều cao khung, nhưng chừa lại MAP_MIN_VISIBLE phía trên (khung quá cao → tuyến chỉ còn nằm dưới khung một phần) */
export function mapBottomPadding(sheetHeight: number, screenHeight: number): number {
  if (!sheetHeight || !screenHeight) return sheetHeight;
  return Math.min(sheetHeight, Math.max(0, screenHeight - MAP_MIN_VISIBLE));
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
  /** chạm một điểm trên bản đồ (kể cả tên địa điểm có sẵn trên nền bản đồ) */
  onPress?: (point: { lat: number; lng: number }) => void;
  /** marker thêm (vị trí đã lưu, địa điểm quen thuộc…) — vẽ dưới các điểm của lộ trình */
  extraMarkers?: ZMapMarker[];
}
