// constants/mockIntercity.ts — Xe đường dài: dữ liệu mẫu cho 2 hình thức thật của thị trường
// 1) Xe ghép: tài xế đăng còn chỗ trống trên xe riêng của họ, khách đặt theo GHẾ cụ thể.
// 2) Mua vé xe: nhà xe (Phương Trang, Thành Bưởi...) chạy nhiều chuyến/ngày, mỗi chuyến có sơ đồ ghế riêng.
// Cả 2 đều có: chọn chỗ ngồi, dịch vụ tiện ích, khai báo hàng hoá kèm theo, và (vé xe) chọn đón/trả tại nhà hay bến xe.
import type { IconName } from '@/components/ui/Icon';

export interface IntercityCity {
  id: string;
  name: string;
  region: string;
  /** dùng để nhận diện khi khách gõ tìm hoặc so khớp địa điểm đã chọn */
  keywords: string[];
  /** ước lượng đường bộ từ TP.HCM (km), chỉ để hiển thị */
  distanceKm: number;
  durationLabel: string;
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
    durationLabel: '~2 giờ 30 phút',
    station: { name: 'Bến xe Vũng Tàu', address: 'Đường 30/4, Phường 11, Vũng Tàu', lat: 10.3667, lng: 107.0843 },
  },
  {
    id: 'da-lat',
    name: 'Đà Lạt',
    region: 'Lâm Đồng',
    keywords: ['đà lạt', 'da lat', 'lâm đồng', 'lam dong'],
    distanceKm: 300,
    durationLabel: '~7 giờ',
    station: { name: 'Bến xe liên tỉnh Đà Lạt', address: '01 Tô Hiến Thành, Phường 3, Đà Lạt', lat: 11.9404, lng: 108.439 },
  },
  {
    id: 'nha-trang',
    name: 'Nha Trang',
    region: 'Khánh Hoà',
    keywords: ['nha trang', 'khánh hoà', 'khanh hoa'],
    distanceKm: 430,
    durationLabel: '~9 giờ',
    station: { name: 'Bến xe phía Nam Nha Trang', address: 'Đường 23/10, Nha Trang', lat: 12.2388, lng: 109.1967 },
  },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    region: 'Cần Thơ',
    keywords: ['cần thơ', 'can tho'],
    distanceKm: 170,
    durationLabel: '~3 giờ 30 phút',
    station: { name: 'Bến xe Trung tâm Cần Thơ', address: 'Quốc lộ 1A, Ninh Kiều, Cần Thơ', lat: 10.0263, lng: 105.746 },
  },
];

/** Khớp thành phố theo địa chỉ/tiêu đề điểm đến đã chọn (hoặc chuỗi khách gõ tìm) */
export function matchIntercityCity(query: string): IntercityCity | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return INTERCITY_CITIES.find((c) => c.keywords.some((k) => q.includes(k))) ?? null;
}

/** Gợi ý thành phố/bến xe gần nhất khi điểm đến không khớp thành phố nào đang có xe */
export function suggestNearestCity(): IntercityCity {
  return [...INTERCITY_CITIES].sort((a, b) => a.distanceKm - b.distanceKm)[0]!;
}

/* ------------------------------------------------------------------ */
/* Ngày đi / khung giờ                                                 */
/* ------------------------------------------------------------------ */

export interface DateOption {
  key: string; // yyyy-mm-dd
  label: string; // "Hôm nay" | "Ngày mai" | "Th 5"
  sub: string; // "24/09"
}

const DOW_SHORT = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

export function buildDateOptions(count = 6): DateOption[] {
  const out: DateOption[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : DOW_SHORT[d.getDay()]!,
      sub: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Lịch trình đi / về — dùng chung cho Thuê cả xe & Xe ghép            */
/* ------------------------------------------------------------------ */

export type TripType = 'oneway' | 'roundtrip';

export interface TripScheduleValue {
  tripType: TripType;
  departDateKey: string;
  departTime: string;
  returnDateKey: string;
  returnTime: string;
  /** Chỉ áp dụng khi khứ hồi: có (xe/tài xế ở lại đón khách cho chuyến về) hay không (xe không cần ở lại) */
  waitForReturn: boolean;
}

/** Giờ khởi hành thường gặp cho tuyến liên tỉnh */
export const DEPART_TIME_CHOICES = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
export const DEFAULT_DEPART_TIME = '06:00';
export const DEFAULT_RETURN_TIME = '18:00';

/** Ghép ngày (yyyy-mm-dd) + giờ ("06:00") thành epoch ms */
export function dateTimeToTs(dateKey: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(`${dateKey}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

/** Ngày gần nhất trong danh sách mà giờ đã chọn vẫn còn ở tương lai (mặc định "6:00 sáng" không rơi vào quá khứ) */
export function nextAvailableDateKey(dateOptions: DateOption[], time: string): string {
  for (const d of dateOptions) {
    if (dateTimeToTs(d.key, time) > Date.now()) return d.key;
  }
  return dateOptions[dateOptions.length - 1]?.key ?? dateOptions[0]!.key;
}

/** Mặc định: chỉ chiều đi, khởi hành 6:00 sáng (ngày gần nhất chưa qua giờ này), nếu chuyển khứ hồi thì mặc định xe ở lại phục vụ suốt hành trình */
export function defaultTripSchedule(dateOptions: DateOption[]): TripScheduleValue {
  const departDateKey = nextAvailableDateKey(dateOptions, DEFAULT_DEPART_TIME);
  return { tripType: 'oneway', departDateKey, departTime: DEFAULT_DEPART_TIME, returnDateKey: departDateKey, returnTime: DEFAULT_RETURN_TIME, waitForReturn: true };
}

export function formatDateOptionLabel(dateOptions: DateOption[], key: string): string {
  const d = dateOptions.find((o) => o.key === key);
  return d ? `${d.label} ${d.sub}` : key;
}

export interface TimeSlot {
  id: 'all' | 'early' | 'morning' | 'afternoon' | 'evening';
  label: string;
  from: number; // giờ bắt đầu (0-24), 'all' bỏ qua
  to: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'all', label: 'Cả ngày', from: 0, to: 24 },
  { id: 'early', label: 'Sáng sớm 0h-6h', from: 0, to: 6 },
  { id: 'morning', label: 'Sáng 6h-12h', from: 6, to: 12 },
  { id: 'afternoon', label: 'Chiều 12h-18h', from: 12, to: 18 },
  { id: 'evening', label: 'Tối 18h-24h', from: 18, to: 24 },
];

export function timeInSlot(departTime: string, slot: TimeSlot): boolean {
  if (slot.id === 'all') return true;
  const h = Number(departTime.split(':')[0]);
  return h >= slot.from && h < slot.to;
}

/* ------------------------------------------------------------------ */
/* Sơ đồ ghế — dùng chung cho xe ghép và vé xe                         */
/* ------------------------------------------------------------------ */

export interface SeatDef {
  id: string; // "A1"
  row: string; // "A"
  col: number; // 1
  taken: boolean;
}

/** Sinh sơ đồ ghế rows×cols, đánh dấu sẵn vài ghế đã có khách (taken) theo vị trí cho trước */
export function generateSeats(rows: number, cols: number, takenPositions: string[]): SeatDef[] {
  const seats: SeatDef[] = [];
  const rowLabels = 'ABCDEFGH'.slice(0, rows).split('');
  for (const row of rowLabels) {
    for (let col = 1; col <= cols; col++) {
      const id = `${row}${col}`;
      seats.push({ id, row, col, taken: takenPositions.includes(id) });
    }
  }
  return seats;
}

/* ------------------------------------------------------------------ */
/* 1) Xe ghép — tài xế đăng còn chỗ trên xe riêng                      */
/* ------------------------------------------------------------------ */

export interface CarpoolListing {
  id: string;
  cityId: string;
  driverName: string;
  driverRating: number;
  driverReviews: number;
  driverPhone: string;
  driverAvatar?: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  departTime: string; // "06:00"
  pricePerSeat: number;
  priceLabel: string;
  seats: SeatDef[];
  amenities: string[];
  allowsCargo: boolean;
  cargoNote: string;
  note: string;
}

export const CARPOOL_LISTINGS: CarpoolListing[] = [
  {
    id: 'ghep-vt-1', cityId: 'vung-tau', driverName: 'Phan Thanh Tùng', driverRating: 4.9, driverReviews: 196, driverPhone: '0909123456',
    vehicleModel: 'Toyota Innova', vehiclePlate: '53A-888888', vehicleColor: 'Bạc', departTime: '07:00',
    pricePerSeat: 150000, priceLabel: 'đ150.000', seats: generateSeats(2, 4, ['A1', 'A3', 'B2']),
    amenities: ['Điều hoà', 'Nước suối', 'Sạc điện thoại'], allowsCargo: true, cargoNote: 'Nhận thêm hàng nhỏ gọn, thoả thuận giá với tài xế khi lên xe',
    note: 'Đón tận nơi trong nội thành, trả tại trung tâm Vũng Tàu',
  },
  {
    id: 'ghep-vt-2', cityId: 'vung-tau', driverName: 'Lê Hoàng Long', driverRating: 4.7, driverReviews: 240, driverPhone: '0987654321',
    vehicleModel: 'Kia Carnival', vehiclePlate: '51G1-456.78', vehicleColor: 'Đen', departTime: '14:00',
    pricePerSeat: 150000, priceLabel: 'đ150.000', seats: generateSeats(2, 4, ['A2', 'A4']),
    amenities: ['Điều hoà', 'Wifi', 'Nước suối'], allowsCargo: false, cargoNote: 'Xe đông khách, không nhận thêm hàng hoá',
    note: 'Đón tận nơi trong nội thành, trả tại trung tâm Vũng Tàu',
  },
  {
    id: 'ghep-dl-1', cityId: 'da-lat', driverName: 'Trần Minh Khoa', driverRating: 5.0, driverReviews: 87, driverPhone: '0938765432',
    vehicleModel: 'Ford Everest', vehiclePlate: '59F1-889.90', vehicleColor: 'Trắng', departTime: '06:00',
    pricePerSeat: 280000, priceLabel: 'đ280.000', seats: generateSeats(2, 4, ['A1', 'A2', 'B4']),
    amenities: ['Điều hoà', 'Wifi', 'Nước suối', 'Sạc điện thoại'], allowsCargo: true, cargoNote: 'Nhận đặc sản/hàng nhỏ, phụ thu theo kích thước',
    note: 'Đón tận nơi nội thành, trả tại trung tâm Đà Lạt',
  },
  {
    id: 'ghep-dl-2', cityId: 'da-lat', driverName: 'Nguyễn Văn A', driverRating: 4.8, driverReviews: 152, driverPhone: '0912345678',
    vehicleModel: 'Hyundai Santa Fe', vehiclePlate: '59X1-234.56', vehicleColor: 'Xanh', departTime: '22:00',
    pricePerSeat: 280000, priceLabel: 'đ280.000', seats: generateSeats(2, 4, ['A3']),
    amenities: ['Điều hoà', 'Chăn gối', 'Nước suối'], allowsCargo: true, cargoNote: 'Nhận thêm hàng nhỏ gọn, thoả thuận giá với tài xế khi lên xe',
    note: 'Chuyến đêm, đón tận nơi, trả tại trung tâm Đà Lạt sáng hôm sau',
  },
  {
    id: 'ghep-nt-1', cityId: 'nha-trang', driverName: 'Phan Thanh Tùng', driverRating: 4.9, driverReviews: 196, driverPhone: '0909123456',
    vehicleModel: 'Toyota Innova', vehiclePlate: '53A-888888', vehicleColor: 'Bạc', departTime: '07:30',
    pricePerSeat: 350000, priceLabel: 'đ350.000', seats: generateSeats(2, 4, ['A1', 'B1', 'B2']),
    amenities: ['Điều hoà', 'Wifi', 'Nước suối'], allowsCargo: true, cargoNote: 'Nhận thêm hàng nhỏ gọn, thoả thuận giá với tài xế khi lên xe',
    note: 'Đón tận nơi nội thành, trả tại trung tâm Nha Trang',
  },
  {
    id: 'ghep-ct-1', cityId: 'can-tho', driverName: 'Lê Hoàng Long', driverRating: 4.7, driverReviews: 240, driverPhone: '0987654321',
    vehicleModel: 'Kia Carnival', vehiclePlate: '51G1-456.78', vehicleColor: 'Đen', departTime: '08:00',
    pricePerSeat: 160000, priceLabel: 'đ160.000', seats: generateSeats(2, 4, ['A2']),
    amenities: ['Điều hoà', 'Nước suối', 'Sạc điện thoại'], allowsCargo: true, cargoNote: 'Nhận thêm hàng nhỏ gọn, thoả thuận giá với tài xế khi lên xe',
    note: 'Đón tận nơi nội thành, trả tại trung tâm Cần Thơ',
  },
  {
    id: 'ghep-ct-2', cityId: 'can-tho', driverName: 'Trần Minh Khoa', driverRating: 5.0, driverReviews: 87, driverPhone: '0938765432',
    vehicleModel: 'Ford Everest', vehiclePlate: '59F1-889.90', vehicleColor: 'Trắng', departTime: '15:00',
    pricePerSeat: 160000, priceLabel: 'đ160.000', seats: generateSeats(2, 4, ['A1', 'A4', 'B3']),
    amenities: ['Điều hoà', 'Wifi'], allowsCargo: false, cargoNote: 'Xe đông khách, không nhận thêm hàng hoá',
    note: 'Đón tận nơi nội thành, trả tại trung tâm Cần Thơ',
  },
];

export function carpoolsForCity(cityId: string): CarpoolListing[] {
  return CARPOOL_LISTINGS.filter((c) => c.cityId === cityId);
}

/* ------------------------------------------------------------------ */
/* Giá dự kiến cho Xe ghép (đặt yêu cầu — chưa có tài xế cụ thể)       */
/* ------------------------------------------------------------------ */

/** Phụ thu đón/trả tận nơi (thay vì ra bến xe/điểm hẹn chung) */
export const CARPOOL_HOME_DROPOFF_FEE = 20000;
/** Phụ thu gửi thêm hàng hoá */
export const CARPOOL_CARGO_FEE = 30000;

/** Giá tham khảo mỗi chỗ cho 1 thành phố — trung bình giá các tài xế đang chạy tuyến này (mock);
 * chưa có tài xế nào thì ước lượng theo khoảng cách để vẫn có con số hiển thị. */
export function estimatedCarpoolSeatPrice(cityId: string): number {
  const listings = carpoolsForCity(cityId);
  if (listings.length) {
    const avg = listings.reduce((sum, l) => sum + l.pricePerSeat, 0) / listings.length;
    return Math.round(avg / 5000) * 5000;
  }
  const city = INTERCITY_CITIES.find((c) => c.id === cityId);
  return city ? Math.max(80000, Math.round((city.distanceKm * 900) / 5000) * 5000) : 150000;
}

interface CarpoolEstimateInput {
  seatCount: number;
  dropoffPref: 'home' | 'station';
  hasCargo: boolean;
}

export interface CarpoolEstimate {
  unitPrice: number;
  dropoffFee: number;
  cargoFee: number;
  total: number;
}

/** Giá dự kiến hiển thị khi khách điền yêu cầu xe ghép — tài xế nhận cuốc sẽ báo giá chính thức. */
export function estimateCarpoolPrice(cityId: string, input: CarpoolEstimateInput): CarpoolEstimate {
  const unitPrice = estimatedCarpoolSeatPrice(cityId);
  const dropoffFee = input.dropoffPref === 'home' ? CARPOOL_HOME_DROPOFF_FEE : 0;
  const cargoFee = input.hasCargo ? CARPOOL_CARGO_FEE : 0;
  const total = unitPrice * Math.max(1, input.seatCount) + dropoffFee + cargoFee;
  return { unitPrice, dropoffFee, cargoFee, total };
}

/* ------------------------------------------------------------------ */
/* 2) Mua vé xe — nhà xe chạy nhiều chuyến/ngày, mỗi chuyến 1 sơ đồ ghế */
/* ------------------------------------------------------------------ */

export interface PickupOption {
  type: 'home' | 'station';
  label: string;
  sub: string;
  fee: number;
}

export interface BusOperator {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  description: string;
  icon: IconName;
}

export const BUS_OPERATORS: BusOperator[] = [
  { id: 'phuong-trang', name: 'Phương Trang (FUTA)', rating: 4.6, reviews: 12840, description: 'Nhà xe lớn nhất, chạy khắp các tỉnh, xe đời mới, đúng giờ', icon: 'mci:bus' },
  { id: 'thanh-buoi', name: 'Thành Bưởi', rating: 4.5, reviews: 6210, description: 'Chuyên tuyến Đà Lạt, Cần Thơ; giường nằm êm, có wifi', icon: 'mci:bus' },
  { id: 'kumho-samco', name: 'Kumho Samco', rating: 4.4, reviews: 3050, description: 'Liên doanh Việt - Hàn, ghế/giường tiêu chuẩn quốc tế', icon: 'mci:bus' },
];

export interface BusTrip {
  id: string;
  operatorId: string;
  cityId: string;
  vehicleType: string; // "Limousine giường nằm 34 chỗ"
  departTime: string;
  pricePerSeat: number;
  priceLabel: string;
  seats: SeatDef[];
  amenities: string[];
  allowsCargo: boolean;
  cargoFee: number;
  pickupOptions: PickupOption[];
  dropoffOptions: PickupOption[];
}

function homeStationOptions(cityStationName: string): { pickup: PickupOption[]; dropoff: PickupOption[] } {
  return {
    pickup: [
      { type: 'home', label: 'Đón tận nơi', sub: 'Xe trung chuyển đón tại địa chỉ của bạn', fee: 20000 },
      { type: 'station', label: 'Ra bến xe', sub: 'Bến xe Miền Đông / Miền Tây, TP.HCM', fee: 0 },
    ],
    dropoff: [
      { type: 'home', label: 'Trả tận nơi', sub: 'Xe trung chuyển trả tại địa chỉ bạn chọn', fee: 20000 },
      { type: 'station', label: `Trả tại ${cityStationName}`, sub: 'Tự di chuyển từ bến xe', fee: 0 },
    ],
  };
}

export const BUS_TRIPS: BusTrip[] = INTERCITY_CITIES.flatMap((city) => {
  const { pickup, dropoff } = homeStationOptions(city.station.name);
  const basePrice = Math.round((city.distanceKm * 1200) / 5000) * 5000; // ~1.200đ/km, làm tròn 5.000đ
  const trips: BusTrip[] = [
    {
      id: `pt-${city.id}-1`, operatorId: 'phuong-trang', cityId: city.id, vehicleType: 'Limousine giường nằm 34 chỗ', departTime: '06:30',
      pricePerSeat: basePrice, priceLabel: `đ${basePrice.toLocaleString('vi-VN')}`, seats: generateSeats(6, 4, ['A1', 'A2', 'C3', 'D1']),
      amenities: ['Wifi', 'Chăn gối', 'Nước suối', 'Cổng sạc USB'], allowsCargo: true, cargoFee: 30000, pickupOptions: pickup, dropoffOptions: dropoff,
    },
    {
      id: `pt-${city.id}-2`, operatorId: 'phuong-trang', cityId: city.id, vehicleType: 'Ghế ngồi 45 chỗ', departTime: '21:00',
      pricePerSeat: Math.round(basePrice * 0.8), priceLabel: `đ${Math.round(basePrice * 0.8).toLocaleString('vi-VN')}`, seats: generateSeats(6, 4, ['B2', 'E1']),
      amenities: ['Điều hoà', 'Nước suối'], allowsCargo: true, cargoFee: 30000, pickupOptions: pickup, dropoffOptions: dropoff,
    },
  ];
  if (['da-lat', 'nha-trang'].includes(city.id)) {
    trips.push(
      { id: `tb-${city.id}-1`, operatorId: 'thanh-buoi', cityId: city.id, vehicleType: 'Limousine giường đôi 22 phòng', departTime: '08:00',
        pricePerSeat: Math.round(basePrice * 1.15), priceLabel: `đ${Math.round(basePrice * 1.15).toLocaleString('vi-VN')}`, seats: generateSeats(6, 4, ['A4', 'C1', 'C2']),
        amenities: ['Wifi', 'Chăn gối', 'Nước suối', 'Rèm riêng tư'], allowsCargo: true, cargoFee: 30000, pickupOptions: pickup, dropoffOptions: dropoff },
      { id: `tb-${city.id}-2`, operatorId: 'thanh-buoi', cityId: city.id, vehicleType: 'Limousine giường đôi 22 phòng', departTime: '23:00',
        pricePerSeat: Math.round(basePrice * 1.15), priceLabel: `đ${Math.round(basePrice * 1.15).toLocaleString('vi-VN')}`, seats: generateSeats(6, 4, ['B1']),
        amenities: ['Wifi', 'Chăn gối', 'Nước suối', 'Rèm riêng tư'], allowsCargo: true, cargoFee: 30000, pickupOptions: pickup, dropoffOptions: dropoff },
    );
  }
  if (city.id === 'nha-trang') {
    trips.push(
      { id: `ks-${city.id}-1`, operatorId: 'kumho-samco', cityId: city.id, vehicleType: 'Ghế ngồi 45 chỗ', departTime: '20:00',
        pricePerSeat: Math.round(basePrice * 0.9), priceLabel: `đ${Math.round(basePrice * 0.9).toLocaleString('vi-VN')}`, seats: generateSeats(6, 4, ['D2', 'D3']),
        amenities: ['Điều hoà', 'Nước suối', 'Cổng sạc USB'], allowsCargo: true, cargoFee: 30000, pickupOptions: pickup, dropoffOptions: dropoff },
    );
  }
  return trips;
});

export function operatorsForCity(cityId: string): { operator: BusOperator; trips: BusTrip[] }[] {
  const trips = BUS_TRIPS.filter((t) => t.cityId === cityId);
  const byOperator = new Map<string, BusTrip[]>();
  for (const t of trips) byOperator.set(t.operatorId, [...(byOperator.get(t.operatorId) ?? []), t]);
  return Array.from(byOperator.entries())
    .map(([operatorId, opTrips]) => ({ operator: BUS_OPERATORS.find((o) => o.id === operatorId)!, trips: opTrips.sort((a, b) => a.departTime.localeCompare(b.departTime)) }))
    .filter((g) => !!g.operator);
}

export function findCarpool(id: string): CarpoolListing | null {
  return CARPOOL_LISTINGS.find((c) => c.id === id) ?? null;
}
export function findBusTrip(id: string): BusTrip | null {
  return BUS_TRIPS.find((t) => t.id === id) ?? null;
}
export function findOperator(id: string): BusOperator | null {
  return BUS_OPERATORS.find((o) => o.id === id) ?? null;
}
