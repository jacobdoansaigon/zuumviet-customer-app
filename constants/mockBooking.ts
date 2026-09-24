// constants/mockBooking.ts — dữ liệu MẪU cho luồng đặt Giao hàng / Vận tải / Thuê xe tải.
// BE hiện chưa có API cho: bảng dịch vụ + giá hiển thị, địa điểm gợi ý, vị trí đã lưu,
// mã ưu đãi, tài xế yêu thích, danh bạ → toàn bộ mock nằm ở đây (đánh dấu rõ ràng để thay sau).
import { Icons, type IconName } from '@/components/ui/Icon';

export type ServiceKey = 'delivery' | 'transport' | 'rental';

export function toServiceKey(v: unknown): ServiceKey {
  return v === 'transport' || v === 'rental' ? v : 'delivery';
}

export interface ServiceOptionDef {
  id: string;
  /** service_id gửi lên BE (POST /site/deliveryorders). TODO: map theo bảng `service` thật trên Railway */
  serviceId: number;
  name: string;
  description: string;
  /** giá khởi điểm (đã gồm `includedKm` km đầu) */
  basePrice: number;
  includedKm: number;
  /** phụ phí mỗi km vượt quá includedKm (0 = đồng giá) */
  perKmPrice: number;
  /** phụ phí mỗi điểm giao thêm (từ điểm thứ 2) */
  extraStopPrice: number;
  icon: IconName;
  /** các dòng trong dialog "Thông tin dịch vụ" (copy đúng Figma GH 1.2) */
  infoLines: string[];
}

export interface ServiceGroupDef {
  key: ServiceKey;
  title: string;
  icon: IconName;
  options: ServiceOptionDef[];
}

const VAT_LINE = '* Giá đã bao gồm VAT';

export const SERVICE_GROUPS: Record<ServiceKey, ServiceGroupDef> = {
  delivery: {
    key: 'delivery',
    title: 'Giao hàng',
    icon: Icons.scooter,
    options: [
      {
        id: 'sieu-toc',
        serviceId: 1,
        name: 'Siêu tốc',
        description: 'Giao hàng nội bộ trong 1 giờ',
        basePrice: 44000,
        includedKm: 4,
        perKmPrice: 2000,
        extraStopPrice: 12000,
        icon: Icons.scooter,
        infoLines: [
          'Phí tối thiểu (dưới 4km): đ245.000',
          '4km - 10km: đ26.000/km',
          '10km - 15km: đ25.000/km',
          'Trên 15km: đ22.000/km',
          VAT_LINE,
        ],
      },
      {
        id: 'sieu-re',
        serviceId: 3,
        name: 'Siêu rẻ',
        description: 'Giao hàng trong 4 giờ, ghép đơn',
        basePrice: 30000,
        includedKm: 4,
        perKmPrice: 1500,
        extraStopPrice: 8000,
        icon: Icons.scooter,
        infoLines: [
          'Phí tối thiểu (dưới 4km): đ30.000',
          '4km - 10km: đ18.000/km',
          '10km - 15km: đ16.000/km',
          'Trên 15km: đ14.000/km',
          VAT_LINE,
        ],
      },
      {
        id: 'dong-gia-25k',
        serviceId: 5,
        name: 'Đồng giá 25k',
        description: 'Giao nội thành đồng giá, trong ngày',
        basePrice: 25000,
        includedKm: 0,
        perKmPrice: 0,
        extraStopPrice: 25000,
        icon: Icons.scooter,
        infoLines: ['Đồng giá nội thành: đ25.000/điểm giao', 'Không phụ thu theo km', 'Giao trong ngày (trước 21h)', VAT_LINE],
      },
    ],
  },
  transport: {
    key: 'transport',
    title: 'Vận tải',
    icon: Icons.truck,
    options: [
      {
        id: 'ban-tai',
        serviceId: 11,
        name: 'Xe bán tải',
        description: 'Tải trọng đến 500kg, thùng 1.8m',
        basePrice: 150000,
        includedKm: 4,
        perKmPrice: 12000,
        extraStopPrice: 30000,
        icon: Icons.truck,
        infoLines: ['Phí tối thiểu (dưới 4km): đ150.000', '4km - 10km: đ12.000/km', 'Trên 10km: đ10.000/km', 'Bốc xếp: thoả thuận với tài xế', VAT_LINE],
      },
      {
        id: 'tai-500',
        serviceId: 13,
        name: 'Xe tải nhỏ (500 kg)',
        description: 'Thùng kín 2.4m, chở đồ gia dụng',
        basePrice: 220000,
        includedKm: 4,
        perKmPrice: 15000,
        extraStopPrice: 40000,
        icon: Icons.truck,
        infoLines: ['Phí tối thiểu (dưới 4km): đ220.000', '4km - 10km: đ15.000/km', 'Trên 10km: đ12.000/km', 'Bốc xếp: thoả thuận với tài xế', VAT_LINE],
      },
      {
        id: 'tai-1000',
        serviceId: 15,
        name: 'Xe tải trung (1000 kg)',
        description: 'Thùng kín 3.5m, chuyển nhà / kho',
        basePrice: 350000,
        includedKm: 4,
        perKmPrice: 20000,
        extraStopPrice: 50000,
        icon: Icons.truck,
        infoLines: ['Phí tối thiểu (dưới 4km): đ350.000', '4km - 10km: đ20.000/km', 'Trên 10km: đ16.000/km', 'Bốc xếp: thoả thuận với tài xế', VAT_LINE],
      },
    ],
  },
  rental: {
    key: 'rental',
    title: 'Thuê xe tải',
    icon: Icons.van,
    options: [
      {
        id: 'thue-2h',
        serviceId: 21,
        name: 'Thuê 2 giờ',
        description: 'Xe tải nhỏ kèm tài xế, tối đa 30km',
        basePrice: 400000,
        includedKm: 30,
        perKmPrice: 8000,
        extraStopPrice: 0,
        icon: Icons.van,
        infoLines: ['Giá thuê 2 giờ: đ400.000 (30km đầu)', 'Vượt km: đ8.000/km', 'Vượt giờ: đ150.000/giờ', VAT_LINE],
      },
      {
        id: 'thue-4h',
        serviceId: 23,
        name: 'Thuê 4 giờ',
        description: 'Xe tải nhỏ kèm tài xế, tối đa 60km',
        basePrice: 700000,
        includedKm: 60,
        perKmPrice: 8000,
        extraStopPrice: 0,
        icon: Icons.van,
        infoLines: ['Giá thuê 4 giờ: đ700.000 (60km đầu)', 'Vượt km: đ8.000/km', 'Vượt giờ: đ150.000/giờ', VAT_LINE],
      },
      {
        id: 'thue-ngay',
        serviceId: 25,
        name: 'Thuê 1 ngày',
        description: 'Xe tải nhỏ kèm tài xế, 8 giờ / 120km',
        basePrice: 1500000,
        includedKm: 120,
        perKmPrice: 7000,
        extraStopPrice: 0,
        icon: Icons.van,
        infoLines: ['Giá thuê 1 ngày (8 giờ): đ1.500.000', '120km đầu miễn phí, vượt: đ7.000/km', 'Vượt giờ: đ150.000/giờ', VAT_LINE],
      },
    ],
  },
};

/** Phụ phí theo Figma GH 1.6 / GH 1.4.1 */
export const EXTRA_PRICES = {
  returnToPickup: 35000,
  handToCustomer: 35000,
  tip: 5000,
  handDelivery: 10000,
} as const;

/** Số dư "Tài khoản" hiển thị ở sheet Hình thức thanh toán (mock, chưa có API ví) */
export const WALLET_BALANCE = 24000;

export const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };

export type PackageSizeId = 'xs' | 's' | 'm' | 'l';
export interface PackageSizeDef {
  id: PackageSizeId;
  label: string;
  sub: string;
  /** weight_id gửi lên BE (service_weight trong setting dịch vụ). TODO: map id thật */
  weightId: number;
}
export const PACKAGE_SIZES: PackageSizeDef[] = [
  { id: 'xs', label: 'Siêu nhỏ', sub: '< 0.5 kg', weightId: 1 },
  { id: 's', label: 'Nhỏ', sub: '0.5 - 1kg', weightId: 2 },
  { id: 'm', label: 'Vừa', sub: '1 -3kg', weightId: 3 },
  { id: 'l', label: 'Lớn', sub: '>3kg', weightId: 4 },
];

export type ViewOptionId = 'view' | 'view_check' | 'no_view';
export const VIEW_OPTIONS: { id: ViewOptionId; label: string }[] = [
  { id: 'view', label: 'Được xem hàng' },
  { id: 'view_check', label: 'Được xem và kiểm hàng' },
  { id: 'no_view', label: 'Không được xem hàng' },
];

export interface SamplePlace {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  /** đã lưu trong "Vị trí đã lưu" */
  saved?: 'home' | 'office' | true;
  savedLocationId?: number;
}

/** Điểm gửi mặc định (Figma GH 1.1). Toạ độ sẽ được thay bằng GPS thật khi có quyền. */
export const DEFAULT_SENDER_PLACE: SamplePlace = {
  id: 'xi-grand-court',
  title: 'Tòa nhà A2 - Khu chung cư Xi Grand Court',
  address: 'Tòa nhà A2 - Khu chung cư Xi Grand Court, Hẻm 252 Lý Thường Kiệt, Phường 14, Quận 10',
  lat: 10.7716,
  lng: 106.6585,
};

export const SAMPLE_PLACES: SamplePlace[] = [
  { id: 'yen-the', title: '51 Yên Thế', address: '51 Yên Thế, Tân Bình, Hồ Chí Minh', lat: 10.8065, lng: 106.664, saved: 'home', savedLocationId: 1 },
  { id: 'le-dai-hanh', title: '182 Lê Đại Hành', address: '182 Lê Đại Hành, Phường 15, Quận 11, Hồ Chí Minh', lat: 10.7656, lng: 106.654, saved: 'office', savedLocationId: 2 },
  { id: 'tran-van-ky', title: '78 Trần Văn Kỷ', address: '78 Trần Văn Kỷ, Phường 14, Quận Bình Thạnh, Hồ Chí Minh', lat: 10.8035, lng: 106.7047 },
  { id: 'nguyen-thi-thap', title: '20 Nguyễn Thị Thập', address: '20 Nguyễn Thị Thập, Tân Phú, Quận 7, Hồ Chí Minh', lat: 10.738, lng: 106.712 },
  { id: 'huynh-van-banh', title: '400 Huỳnh Văn Bánh', address: '400 Huỳnh Văn Bánh, Phường 14, Phú Nhuận, Hồ Chí Minh', lat: 10.793, lng: 106.674 },
  { id: 'le-thi-rieng', title: '12 Lê Thị Riêng', address: '12 Lê Thị Riêng, Phường Bến Thành, Quận 1, Hồ Chí Minh', lat: 10.77, lng: 106.69 },
  { id: 'flemington', title: 'Toà nhà Flemington - Cổng chính', address: '182 Lê Đại Hành, Phường 15, Quận 11, Hồ Chí Minh', lat: 10.7646, lng: 106.656, saved: true },
  { id: 'vincom-dong-khoi', title: 'Vincom Center Đồng Khởi', address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, Hồ Chí Minh', lat: 10.778, lng: 106.702 },
  { id: 'ben-thanh', title: 'Chợ Bến Thành', address: 'Lê Lợi, Phường Bến Thành, Quận 1, Hồ Chí Minh', lat: 10.7725, lng: 106.698 },
  { id: 'tan-son-nhat', title: 'Sân bay Tân Sơn Nhất - Ga quốc nội', address: 'Trường Sơn, Phường 2, Tân Bình, Hồ Chí Minh', lat: 10.8188, lng: 106.652 },
  { id: 'crescent-mall', title: 'Crescent Mall', address: '101 Tôn Dật Tiên, Tân Phú, Quận 7, Hồ Chí Minh', lat: 10.7286, lng: 106.7189 },
  { id: 'aeon-tan-phu', title: 'AEON Mall Tân Phú', address: '30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, Hồ Chí Minh', lat: 10.8014, lng: 106.6176 },
];

export const SAVED_LOCATIONS: { key: 'home' | 'office'; label: string; icon: IconName; place: SamplePlace }[] = [
  { key: 'home', label: 'Nhà', icon: Icons.homeAddr, place: SAMPLE_PLACES[0]! },
  { key: 'office', label: 'Công ty', icon: Icons.office, place: SAMPLE_PLACES[1]! },
];

export interface PromoDef {
  code: string;
  title: string;
  description: string;
  percent?: number;
  amount?: number;
  maxDiscount?: number;
}
export const PROMO_CODES: PromoDef[] = [
  { code: 'MUAXUAN2020', title: 'Mã MUAXUAN2020', description: 'Áp dụng mã MUAXUAN 2020 giảm 20%', percent: 20, maxDiscount: 50000 },
  { code: 'ZUUM10', title: 'Mã ZUUM10', description: 'Giảm 10% cho đơn giao hàng nội thành', percent: 10, maxDiscount: 20000 },
  { code: 'FREESHIP15', title: 'Mã FREESHIP15', description: 'Giảm ngay đ15.000 cho đơn từ đ40.000', amount: 15000 },
];

export interface DriverDef {
  id: number;
  name: string;
  plate: string;
  vehicle: string;
  rating: number;
  reviews: number;
  phone: string;
  avatar?: string;
}
export const FAVORITE_DRIVERS: DriverDef[] = [
  { id: 101, name: 'Phan Thanh Tùng', plate: '53A-888888', vehicle: 'Honda Wave Đen', rating: 4.9, reviews: 196, phone: '0909123456' },
  { id: 102, name: 'Nguyễn Văn A', plate: '59X1-234.56', vehicle: 'Yamaha Sirius Xanh', rating: 4.8, reviews: 152, phone: '0912345678' },
  { id: 103, name: 'Trần Minh Khoa', plate: '59F1-889.90', vehicle: 'Honda Vision Trắng', rating: 5.0, reviews: 87, phone: '0938765432' },
  { id: 104, name: 'Lê Hoàng Long', plate: '51G1-456.78', vehicle: 'Honda Air Blade Đỏ', rating: 4.7, reviews: 240, phone: '0987654321' },
];
/** Tài xế mock được "ghép" khi BE chưa trả thông tin tài xế */
export const MOCK_DRIVER: DriverDef = FAVORITE_DRIVERS[0]!;

export interface ContactDef {
  name: string;
  phone: string;
}
/** Danh bạ mẫu (Figma 1.4 danh bạ) — expo-contacts chưa cài */
export const MOCK_CONTACTS: ContactDef[] = [
  { name: 'Phan Thanh Tùng', phone: '0352237832' },
  { name: 'Tú Quỳnh', phone: '0352237833' },
  { name: 'Nguyễn Văn A', phone: '0909000111' },
  { name: 'Mẹ', phone: '0918222333' },
  { name: 'Shop Hoa Tươi Q.10', phone: '0283864567' },
];

/** Lý do huỷ (Figma Huỷ 1.2.1). id: TODO map theo bảng service_cancel_reason thật */
export const CANCEL_REASONS: { id: number; label: string }[] = [
  { id: 1, label: 'Người nhận không nghe máy' },
  { id: 2, label: 'Thuê bao người nhận không liên lạc được' },
  { id: 3, label: 'Người nhận hẹn lại ngày giao' },
  { id: 4, label: 'Người nhận thay đổi địa chỉ giao hàng' },
  { id: 5, label: 'Hàng hóa bị hư hỏng' },
  { id: 6, label: 'Hàng hóa không đúng' },
  { id: 7, label: 'Khác' },
];

/** Text trạng thái từng điểm (Figma) */
export const STOP_STATUS_TEXT = {
  new: 'Chờ lấy hàng',
  picking: 'Đang lấy hàng',
  picked: 'Đã lấy hàng',
  delivering: 'Đang giao',
  completed: 'Giao thành công',
  failed: 'Giao thất bại - Đang hoàn trả',
  returned: 'Đã trả hàng',
} as const;
