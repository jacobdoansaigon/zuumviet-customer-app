// ZMap — bản đồ Goong dùng chung (native: MapLibre React Native, web: maplibre-gl). Giống hệt ở app khách và app đối tác.
import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Insets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ZMapMarker {
  id: string;
  at: LatLng;
  /** điểm neo của hình marker vào toạ độ: tâm (vòng tròn) hoặc đáy (pin) */
  anchor?: 'center' | 'bottom';
  title?: string;
  children: ReactElement;
}

export interface ZMapLine {
  id: string;
  coords: LatLng[];
  color: string;
  width?: number;
  /** nét đứt (vd đoạn từ vị trí tài xế tới điểm kế) — nét liền có viền trắng để nổi trên nền bản đồ */
  dashed?: boolean;
}

export interface ZMapProps {
  style?: StyleProp<ViewStyle>;
  initialCenter: LatLng;
  initialZoom?: number;
  /** marker vẽ theo thứ tự mảng — phần tử sau nằm trên */
  markers?: ZMapMarker[];
  /** đường nối / tuyến đường (vẽ dưới marker) */
  lines?: ZMapLine[];
  circle?: { center: LatLng; radiusMeters: number; fill: string; stroke: string } | null;
  /** phần khung bị che (bottom sheet…) — tâm bản đồ / canh khung tính theo phần còn nhìn thấy */
  insets?: Insets;
  /** mỗi lần `key` đổi: canh vừa các điểm (thêm lề `margin`); 1 điểm → phóng quanh điểm đó */
  fit?: { key: string; points: LatLng[]; margin?: Insets; singleZoom?: number } | null;
  showsUserLocation?: boolean;
  /** false = chỉ xem (không kéo / phóng) */
  interactive?: boolean;
  /** kéo / phóng xong → toạ độ tâm phần nhìn thấy */
  onRegionChangeComplete?: (center: LatLng) => void;
}

export interface ZMapHandle {
  flyTo: (center: LatLng, zoom?: number) => void;
}

/** lề trên/dưới… cộng dồn */
export const addInsets = (a: Insets = {}, b: Insets = {}): Required<Insets> => ({
  top: (a.top ?? 0) + (b.top ?? 0),
  right: (a.right ?? 0) + (b.right ?? 0),
  bottom: (a.bottom ?? 0) + (b.bottom ?? 0),
  left: (a.left ?? 0) + (b.left ?? 0),
});

/** [tây, nam, đông, bắc] */
export const boundsOf = (points: LatLng[]): [number, number, number, number] => [
  Math.min(...points.map((p) => p.lng)),
  Math.min(...points.map((p) => p.lat)),
  Math.max(...points.map((p) => p.lng)),
  Math.max(...points.map((p) => p.lat)),
];

/** các đường → một FeatureCollection; màu / độ dày / nét đứt nằm trong properties (lớp vẽ đọc bằng biểu thức) */
export const linesFeature = (lines: ZMapLine[] = []): GeoJSON.FeatureCollection<GeoJSON.LineString> => ({
  type: 'FeatureCollection',
  features: lines
    .filter((l) => l.coords.length >= 2)
    .map((l) => ({
      type: 'Feature',
      properties: { id: l.id, color: l.color, width: l.width ?? 4, dashed: !!l.dashed },
      geometry: { type: 'LineString', coordinates: l.coords.map((c) => [c.lng, c.lat]) },
    })),
});

interface LineLayerStyle {
  filter: unknown[];
  layout: Record<string, unknown>;
  paint: Record<string, unknown>;
}

/** lớp vẽ đường dùng chung native / web: viền trắng + nét liền, nét đứt riêng (line-dasharray không đọc theo từng đường được) */
export const LINE_LAYERS: Record<'casing' | 'solid' | 'dashed', LineLayerStyle> = {
  casing: {
    filter: ['!', ['get', 'dashed']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#FFFFFF', 'line-width': ['+', ['get', 'width'], 3] },
  },
  solid: {
    filter: ['!', ['get', 'dashed']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': ['get', 'width'] },
  },
  dashed: {
    filter: ['==', ['get', 'dashed'], true],
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': ['get', 'width'], 'line-dasharray': [2, 1.5] },
  },
};

/** vòng tròn bán kính theo mét → đa giác 64 cạnh (đủ mịn ở mức phóng thành phố) */
export function circleFeature(center: LatLng, radiusMeters: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const dLat = radiusMeters / 111_320;
  const dLng = radiusMeters / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  const ring = Array.from({ length: 65 }, (_, i) => {
    const t = ((i % 64) / 64) * 2 * Math.PI;
    return [center.lng + dLng * Math.cos(t), center.lat + dLat * Math.sin(t)];
  });
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}
