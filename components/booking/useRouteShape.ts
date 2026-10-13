// useRouteShape — hình dạng tuyến đường THẬT cho bản đồ xem trước (điểm đón / điểm đến / chọn trên bản đồ) khi chưa có báo
// giá: GET /v1/customer/routes/shape (Goong qua server, cache 6 giờ). Tránh vẽ đường thẳng nối điểm (anh Jacob 2026-10-13).
// Chờ 350 ms sau lần đổi điểm cuối mới gọi; kết quả giữ trong bộ nhớ theo bộ điểm + loại xe nên quay lại màn không gọi lại.
import { useEffect, useState } from 'react';
import { decodePolyline } from '@/components/map/polyline';
import { routeShape, type RouteMode } from '@/services/places';

type LatLng = { lat: number; lng: number };
export interface RouteShapeResult {
  path: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

const cache = new Map<string, RouteShapeResult>();
const keyOf = (points: LatLng[], mode: RouteMode) => `${mode}|${points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';')}`;

export function useRouteShape(points: LatLng[] | null | undefined, mode: RouteMode = 'car'): RouteShapeResult | null {
  const key = points && points.length >= 2 ? keyOf(points, mode) : '';
  const [result, setResult] = useState<RouteShapeResult | null>(() => (key ? (cache.get(key) ?? null) : null));

  useEffect(() => {
    if (!key || !points) {
      setResult(null);
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setResult(hit);
      return;
    }
    setResult(null);
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const r = await routeShape(points, mode);
        const path = decodePolyline(r.polyline);
        const value: RouteShapeResult = { path: path && path.length >= 2 ? path : points, distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds };
        cache.set(key, value);
        if (alive) setResult(value);
      } catch {
        /* không có tuyến → bản đồ không vẽ đường (không vẽ đường thẳng sai) */
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return result;
}
