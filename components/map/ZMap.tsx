// ZMap (native) — bản đồ Goong vẽ bằng MapLibre React Native. Chỉ dùng khi có Maptiles key (mapsAvailable);
// chưa có key thì màn hình dùng bản đồ thay thế (vẽ giả) — xem BookingMap / DriverMap / TripMap.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map, UserLocation, ViewAnnotation, type CameraRef } from '@maplibre/maplibre-react-native';
import { goongStyleUrl } from '@/services/maps';
import { addInsets, boundsOf, circleFeature, lineFeature, type ZMapHandle, type ZMapProps } from './types';

export const ZMap = forwardRef<ZMapHandle, ZMapProps>(
  (
    { style, initialCenter, initialZoom = 14, markers = [], line, circle, insets, fit, showsUserLocation = false, interactive = true, onRegionChangeComplete },
    ref,
  ) => {
    const camera = useRef<CameraRef>(null);
    const [ready, setReady] = useState(false);
    const padding = addInsets(insets);
    const paddingKey = `${padding.top},${padding.right},${padding.bottom},${padding.left}`;

    useImperativeHandle(ref, () => ({
      flyTo: (c, zoom = 15) => camera.current?.easeTo({ center: [c.lng, c.lat], zoom, padding, duration: 500 }),
    }));

    useEffect(() => {
      const cam = camera.current;
      if (!ready || !cam || !fit?.points.length) return;
      if (fit.points.length === 1) {
        const p = fit.points[0]!;
        cam.easeTo({ center: [p.lng, p.lat], zoom: fit.singleZoom ?? 15, padding, duration: 400 });
      } else {
        // MapLibre native: padding của fitBounds thay hẳn padding camera → gồm cả phần bị che + lề thêm
        cam.fitBounds(boundsOf(fit.points), { padding: addInsets(padding, fit.margin), duration: 600 });
      }
      // canh lại khi bộ điểm (key) hoặc phần bị che đổi
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, fit?.key, paddingKey]);

    return (
      <Map
        style={[styles.map, style]}
        mapStyle={goongStyleUrl!}
        logo={false}
        compass={false}
        touchRotate={false}
        touchPitch={false}
        dragPan={interactive}
        touchZoom={interactive}
        doubleTapZoom={interactive}
        doubleTapHoldZoom={interactive}
        attributionPosition={{ bottom: padding.bottom + 4, left: 8 }}
        onDidFinishLoadingMap={() => setReady(true)}
        onRegionDidChange={onRegionChangeComplete ? (e) => onRegionChangeComplete({ lng: e.nativeEvent.center[0], lat: e.nativeEvent.center[1] }) : undefined}
      >
        <Camera ref={camera} initialViewState={{ center: [initialCenter.lng, initialCenter.lat], zoom: initialZoom, padding }} />
        {showsUserLocation ? <UserLocation /> : null}
        {circle ? (
          <GeoJSONSource id="zmap-circle" data={circleFeature(circle.center, circle.radiusMeters)}>
            <Layer id="zmap-circle-fill" type="fill" paint={{ 'fill-color': circle.fill }} />
            <Layer id="zmap-circle-line" type="line" paint={{ 'line-color': circle.stroke, 'line-width': 1 }} />
          </GeoJSONSource>
        ) : null}
        {line && line.coords.length >= 2 ? (
          <GeoJSONSource id="zmap-line" data={lineFeature(line.coords)}>
            <Layer
              id="zmap-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': line.color, 'line-width': line.width ?? 4, ...(line.dashed ? { 'line-dasharray': [2, 1.5] } : {}) }}
            />
          </GeoJSONSource>
        ) : null}
        {markers.map((m) => (
          <ViewAnnotation key={m.id} id={m.id} lngLat={[m.at.lng, m.at.lat]} anchor={m.anchor ?? 'center'} title={m.title}>
            {m.children}
          </ViewAnnotation>
        ))}
      </Map>
    );
  },
);
ZMap.displayName = 'ZMap';

const styles = StyleSheet.create({ map: { flex: 1 } });

export default ZMap;
