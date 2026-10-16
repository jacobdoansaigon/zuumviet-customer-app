// services/orders.ts — đơn hàng của khách trên API mới: danh sách (scope active|history, phân trang), chi tiết,
// huỷ (1 lý do + ghi chú + ảnh bằng chứng nếu lý do yêu cầu), tìm lại tài xế, đánh giá.
// Trạng thái là CHUỖI: scheduled | searching | assigned | arrived_pickup | picked_up | completed | no_driver_found | cancelled.
import { findService } from '@/services/catalog';
import { api, type ZuumResponse, type ZuumRoutes } from '@/services/zuum';
import { SERVICE_GROUPS, type ServiceKey } from '@/constants/booking';

export type OrderDetail = ZuumResponse<'GET /v1/customer/orders/:id'>;
export type OrderListItem = ZuumResponse<'GET /v1/customer/orders'>['items'][number];
export type OrderStatus = OrderDetail['status'];
export type OrderStop = OrderDetail['stops'][number];
export type StopStatus = OrderStop['status'];
export type OrderPartner = NonNullable<OrderDetail['partner']>;
export type OrderVehicle = NonNullable<OrderDetail['vehicle']>;
export type CancelReason = ZuumResponse<'GET /v1/public/cancel-reasons'>[number];
export type OrderScope = 'active' | 'history';

/** Đơn còn chạy (kể cả hẹn giờ) */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ['scheduled', 'searching', 'queued', 'assigned', 'arrived_pickup', 'picked_up'];
export const isActiveStatus = (s: OrderStatus) => ACTIVE_STATUSES.includes(s);

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  scheduled: 'Đã hẹn giờ',
  searching: 'Đang tìm tài xế',
  assigned: 'Tài xế đang đến',
  arrived_pickup: 'Tài xế đã đến điểm đón',
  picked_up: 'Đang thực hiện',
  completed: 'Hoàn tất',
  no_driver_found: 'Không tìm thấy tài xế',
  queued: 'Đang chờ thợ nhận',
  cancelled: 'Đã huỷ',
};

export const STOP_STATUS_LABEL: Record<StopStatus, string> = {
  pending: 'Chưa tới',
  arrived: 'Đã tới',
  delivered: 'Đã giao',
  failed: 'Giao không được',
  returned: 'Đã hoàn về',
};

/** Giai đoạn hiển thị của màn theo dõi */
export type TrackingPhase = 'scheduled' | 'searching' | 'notfound' | 'queued' | 'accepted' | 'delivering' | 'completed' | 'cancelled';

export function phaseOf(status: OrderStatus): TrackingPhase {
  switch (status) {
    case 'scheduled':
      return 'scheduled';
    case 'searching':
      return 'searching';
    case 'no_driver_found':
      return 'notfound';
    case 'queued':
      return 'queued';
    case 'assigned':
    case 'arrived_pickup':
      return 'accepted';
    case 'picked_up':
      return 'delivering';
    case 'completed':
      return 'completed';
    default:
      return 'cancelled';
  }
}

/** Nhóm dịch vụ (icon/nhãn) của đơn: theo catalog (id dịch vụ) → category trả kèm → suy theo kind */
export function groupOfOrder(service: { id: string; kind: OrderDetail['service']['kind']; category?: OrderDetail['service']['category'] }): ServiceKey {
  const fromCatalog = findService(service.id)?.category;
  if (fromCatalog) return fromCatalog;
  if (service.category) return service.category;
  switch (service.kind) {
    case 'ride':
      return 'car';
    case 'driver_hire':
      return 'driver';
    case 'moving':
      return 'rental';
    case 'charter':
      return 'intercity';
    case 'on_site':
      return 'handyman';
    default:
      return 'delivery';
  }
}

export function getOrder(id: string): Promise<OrderDetail> {
  return api('GET /v1/customer/orders/:id', { params: { id } });
}

export function listOrders(scope: OrderScope | undefined, page = 1, pageSize = 20) {
  return api('GET /v1/customer/orders', { query: { page, pageSize, ...(scope ? { scope } : {}) } });
}

export function cancelReasons(serviceId: string): Promise<CancelReason[]> {
  return api('GET /v1/public/cancel-reasons', { query: { actor: 'customer', serviceId } });
}

export function cancelOrder(id: string, body: ZuumRoutes['POST /v1/customer/orders/:id/cancel']['body']): Promise<OrderDetail> {
  return api('POST /v1/customer/orders/:id/cancel', { params: { id }, body });
}

/** Không tìm thấy tài xế → tìm lại (giữ giá đã báo trong 30 phút) */
export function retryOrder(id: string): Promise<OrderDetail> {
  return api('POST /v1/customer/orders/:id/retry', { params: { id } });
}

/** Gọi thợ: không có thợ rảnh → xếp hàng chờ thợ tự nhận (tối đa 6 giờ) */
export function queueOrder(id: string): Promise<OrderDetail> {
  return api('POST /v1/customer/orders/:id/queue', { params: { id } });
}

/**
 * Đang mở màn theo dõi đơn — gọi lại mỗi ~20 s khi màn còn hiện: tài xế gửi GPS 30 s / lần (bình thường 5 phút); trả vị
 * trí mới nhất của tài xế.
 */
export function watchOrder(id: string) {
  return api('POST /v1/customer/orders/:id/watch', { params: { id } });
}

export function rateOrder(id: string, body: ZuumRoutes['POST /v1/customer/orders/:id/rating']['body']) {
  return api('POST /v1/customer/orders/:id/rating', { params: { id }, body });
}

// ---------------------------------------------------------------- ước lượng thời gian tài xế tới
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Tốc độ trung bình nội thành dùng để ƯỚC LƯỢNG (API chưa có ETA) */
const AVG_SPEED_KMH = 25;

/** Điểm tài xế đang hướng tới: đang đến đón → điểm đón; đang thực hiện → điểm đến chưa xong đầu tiên */
export function nextTarget(order: OrderDetail): { lat: number; lng: number } | null {
  if (order.status === 'assigned') return order.pickup;
  if (order.status === 'picked_up') return order.stops.find((s) => s.status === 'pending' || s.status === 'arrived') ?? null;
  return null;
}

/**
 * Số phút (khoảng) tài xế tới điểm kế tiếp, theo đường chim bay từ vị trí tài xế ở ~25 km/h. null khi không có vị trí
 * tài xế hoặc không có điểm đang hướng tới. Luôn hiện kèm chữ "khoảng".
 */
export function estimateEtaMinutes(order: OrderDetail, partner: { lat: number; lng: number } | null): number | null {
  const target = nextTarget(order);
  if (!partner || !target) return null;
  const km = haversineKm(partner, target) * 1.3;
  return Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));
}

/** Nhãn nhóm dịch vụ của đơn (Giao hàng / Xe máy / …) */
export function orderGroupTitle(order: { service: OrderDetail['service'] | OrderListItem['service'] }): string {
  return SERVICE_GROUPS[groupOfOrder(order.service)].title;
}

// ---- vòng quét tìm tài xế ---------------------------------------------------------------------------------
// Server trả `order.search` khi đang tìm: các vòng (bán kính + số giây) và `elapsedSeconds` lúc trả lời.
// App tính vòng đang quét theo đồng hồ của chính nó từ mốc đó (không so với giờ server), 1 giây một lần.

export type OrderSearch = NonNullable<OrderDetail['search']>;

export interface SearchPhase {
  /** vòng thứ mấy (0-based); = số vòng khi đã qua hết → quét ở bán kính tối đa tới hết giờ */
  index: number;
  radiusMeters: number;
  startsAtSeconds: number;
  endsAtSeconds: number | null;
}

/** Vòng đang quét tại giây thứ `elapsedSeconds` kể từ lúc bắt đầu tìm (cùng công thức với server: searchPhaseAt) */
export function searchPhaseAt(search: Pick<OrderSearch, 'steps' | 'maxRadiusMeters'>, elapsedSeconds: number): SearchPhase {
  const t = Math.max(0, elapsedSeconds);
  let start = 0;
  for (let i = 0; i < search.steps.length; i++) {
    const s = search.steps[i]!;
    if (t < start + s.seconds) return { index: i, radiusMeters: s.radiusMeters, startsAtSeconds: start, endsAtSeconds: start + s.seconds };
    start += s.seconds;
  }
  return { index: search.steps.length, radiusMeters: search.maxRadiusMeters, startsAtSeconds: start, endsAtSeconds: null };
}

/** "500 m" / "1 km" / "1,5 km" */
export function radiusLabel(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1).replace('.', ',')} km`;
}

/** 4 điểm mép vòng tròn (bắc / nam / đông / tây) để canh khung bản đồ vừa vòng quét */
export function circleEdgePoints(center: { lat: number; lng: number }, radiusMeters: number): { lat: number; lng: number }[] {
  const dLat = radiusMeters / 111_320;
  const dLng = radiusMeters / (111_320 * Math.cos((center.lat * Math.PI) / 180));
  return [
    { lat: center.lat + dLat, lng: center.lng },
    { lat: center.lat - dLat, lng: center.lng },
    { lat: center.lat, lng: center.lng + dLng },
    { lat: center.lat, lng: center.lng - dLng },
  ];
}
