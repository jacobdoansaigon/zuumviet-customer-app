// BookingMap (native) — react-native-maps: marker điểm lấy / điểm giao / tài xế + polyline tím.
// Bản web dùng BookingMap.web.tsx (Metro ưu tiên .web.tsx) nên react-native-maps không bị import trên web.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@/constants/theme';
import { HCM_CENTER } from '@/constants/mockBooking';
import { MapMarkerView, MARKER_SIZE } from './MapMarkerView';
import type { BookingMapProps } from './mapTypes';

export const BookingMap: React.FC<BookingMapProps> = ({ stops, center, showsUserLocation = true, showRoute = true, bottomPadding = 0, style, onRegionChangeComplete }) => {
  const ref = useRef<MapView | null>(null);
  const [ready, setReady] = useState(false);
  const first = stops[0];
  const c = center ?? (first ? { lat: first.lat, lng: first.lng } : HCM_CENTER);
  const stopsKey = stops.map((s) => `${s.type}:${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join('|');

  const routeCoords = useMemo(
    () => stops.filter((s) => s.type !== 'driver').map((s) => ({ latitude: s.lat, longitude: s.lng })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopsKey],
  );

  useEffect(() => {
    const map = ref.current;
    if (!map || !ready) return;
    const coords = stops.map((s) => ({ latitude: s.lat, longitude: s.lng }));
    if (coords.length >= 2) {
      map.fitToCoordinates(coords, {
        edgePadding: { top: 140, right: 60, bottom: bottomPadding + 80, left: 60 },
        animated: true,
      });
    } else if (coords.length === 1) {
      map.animateToRegion({ ...coords[0]!, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, bottomPadding, ready]);

  return (
    <MapView
      ref={ref}
      onMapReady={() => setReady(true)}
      style={[StyleSheet.absoluteFill, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 0, right: 0, bottom: bottomPadding, left: 0 }}
      onRegionChangeComplete={onRegionChangeComplete ? (r) => onRegionChangeComplete({ lat: r.latitude, lng: r.longitude }) : undefined}
    >
      {showRoute && routeCoords.length >= 2 ? <Polyline coordinates={routeCoords} strokeColor={Colors.primary} strokeWidth={4} lineCap="round" /> : null}
      {stops.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          anchor={{ x: 0.5, y: s.type === 'dropoff' ? 1 : 0.5 }}
          centerOffset={{ x: 0, y: s.type === 'dropoff' ? -MARKER_SIZE / 2 : 0 }}
          tracksViewChanges={false}
          title={s.label}
        >
          <MapMarkerView type={s.type} />
        </Marker>
      ))}
    </MapView>
  );
};

export default BookingMap;
