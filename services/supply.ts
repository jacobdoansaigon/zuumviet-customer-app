// services/supply.ts — "tài xế quanh bạn" khi đang chờ tìm: icon tài xế / thợ trong vòng quét quanh điểm đón
// (GET /v1/customer/supply/nearby — server trộn tài xế thật online, ẩn danh, với lớp mô phỏng khi còn ít tài xế thật).
import { api, type ZuumResponse } from '@/services/zuum';

export type SupplyNearby = ZuumResponse<'GET /v1/customer/supply/nearby'>;
export type SupplyMarkerData = SupplyNearby['items'][number];

export function nearbySupply(q: { lat: number; lng: number; radiusMeters: number; serviceId?: string }): Promise<SupplyNearby> {
  return api('GET /v1/customer/supply/nearby', { query: q });
}
