// services/intercity.ts — Xe đường dài: tỉnh/thành + bến xe (GET /v1/public/intercity/cities), chuyến bán vé
// (nhà xe: kind=bus, xe ghép: kind=carpool), giữ ghế 10 phút, xác nhận vé, vé của tôi, huỷ vé (trước giờ chạy ≥ 24h).
import { createStore } from '@/services/store';
import { api, type ZuumResponse, type ZuumRoutes } from '@/services/zuum';

export type IntercityCity = ZuumResponse<'GET /v1/public/intercity/cities'>[number];
export type IntercityTrip = ZuumResponse<'GET /v1/public/intercity/trips'>[number];
export type IntercityTripDetail = ZuumResponse<'GET /v1/public/intercity/trips/:id'>;
export type IntercitySeat = IntercityTripDetail['seats'][number];
export type IntercityBooking = ZuumResponse<'GET /v1/customer/intercity/bookings/:id'>;
export type TripKind = IntercityTrip['kind'];
export type ConfirmBookingBody = ZuumRoutes['POST /v1/customer/intercity/bookings/:id/confirm']['body'];

/** Điểm xuất phát duy nhất đang bán vé */
export const ORIGIN_CITY_ID = 'ho-chi-minh';

// ---------------------------------------------------------------- tỉnh/thành
const citiesStore = createStore<IntercityCity[] | null>(null);
let citiesInflight: Promise<IntercityCity[]> | null = null;

export function useIntercityCities(): IntercityCity[] | null {
  return citiesStore.use();
}

export function getIntercityCities(): IntercityCity[] | null {
  return citiesStore.get();
}

/** Danh sách tỉnh/thành đang hoạt động (tải 1 lần mỗi phiên chạy app) */
export function ensureIntercityCities(force = false): Promise<IntercityCity[]> {
  const cur = citiesStore.get();
  if (cur && !force) return Promise.resolve(cur);
  if (!citiesInflight) {
    citiesInflight = api('GET /v1/public/intercity/cities')
      .then((list) => {
        const active = list.filter((c) => c.status === 'active').sort((a, b) => a.sortOrder - b.sortOrder);
        citiesStore.set(active);
        return active;
      })
      .finally(() => {
        citiesInflight = null;
      });
  }
  return citiesInflight;
}

/** Điểm đến (không gồm điểm xuất phát) */
export function destinationCities(list: IntercityCity[] | null = citiesStore.get()): IntercityCity[] {
  return (list ?? []).filter((c) => c.id !== ORIGIN_CITY_ID);
}

export function findCity(id: string | null | undefined, list: IntercityCity[] | null = citiesStore.get()): IntercityCity | null {
  if (!id) return null;
  return (list ?? []).find((c) => c.id === id) ?? null;
}

/** Khớp tỉnh/thành theo chữ (tên/địa chỉ điểm đến khách chọn hoặc gõ) bằng từ khoá của API */
export function matchIntercityCity(query: string, list: IntercityCity[] | null = citiesStore.get()): IntercityCity | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return destinationCities(list).find((c) => c.keywords.some((k) => q.includes(k.toLowerCase())) || q.includes(c.name.toLowerCase())) ?? null;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Bến xe gần điểm đến nhất (khi điểm đến không thuộc tỉnh nào đang bán vé) */
export function nearestCity(point: { lat: number; lng: number }, list: IntercityCity[] | null = citiesStore.get()): { city: IntercityCity; km: number } | null {
  let best: { city: IntercityCity; km: number } | null = null;
  for (const c of destinationCities(list)) {
    const km = haversineKm(point, { lat: c.stationLat, lng: c.stationLng });
    if (!best || km < best.km) best = { city: c, km: Math.round(km) };
  }
  return best;
}

// ---------------------------------------------------------------- ngày / giờ theo giờ Việt Nam
const VN_OFFSET_MS = 7 * 3600 * 1000;
const DOW_SHORT = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
const two = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" theo giờ VN của thời điểm `ms` */
export function vnDateKey(ms: number = Date.now()): string {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export interface DateOption {
  /** YYYY-MM-DD (giờ VN) — tham số `date` của API */
  key: string;
  /** "Hôm nay" | "Ngày mai" | "Th 5" */
  label: string;
  /** "24/09" */
  sub: string;
}

export function buildDateOptions(count = 7): DateOption[] {
  const out: DateOption[] = [];
  for (let i = 0; i < count; i++) {
    const ms = Date.now() + i * 86_400_000;
    const vn = new Date(ms + VN_OFFSET_MS);
    out.push({
      key: vnDateKey(ms),
      label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : DOW_SHORT[vn.getUTCDay()]!,
      sub: `${two(vn.getUTCDate())}/${two(vn.getUTCMonth() + 1)}`,
    });
  }
  return out;
}

/** "06:30" theo giờ VN */
export function vnTime(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
}

/** "Th 5, 24/09" theo giờ VN */
export function vnDateLabel(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${DOW_SHORT[d.getUTCDay()]}, ${two(d.getUTCDate())}/${two(d.getUTCMonth() + 1)}`;
}

/** Giờ (0-23) theo giờ VN — lọc khung giờ */
export function vnHour(iso: string): number {
  return new Date(Date.parse(iso) + VN_OFFSET_MS).getUTCHours();
}

/** "~7 giờ 30 phút" từ giờ đi / giờ đến */
export function durationLabel(departAt: string, arriveAt: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(arriveAt) - Date.parse(departAt)) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `~${m} phút`;
  return m ? `~${h} giờ ${m} phút` : `~${h} giờ`;
}

export interface TimeSlot {
  id: 'all' | 'early' | 'morning' | 'afternoon' | 'evening';
  label: string;
  from: number;
  to: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'all', label: 'Cả ngày', from: 0, to: 24 },
  { id: 'early', label: 'Sáng sớm 0h-6h', from: 0, to: 6 },
  { id: 'morning', label: 'Sáng 6h-12h', from: 6, to: 12 },
  { id: 'afternoon', label: 'Chiều 12h-18h', from: 12, to: 18 },
  { id: 'evening', label: 'Tối 18h-24h', from: 18, to: 24 },
];

// ---------------------------------------------------------------- chuyến / vé
export function searchTrips(input: { to: string; date: string; kind: TripKind }): Promise<IntercityTrip[]> {
  return api('GET /v1/public/intercity/trips', { query: { from: ORIGIN_CITY_ID, to: input.to, date: input.date, kind: input.kind } });
}

export function getTrip(id: string): Promise<IntercityTripDetail> {
  return api('GET /v1/public/intercity/trips/:id', { params: { id } });
}

/** Giữ ghế 10 phút (409 intercity.seats_taken + details.seats khi có người vừa lấy) */
export function holdSeats(tripId: string, seatIds: string[]): Promise<IntercityBooking> {
  return api('POST /v1/customer/intercity/trips/:id/holds', { params: { id: tripId }, body: { seatIds } });
}

export function confirmBooking(bookingId: string, body: ConfirmBookingBody): Promise<IntercityBooking> {
  return api('POST /v1/customer/intercity/bookings/:id/confirm', { params: { id: bookingId }, body });
}

export function cancelBooking(bookingId: string): Promise<IntercityBooking> {
  return api('POST /v1/customer/intercity/bookings/:id/cancel', { params: { id: bookingId } });
}

export function getBooking(bookingId: string): Promise<IntercityBooking> {
  return api('GET /v1/customer/intercity/bookings/:id', { params: { id: bookingId } });
}

export function listBookings(page = 1, pageSize = 20) {
  return api('GET /v1/customer/intercity/bookings', { query: { page, pageSize } });
}

export const BOOKING_STATUS_LABEL: Record<IntercityBooking['status'], string> = {
  held: 'Đang giữ chỗ',
  confirmed: 'Đã đặt',
  completed: 'Đã đi',
  cancelled: 'Đã huỷ',
  expired: 'Hết hạn giữ chỗ',
};

export const TRIP_KIND_LABEL: Record<TripKind, string> = { bus: 'Vé xe', carpool: 'Xe ghép' };
