// Kiểu dùng chung cho BookingMap (native: react-native-maps, web: placeholder)
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
  /** phần đáy bị bottom sheet che (px) để canh khung nhìn */
  bottomPadding?: number;
  style?: StyleProp<ViewStyle>;
}
