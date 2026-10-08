// services/places.ts — tìm địa chỉ qua API (server gọi Google Places; máy dev không có key thì dùng vài địa điểm mẫu
// ở TP.HCM — vd "ben thanh", "landmark", "san bay", "crescent"). Giá báo theo toạ độ, nên địa điểm luôn phải là
// toạ độ THẬT từ API (gợi ý đã chọn / ghim bản đồ / GPS), không tự chế toạ độ.
import { api, type ZuumResponse } from '@/services/zuum';

export type PlaceSuggestion = ZuumResponse<'GET /v1/customer/places/autocomplete'>['items'][number];
export type PlaceDetail = ZuumResponse<'GET /v1/customer/places/:placeId'>;

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
