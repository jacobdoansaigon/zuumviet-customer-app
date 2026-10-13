// services/places.ts — tìm địa chỉ qua API (server gọi Google Places; máy dev không có key thì dùng vài địa điểm mẫu
// ở TP.HCM — vd "ben thanh", "landmark", "san bay", "crescent"). Giá báo theo toạ độ, nên địa điểm luôn phải là
// toạ độ THẬT từ API (gợi ý đã chọn / ghim bản đồ / GPS), không tự chế toạ độ.
import { api, type ZuumResponse } from '@/services/zuum';

export type PlaceSuggestion = ZuumResponse<'GET /v1/customer/places/autocomplete'>['items'][number];
export type PlaceDetail = ZuumResponse<'GET /v1/customer/places/:placeId'>;
export type PlaceEntrances = ZuumResponse<'GET /v1/customer/places/entrances'>;
export type PlaceEntrance = PlaceEntrances['items'][number];
export type PlaceHistory = ZuumResponse<'GET /v1/customer/places/history'>;
export type HistoryPlace = PlaceHistory['fromHere'][number];

/** Phiên gõ tìm (dùng chung cho các lần gõ + lần chọn — Google tính 1 phiên) */
export function newPlacesSession(): string {
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

export async function autocompletePlaces(q: string, near: { lat: number; lng: number } | null, sessionToken: string): Promise<PlaceSuggestion[]> {
  const res = await api('GET /v1/customer/places/autocomplete', {
    query: { q, sessionToken, ...(near ? { lat: near.lat, lng: near.lng } : {}) },
  });
  return res.items;
}

export function placeDetail(placeId: string, sessionToken?: string): Promise<PlaceDetail> {
  return api('GET /v1/customer/places/:placeId', { params: { placeId }, query: sessionToken ? { sessionToken } : undefined });
}

/** Ghim bản đồ / GPS → địa chỉ chữ (toạ độ giữ nguyên) */
export function reversePlace(lat: number, lng: number): Promise<PlaceDetail> {
  return api('GET /v1/customer/places/reverse', { query: { lat, lng } });
}

/** Cổng / lối vào của địa điểm tại điểm đón theo dữ liệu bản đồ (siêu thị, bệnh viện, trường…); rỗng = không có cổng.
 * `name` = tên địa điểm khi khách chọn từ tìm kiếm (khớp chính xác hơn). */
export function placeEntrances(lat: number, lng: number, name?: string): Promise<PlaceEntrances> {
  return api('GET /v1/customer/places/entrances', { query: { lat, lng, ...(name ? { name } : {}) } });
}

/** Địa chỉ đã đi (từ đơn cũ): `fromHere` = đã đi từ điểm đi `near` (nhiều lần → ít), `frequent` = nơi thường đến, `pickups` = điểm đi hay dùng */
export function placeHistory(near: { lat: number; lng: number } | null): Promise<PlaceHistory> {
  return api('GET /v1/customer/places/history', { query: near ? { lat: near.lat, lng: near.lng } : undefined });
}

// ---- hình dạng tuyến đường thật (vẽ ở màn xem trước, chưa báo giá) ----
export type RouteMode = 'motorbike' | 'car' | 'truck';
export type RouteShape = ZuumResponse<'GET /v1/customer/routes/shape'>;
/** xe máy → bike; xe tải / xe khách → truck; còn lại car (giống server routeModeOf) */
export function routeModeOf(vehicleType: string | null | undefined): RouteMode {
  if (vehicleType === 'motorbike') return 'motorbike';
  if (vehicleType === 'truck' || vehicleType === 'bus') return 'truck';
  return 'car';
}
export function routeShape(points: { lat: number; lng: number }[], mode: RouteMode = 'car'): Promise<RouteShape> {
  return api('GET /v1/customer/routes/shape', { query: { points: points.map((p) => `${p.lat},${p.lng}`).join(';'), mode } });
}
