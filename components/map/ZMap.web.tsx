// ZMap (web) — bản đồ Goong vẽ bằng maplibre-gl. Marker là component React Native thường, gắn vào marker của
// maplibre qua portal (react-native-web vẽ ra DOM). Cùng props / hành vi với bản native (ZMap.tsx).
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { View, StyleSheet } from 'react-native';
import { Map as MapLibreMap, Marker, type FilterSpecification, type GeoJSONSource, type LineLayerSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { goongStyleUrl } from '@/services/maps';
import { addInsets, boundsOf, circleFeature, LINE_LAYERS, linesFeature, type ZMapHandle, type ZMapProps } from './types';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export const ZMap = forwardRef<ZMapHandle, ZMapProps>(
  ({ style, initialCenter, initialZoom = 14, markers = [], lines, circle, insets, fit, interactive = true, onRegionChangeComplete }, ref) => {
    const hostRef = useRef<View>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRefs = useRef(new Map<string, Marker>());
    const [ready, setReady] = useState(false);
    const [elements, setElements] = useState<Record<string, HTMLElement>>({});
    const onMoveEnd = useRef(onRegionChangeComplete);
    onMoveEnd.current = onRegionChangeComplete;
    const padding = addInsets(insets);
    const paddingKey = `${padding.top},${padding.right},${padding.bottom},${padding.left}`;

    useImperativeHandle(ref, () => ({
      flyTo: (c, zoom = 15) => mapRef.current?.easeTo({ center: [c.lng, c.lat], zoom, padding, duration: 500 }),
    }));

    // tạo bản đồ một lần
    useEffect(() => {
      const container = hostRef.current as unknown as HTMLElement | null;
      if (!container) return;
      const map = new MapLibreMap({
        container,
        style: goongStyleUrl!,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        interactive,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true },
      });
      map.touchZoomRotate.disableRotation();
      map.on('load', () => {
        map.addSource('zmap-circle', { type: 'geojson', data: EMPTY });
        map.addLayer({ id: 'zmap-circle-fill', type: 'fill', source: 'zmap-circle', paint: { 'fill-color': 'rgba(0,0,0,0)' } });
        map.addLayer({ id: 'zmap-circle-line', type: 'line', source: 'zmap-circle', paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': 1 } });
        map.addSource('zmap-lines', { type: 'geojson', data: EMPTY });
        (['casing', 'solid', 'dashed'] as const).forEach((k) =>
          map.addLayer({
            id: `zmap-lines-${k}`,
            type: 'line',
            source: 'zmap-lines',
            filter: LINE_LAYERS[k].filter as FilterSpecification,
            layout: LINE_LAYERS[k].layout as LineLayerSpecification['layout'],
            paint: LINE_LAYERS[k].paint as LineLayerSpecification['paint'],
          }),
        );
        setReady(true);
      });
      map.on('moveend', () => {
        const c = map.getCenter();
        onMoveEnd.current?.({ lat: c.lat, lng: c.lng });
      });
      mapRef.current = map;
      const markersNow = markerRefs.current;
      return () => {
        markersNow.forEach((m) => m.remove());
        markersNow.clear();
        map.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // phần bị che → tâm bản đồ = tâm phần nhìn thấy
    useEffect(() => {
      mapRef.current?.setPadding(padding);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paddingKey]);

    // đường nối / tuyến đường + vòng tròn
    const linesKey = (lines ?? []).map((l) => `${l.id}|${l.color}|${l.width}|${l.dashed}|${l.coords.map((c) => `${c.lat},${c.lng}`).join(';')}`).join('#');
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      (map.getSource('zmap-lines') as GeoJSONSource).setData(linesFeature(lines));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, linesKey]);
    const circleKey = circle ? `${circle.center.lat},${circle.center.lng},${circle.radiusMeters},${circle.fill},${circle.stroke}` : '';
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      (map.getSource('zmap-circle') as GeoJSONSource).setData(circle ? circleFeature(circle.center, circle.radiusMeters) : EMPTY);
      if (circle) {
        map.setPaintProperty('zmap-circle-fill', 'fill-color', circle.fill);
        map.setPaintProperty('zmap-circle-line', 'line-color', circle.stroke);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, circleKey]);

    // marker: mỗi id một phần tử DOM, nội dung vẽ bằng portal bên dưới
    const markerKey = markers.map((m) => `${m.id}@${m.at.lat},${m.at.lng}:${m.anchor ?? 'center'}`).join('|');
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      const live = markerRefs.current;
      const next: Record<string, HTMLElement> = {};
      markers.forEach((m) => {
        let mk = live.get(m.id);
        if (mk && mk.getElement().dataset.anchor !== (m.anchor ?? 'center')) {
          mk.remove();
          live.delete(m.id);
          mk = undefined;
        }
        if (!mk) {
          const el = document.createElement('div');
          el.dataset.anchor = m.anchor ?? 'center';
          if (m.title) el.title = m.title;
          mk = new Marker({ element: el, anchor: m.anchor ?? 'center' }).setLngLat([m.at.lng, m.at.lat]).addTo(map);
          live.set(m.id, mk);
        } else {
          mk.setLngLat([m.at.lng, m.at.lat]);
        }
        // thứ tự mảng = thứ tự chồng (sau nằm trên)
        mk.getElement().style.zIndex = String(markers.indexOf(m) + 1);
        next[m.id] = mk.getElement();
      });
      live.forEach((mk, id) => {
        if (!next[id]) {
          mk.remove();
          live.delete(id);
        }
      });
      setElements(next);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markerKey]);

    // canh khung theo các điểm
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !fit?.points.length) return;
      if (fit.points.length === 1) {
        const p = fit.points[0]!;
        map.easeTo({ center: [p.lng, p.lat], zoom: fit.singleZoom ?? 15, padding, duration: 400 });
      } else {
        // maplibre-gl cộng padding của fitBounds vào padding đang đặt (phần bị che) → chỉ truyền lề thêm
        map.fitBounds(boundsOf(fit.points), { padding: addInsets(fit.margin), duration: 600, maxZoom: 16 });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, fit?.key, paddingKey]);

    return (
      <View ref={hostRef} style={[styles.map, style]}>
        {markers.map((m) => (elements[m.id] ? createPortal(m.children, elements[m.id]!, m.id) : null))}
      </View>
    );
  },
);
ZMap.displayName = 'ZMap';

const styles = StyleSheet.create({ map: { flex: 1, overflow: 'hidden' } });

export default ZMap;
