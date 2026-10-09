// ZMap (native) — bản đồ Goong vẽ bằng MapLibre React Native. Chỉ dùng khi có Maptiles key (mapsAvailable);
// chưa có key thì màn hình dùng bản đồ thay thế (vẽ giả) — xem BookingMap / DriverMap / TripMap.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  UserLocation,
  ViewAnnotation,
  type CameraRef,
  type FilterSpecification,
  type LineLayerSpecification,
} from '@maplibre/maplibre-react-native';
import { goongStyleUrl } from '@/services/maps';
import { addInsets, boundsOf, circleFeature, LINE_LAYERS, linesFeature, type ZMapHandle, type ZMapProps } from './types';

export const ZMap = forwardRef<ZMapHandle, ZMapProps>(
  (
    { style, initialCenter, initialZoom = 14, markers = [], lines, circle, insets, fit, showsUserLocation = false, interactive = true, onRegionChangeComplete, onPress },
    ref,
  ) => {
    const camera = useRef<CameraRef>(null);
    const [ready, setReady] = useState(false);
    const padding = addInsets(insets);
    const paddingKey = `${padding.top},${padding.right},${padding.bottom},${padding.left}`;

    useImperativeHandle(ref, () => ({
      flyTo: (c, zoom) => camera.current?.easeTo({ center: [c.lng, c.lat], ...(zoom !== undefined ? { zoom } : {}), padding, duration: 500 }),
    }));

    // phần bị che đổi (vd khung thông tin cao lên) → tâm bản đồ vẫn là tâm phần nhìn thấy
    useEffect(() => {
      if (ready && !fit) void camera.current?.setStop({ padding, duration: 0 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, paddingKey]);

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
        onRegionDidChange={
          onRegionChangeComplete
            ? (e) => {
                if (e.nativeEvent.userInteraction) onRegionChangeComplete({ lng: e.nativeEvent.center[0], lat: e.nativeEvent.center[1] });
              }
            : undefined
        }
        onPress={onPress ? (e) => onPress({ lng: e.nativeEvent.lngLat[0], lat: e.nativeEvent.lngLat[1] }) : undefined}
      >
        <Camera ref={camera} initialViewState={{ center: [initialCenter.lng, initialCenter.lat], zoom: initialZoom, padding }} />
        {showsUserLocation ? <UserLocation /> : null}
        {circle ? (
          <GeoJSONSource id="zmap-circle" data={circleFeature(circle.center, circle.radiusMeters)}>
            <Layer id="zmap-circle-fill" type="fill" paint={{ 'fill-color': circle.fill }} />
            <Layer id="zmap-circle-line" type="line" paint={{ 'line-color': circle.stroke, 'line-width': 1 }} />
          </GeoJSONSource>
        ) : null}
        <GeoJSONSource id="zmap-lines" data={linesFeature(lines)}>
          {(['casing', 'solid', 'dashed'] as const).map((k) => (
            <Layer
              key={k}
              id={`zmap-lines-${k}`}
              type="line"
              filter={LINE_LAYERS[k].filter as FilterSpecification}
              layout={LINE_LAYERS[k].layout as LineLayerSpecification['layout']}
              paint={LINE_LAYERS[k].paint as LineLayerSpecification['paint']}
            />
          ))}
        </GeoJSONSource>
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
