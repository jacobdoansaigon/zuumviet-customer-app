// BookingMap — bản đồ đặt xe / theo dõi: marker điểm lấy / điểm giao / tài xế + đường nối tím.
// Bản đồ Goong qua ZMap (native: MapLibre, web: maplibre-gl); chưa có Maptiles key → bản đồ thay thế (vẽ giả).
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { HCM_CENTER } from '@/constants/booking';
import { ZMap } from '@/components/map/ZMap';
import type { ZMapMarker } from '@/components/map/types';
import { mapsAvailable } from '@/services/maps';
import { MapMarkerView } from './MapMarkerView';
import { BookingMapPlaceholder } from './BookingMapPlaceholder';
import type { BookingMapProps } from './mapTypes';

const FIT_MARGIN = { top: 140, right: 60, bottom: 80, left: 60 };

const GoongBookingMap: React.FC<BookingMapProps> = ({ stops, center, showsUserLocation = true, showRoute = true, bottomPadding = 0, style, onRegionChangeComplete }) => {
  const first = stops[0];
  const initial = center ?? (first ? { lat: first.lat, lng: first.lng } : HCM_CENTER);
  const stopsKey = stops.map((s) => `${s.id}:${s.type}:${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join('|');

  const { markers, route, points } = useMemo(() => {
    const pts = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    const mk: ZMapMarker[] = stops.map((s) => ({
      id: s.id,
      at: { lat: s.lat, lng: s.lng },
      anchor: s.type === 'dropoff' ? 'bottom' : 'center',
      title: s.label,
      children: <MapMarkerView type={s.type} />,
    }));
    return { markers: mk, points: pts, route: stops.filter((s) => s.type !== 'driver').map((s) => ({ lat: s.lat, lng: s.lng })) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey]);

  return (
    <ZMap
      style={[StyleSheet.absoluteFill, style]}
      initialCenter={initial}
      initialZoom={stops.length === 1 ? 15 : 14}
      markers={markers}
      line={showRoute && route.length >= 2 ? { coords: route, color: Colors.primary, width: 4 } : null}
      insets={{ bottom: bottomPadding }}
      // "Chọn trên bản đồ": khách tự kéo — không canh lại khung (giữ mức phóng khách đang xem)
      fit={!onRegionChangeComplete && points.length ? { key: stopsKey, points, margin: FIT_MARGIN } : null}
      showsUserLocation={showsUserLocation}
      onRegionChangeComplete={onRegionChangeComplete}
    />
  );
};

export const BookingMap: React.FC<BookingMapProps> = (props) =>
  mapsAvailable ? <GoongBookingMap {...props} /> : <BookingMapPlaceholder {...props} />;

export default BookingMap;
