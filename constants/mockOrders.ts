// Mock "Hoạt động của tôi" — dùng khi API /site/deliveryorders lỗi hoặc rỗng (chỉ trong __DEV__).
// Dữ liệu bám theo Figma: Hoạt động 1.2 (danh sách), 1.3/1.4 (chi tiết chuyến), Đánh giá tài xế.
import { ORDER_STATUS } from '@/services/api';

/** Nhóm dịch vụ tương ứng chip lọc "Hoạt động của tôi" — đủ 9 dịch vụ như lưới trang chủ
 *  (components/home/ServiceCard.tsx), không gộp chung "Đặt xe" nữa để lọc được chi tiết hơn. */
export type ActivityService = 'bike' | 'car' | 'intercity' | 'delivery' | 'transport' | 'rental' | 'driver' | 'handyman' | 'labor';

export type ActivityStopStatus = 'pending' | 'picked' | 'delivering' | 'done' | 'failed';

export type ActivityStop = {
  /** tên ngắn hiển thị trên card, vd "Toà nhà Flemington - Cổng chính" */
  title: string;
  /** địa chỉ đầy đủ (dòng phụ ở màn chi tiết) */
  address?: string;
  status?: ActivityStopStatus;
};

export type ActivityDriver = {
  id: string;
  name: string;
  avatar?: string | null;
  rating: number;
  reviews: number;
  plate: string;
  vehicle: string;
};

export type ActivityRating = {
  stars: number;
  tags: string[];
  favorite: boolean;
  blocked: boolean;
};

export type ActivityOrder = {
  id: string;
  /** Mã chuyến xe hiển thị: "716-207-6172" */
  code: string;
  service: ActivityService;
  /** tên dịch vụ trên card: "Giao hàng 2 giờ", "Xe máy", "Siêu tốc"... */
  serviceName: string;
  /** ORDER_STATUS (services/api.ts) */
  status: number;
  /** thời điểm tạo (ms) */
  createdAt: number;
  /** thời điểm hẹn (ms) — đơn "Đặt lịch trình" */
  scheduledAt?: number;
  pickup: ActivityStop;
  dropoffs: ActivityStop[];
  driver?: ActivityDriver;
  payment: {
    method: 'cash' | 'wallet';
    methodLabel: string;
    tip: number;
    total: number;
  };
  note?: string;
  rating?: ActivityRating;
};

/** Gợi ý "Ghi chú cho tài xế" (Figma: 2x2 chips) */
export const RATING_TAGS = ['Rất hài lòng', 'Tài xế thơm tho', 'Chạy an toàn', 'Thái độ tốt'];

/** Mốc thời gian tương đối để card hiện "Hôm nay"/"Hôm qua" đúng lúc demo */
function at(daysAgo: number, hour: number, minute: number): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

const DRIVERS: Record<string, ActivityDriver> = {
  nguyenVanA: {
    id: 'd-01',
    name: 'Nguyễn Văn A',
    avatar: null,
    rating: 4.9,
    reviews: 196,
    plate: '53A-888.88',
    vehicle: 'Civic Trắng',
  },
  phanThanhTung: {
    id: 'd-02',
    name: 'Phan Thanh Tùng',
    avatar: null,
    rating: 4.8,
    reviews: 312,
    plate: '59X2-123.45',
    vehicle: 'Honda Wave Đỏ',
  },
  jubeBowman: {
    id: 'd-03',
    name: 'Jube Bowman',
    avatar: null,
    rating: 4.7,
    reviews: 88,
    plate: '51C-456.78',
    vehicle: 'Xe tải nhỏ 500kg',
  },
};

export const MOCK_ORDERS: ActivityOrder[] = [
  // ── Đang trên đường ─────────────────────────────────────────────
  {
    id: '1001',
    code: '716-207-6180',
    service: 'delivery',
    serviceName: 'Giao hàng 2 giờ',
    status: ORDER_STATUS.DELIVERING,
    createdAt: at(0, 9, 14),
    pickup: {
      title: 'Tòa nhà A2 - Khu chung cư Xi Grand Court',
      address: 'Hẻm 252 Lý Thường Kiệt, Phường 14, Quận 10',
      status: 'picked',
    },
    dropoffs: [
      {
        title: '400 Huỳnh Văn Bánh',
        address: 'Phường 14, Quận Phú Nhuận, Hồ Chí Minh',
        status: 'delivering',
      },
    ],
    driver: DRIVERS.phanThanhTung,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 44000 },
    note: 'Hàng cần giao cẩn thận',
  },
  // ── Đặt lịch trình ──────────────────────────────────────────────
  {
    id: '1002',
    code: '716-208-0021',
    service: 'bike',
    serviceName: 'Xe máy',
    status: ORDER_STATUS.ASSIGNING,
    createdAt: at(0, 8, 2),
    scheduledAt: at(-1, 18, 30),
    pickup: { title: '182 Lê Đại Hành', address: 'Phường 15, Quận 11, Hồ Chí Minh' },
    dropoffs: [
      {
        title: 'Sân bay Tân Sơn Nhất - Ga quốc nội',
        address: 'Trường Sơn, Phường 2, Quận Tân Bình',
        status: 'pending',
      },
    ],
    payment: { method: 'wallet', methodLabel: 'Tài khoản', tip: 0, total: 68000 },
  },
  // ── Lịch sử ─────────────────────────────────────────────────────
  {
    id: '1003',
    code: '716-207-6172',
    service: 'bike',
    serviceName: 'Xe máy',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(0, 12, 19),
    pickup: {
      title: 'Toà nhà Flemington - Cổng chính',
      address: '182 Lê Đại Hành, Phường 15, Quận 11',
      status: 'done',
    },
    dropoffs: [{ title: 'Nhà', address: '400 Huỳnh Văn Bánh, Phường 14, Phú Nhuận', status: 'done' }],
    driver: DRIVERS.nguyenVanA,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 15000, total: 93000 },
    rating: { stars: 5, tags: ['Rất hài lòng'], favorite: true, blocked: false },
  },
  {
    id: '1004',
    code: '715-990-3311',
    service: 'delivery',
    serviceName: 'Siêu tốc',
    status: ORDER_STATUS.CUSTOMER_CANCELLED,
    createdAt: at(1, 15, 47),
    pickup: { title: '51 Yên Thế', address: 'Phường 2, Quận Tân Bình, Hồ Chí Minh' },
    dropoffs: [{ title: '20 Nguyễn Thị Thập', address: 'Phường Tân Phú, Quận 7, Hồ Chí Minh' }],
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 0 },
  },
  {
    id: '1005',
    code: '714-120-8842',
    service: 'transport',
    serviceName: 'Xe tải nhỏ (500 kg)',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(3, 7, 30),
    pickup: {
      title: 'Kho Tân Thuận',
      address: 'Lô C, KCX Tân Thuận, Quận 7, Hồ Chí Minh',
      status: 'done',
    },
    dropoffs: [
      { title: '78 Trần Văn Kỷ', address: 'Phường 14, Quận Bình Thạnh', status: 'done' },
      { title: '12 Lê Thị Riêng', address: 'Phường Bến Thành, Quận 1', status: 'done' },
    ],
    driver: DRIVERS.jubeBowman,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 350000 },
  },
  {
    id: '1006',
    code: '713-552-0090',
    service: 'delivery',
    serviceName: 'Siêu rẻ',
    status: ORDER_STATUS.COMPLETED,
    createdAt: new Date(2020, 4, 4, 12, 19).getTime(),
    pickup: {
      title: '400 Huỳnh Văn Bánh',
      address: 'Phường 14, Quận Phú Nhuận, Hồ Chí Minh',
      status: 'done',
    },
    dropoffs: [{ title: 'Công ty', address: '182 Lê Đại Hành, Phường 15, Quận 11', status: 'done' }],
    driver: DRIVERS.phanThanhTung,
    payment: { method: 'wallet', methodLabel: 'Tài khoản', tip: 5000, total: 35000 },
    rating: { stars: 4, tags: ['Chạy an toàn', 'Thái độ tốt'], favorite: false, blocked: false },
  },
  {
    id: '1007',
    code: '712-004-7710',
    service: 'car',
    serviceName: 'Xe hơi',
    status: ORDER_STATUS.DRIVER_CANCELLED,
    createdAt: new Date(2019, 8, 8, 19, 19).getTime(),
    pickup: { title: 'Toà nhà Flemington - Cổng chính', address: '182 Lê Đại Hành, Phường 15, Quận 11' },
    dropoffs: [{ title: 'Nhà', address: '400 Huỳnh Văn Bánh, Phường 14, Phú Nhuận' }],
    driver: DRIVERS.nguyenVanA,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 0 },
  },
  // ── Bổ sung đủ 9 danh mục cho chip lọc (trước đây chỉ có ride/delivery/transport) ────
  {
    id: '1008',
    code: '711-330-5567',
    service: 'intercity',
    serviceName: 'Xe 7 chỗ đường dài',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(5, 6, 0),
    pickup: { title: 'Bến xe Miền Đông mới', address: 'Quốc lộ 1, Thành phố Thủ Đức', status: 'done' },
    dropoffs: [{ title: 'Bến xe Vũng Tàu', address: '52 Nam Kỳ Khởi Nghĩa, TP. Vũng Tàu', status: 'done' }],
    driver: DRIVERS.nguyenVanA,
    payment: { method: 'wallet', methodLabel: 'Tài khoản', tip: 0, total: 450000 },
    rating: { stars: 5, tags: ['Chạy an toàn'], favorite: false, blocked: false },
  },
  {
    id: '1009',
    code: '710-118-9902',
    service: 'rental',
    serviceName: 'Gói căn hộ',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(7, 8, 30),
    pickup: { title: 'Chung cư Sunrise City', address: 'Nguyễn Hữu Thọ, Quận 7, Hồ Chí Minh', status: 'done' },
    dropoffs: [{ title: 'Nhà mới', address: '20 Nguyễn Thị Thập, Quận 7, Hồ Chí Minh', status: 'done' }],
    driver: DRIVERS.jubeBowman,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 100000, total: 1800000 },
  },
  {
    id: '1010',
    code: '709-004-2231',
    service: 'driver',
    serviceName: 'Xe hơi',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(9, 22, 10),
    pickup: { title: 'Nhà hàng Ngon 138', address: 'Nam Kỳ Khởi Nghĩa, Quận 3, Hồ Chí Minh', status: 'done' },
    dropoffs: [{ title: 'Nhà', address: '182 Lê Đại Hành, Phường 15, Quận 11', status: 'done' }],
    driver: DRIVERS.phanThanhTung,
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 20000, total: 170000 },
    rating: { stars: 5, tags: ['Rất hài lòng', 'Thái độ tốt'], favorite: true, blocked: false },
  },
  {
    id: '1011',
    code: '708-441-7765',
    service: 'handyman',
    serviceName: 'Thợ điện',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(11, 14, 45),
    pickup: { title: 'Nhà riêng', address: 'Tòa nhà A2 - Khu chung cư Xi Grand Court, Quận 10', status: 'done' },
    dropoffs: [{ title: 'Nhà riêng', address: 'Tòa nhà A2 - Khu chung cư Xi Grand Court, Quận 10', status: 'done' }],
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 150000 },
    note: 'Ổ cắm phòng ngủ bị chập, có mùi khét',
  },
  {
    id: '1012',
    code: '707-229-8834',
    service: 'labor',
    serviceName: 'Bốc xếp 4 giờ',
    status: ORDER_STATUS.COMPLETED,
    createdAt: at(14, 9, 0),
    pickup: { title: 'Kho Tân Thuận', address: 'Lô C, KCX Tân Thuận, Quận 7, Hồ Chí Minh', status: 'done' },
    dropoffs: [{ title: 'Kho Tân Thuận', address: 'Lô C, KCX Tân Thuận, Quận 7, Hồ Chí Minh', status: 'done' }],
    payment: { method: 'cash', methodLabel: 'Tiền mặt', tip: 0, total: 1100000 },
  },
];
