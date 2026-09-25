// constants/mockIntercity.ts — Xe đường dài: các tỉnh/thành đang có "xe ghép" chạy tuyến cố định + bến xe
// (điểm trả mặc định khi khách chọn thành phố làm điểm đến). Dữ liệu mẫu.
//
// Cách dùng: mỗi chuyến ghép (IntercityTrip) được gắn thành 1 ServiceOptionDef tĩnh trong
// SERVICE_GROUPS.intercity.options (xem constants/mockBooking.ts, hàm tripOption) — nhờ vậy toàn bộ
// máy tính giá/đặt đơn có sẵn (getOption/computePrice/submitBooking) dùng được luôn, không cần sửa gì thêm.
// Màn đặt (app/booking/index.tsx) chỉ LỌC hiển thị theo thành phố khách chọn làm điểm đến:
// khớp thành phố → hiện các chuyến ghép của thành phố đó + vẫn cho đặt xe riêng; không khớp → gợi ý
// thành phố/bến xe gần nhất đang phục vụ.
import type { IconName } from '@/components/ui/Icon';

export interface IntercityCity {
  id: string;
  name: string;
  region: string;
  /** dùng để nhận diện khi khách gõ tìm hoặc so khớp địa điểm đã chọn */
  keywords: string[];
  /** ước lượng đường bộ từ TP.HCM (km), chỉ để hiển thị */
  distanceKm: number;
  station: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}

export const INTERCITY_CITIES: IntercityCity[] = [
  {
    id: 'vung-tau',
    name: 'Vũng Tàu',
    region: 'Bà Rịa - Vũng Tàu',
    keywords: ['vũng tàu', 'vung tau', 'bà rịa', 'ba ria'],
    distanceKm: 120,
    station: { name: 'Bến xe Vũng Tàu', address: 'Đường 30/4, Phường 11, Vũng Tàu', lat: 10.3667, lng: 107.0843 },
  },
  {
    id: 'da-lat',
    name: 'Đà Lạt',
    region: 'Lâm Đồng',
    keywords: ['đà lạt', 'da lat', 'lâm đồng', 'lam dong'],
    distanceKm: 300,
    station: { name: 'Bến xe liên tỉnh Đà Lạt', address: '01 Tô Hiến Thành, Phường 3, Đà Lạt', lat: 11.9404, lng: 108.439 },
  },
  {
    id: 'nha-trang',
    name: 'Nha Trang',
    region: 'Khánh Hoà',
    keywords: ['nha trang', 'khánh hoà', 'khanh hoa'],
    distanceKm: 430,
    station: { name: 'Bến xe phía Nam Nha Trang', address: 'Đường 23/10, Nha Trang', lat: 12.2388, lng: 109.1967 },
  },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    region: 'Cần Thơ',
    keywords: ['cần thơ', 'can tho'],
    distanceKm: 170,
    station: { name: 'Bến xe Trung tâm Cần Thơ', address: 'Quốc lộ 1A, Ninh Kiều, Cần Thơ', lat: 10.0263, lng: 105.746 },
  },
];

export interface IntercityTrip {
  id: string;
  cityId: string;
  departTime: string;
  vehicle: string;
  seatsLeft: number;
  pricePerSeat: number;
  /** đã format sẵn để hiển thị, vd "đ150.000" */
  priceLabel: string;
  note: string;
  icon: IconName;
}

export const INTERCITY_TRIPS: IntercityTrip[] = [
  { id: 'ghep-vt-1', cityId: 'vung-tau', departTime: '07:00', vehicle: 'Xe ghép 9 chỗ', seatsLeft: 4, pricePerSeat: 150000, priceLabel: 'đ150.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Vũng Tàu', icon: 'mci:van-passenger' },
  { id: 'ghep-vt-2', cityId: 'vung-tau', departTime: '14:00', vehicle: 'Xe ghép 9 chỗ', seatsLeft: 2, pricePerSeat: 150000, priceLabel: 'đ150.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Vũng Tàu', icon: 'mci:van-passenger' },
  { id: 'ghep-dl-1', cityId: 'da-lat', departTime: '06:00', vehicle: 'Limousine giường nằm', seatsLeft: 5, pricePerSeat: 280000, priceLabel: 'đ280.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Đà Lạt', icon: 'mci:car-limousine' },
  { id: 'ghep-dl-2', cityId: 'da-lat', departTime: '20:00', vehicle: 'Limousine giường nằm (chuyến đêm)', seatsLeft: 3, pricePerSeat: 280000, priceLabel: 'đ280.000', note: 'Ngủ trên xe, đến Đà Lạt sáng hôm sau', icon: 'mci:car-limousine' },
  { id: 'ghep-nt-1', cityId: 'nha-trang', departTime: '07:30', vehicle: 'Limousine giường nằm', seatsLeft: 6, pricePerSeat: 350000, priceLabel: 'đ350.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Nha Trang', icon: 'mci:car-limousine' },
  { id: 'ghep-nt-2', cityId: 'nha-trang', departTime: '21:00', vehicle: 'Limousine giường nằm (chuyến đêm)', seatsLeft: 4, pricePerSeat: 350000, priceLabel: 'đ350.000', note: 'Ngủ trên xe, đến Nha Trang sáng hôm sau', icon: 'mci:car-limousine' },
  { id: 'ghep-ct-1', cityId: 'can-tho', departTime: '08:00', vehicle: 'Xe ghép 9 chỗ', seatsLeft: 5, pricePerSeat: 160000, priceLabel: 'đ160.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Cần Thơ', icon: 'mci:van-passenger' },
  { id: 'ghep-ct-2', cityId: 'can-tho', departTime: '15:00', vehicle: 'Xe ghép 9 chỗ', seatsLeft: 3, pricePerSeat: 160000, priceLabel: 'đ160.000', note: 'Đón tận nơi nội thành, trả tại trung tâm Cần Thơ', icon: 'mci:van-passenger' },
];

/** Khớp thành phố theo địa chỉ/tiêu đề điểm đến đã chọn (hoặc chuỗi khách gõ tìm) */
export function matchIntercityCity(query: string): IntercityCity | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return INTERCITY_CITIES.find((c) => c.keywords.some((k) => q.includes(k))) ?? null;
}

/** Gợi ý thành phố/bến xe gần nhất khi điểm đến không khớp thành phố nào đang có xe ghép */
export function suggestNearestCity(): IntercityCity {
  return [...INTERCITY_CITIES].sort((a, b) => a.distanceKm - b.distanceKm)[0]!;
}

export function tripsForCity(cityId: string): IntercityTrip[] {
  return INTERCITY_TRIPS.filter((t) => t.cityId === cityId);
}
