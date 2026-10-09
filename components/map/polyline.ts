// Giải mã encoded polyline (thuật toán của Google, độ chính xác 5 chữ số) — hình dạng tuyến API trả về (`routePolyline`
// của báo giá / đơn hàng). Chuỗi hỏng hoặc trống → [] (màn hình nối thẳng các điểm như trước).
import type { LatLng } from './types';

export function decodePolyline(encoded: string | null | undefined): LatLng[] {
  if (!encoded) return [];
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = (): number | null => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      if (index >= encoded.length) return null;
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    const dLat = next();
    const dLng = next();
    if (dLat === null || dLng === null) return [];
    lat += dLat;
    lng += dLng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}
