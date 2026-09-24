// constants/mockBooking.ts — dữ liệu MẪU cho luồng đặt Giao hàng / Vận tải / Thuê xe tải.
// BE hiện chưa có API cho: bảng dịch vụ + giá hiển thị, địa điểm gợi ý, vị trí đã lưu,
// mã ưu đãi, tài xế yêu thích, danh bạ → toàn bộ mock nằm ở đây (đánh dấu rõ ràng để thay sau).
import { Icons, type IconName } from '@/components/ui/Icon';

export type ServiceKey = 'delivery' | 'transport' | 'rental' | 'bike' | 'car' | 'car6' | 'driver' | 'handyman';

export const SERVICE_KEYS: ServiceKey[] = ['delivery', 'transport', 'rental', 'bike', 'car', 'car6', 'driver', 'handyman'];

export function toServiceKey(v: unknown): ServiceKey {
  return typeof v === 'string' && (SERVICE_KEYS as string[]).includes(v) ? (v as ServiceKey) : 'delivery';
}

/** Loại luồng đặt: giao hàng (nhiều điểm giao) / chở khách (1 điểm đến) / tận nơi (không có điểm đến) */
export type ServiceKind = 'delivery' | 'ride' | 'onsite';

/** Nhãn hiển thị theo loại luồng — dùng chung cho màn đặt / người gửi / điểm đến / xác nhận / theo dõi */
export interface ServiceLabels {
  /** "Tài xế" | "Thợ" */
  provider: string;
  feeLabel: string;
  senderPlaceholder: string;
  senderStatus: string;
  senderScreenTitle: string;
  senderNameLabel: string;
  senderPhonePlaceholder: string;
  senderLocationTitle: string;
  senderLocationPlaceholder: string;
  receiverPlaceholder: string;
  receiverAddPlaceholder: string;
  receiverStatus: string;
  receiverScreenTitle: string;
  receiverLocationTitle: string;
  receiverLocationPlaceholder: string;
  confirmTitle: string;
  confirmHint: string;
  /** đơn vị đếm điểm ở footer xác nhận: "2 điểm giao" */
  stopUnit: string;
  mapPickupLabel: string;
  mapDropLabel: string;
  trackingAccepted: string;
  /** có chỗ trống {eta} = số phút */
  trackingEta: string;
  trackingDelivering: string;
  trackingDone: string;
}

export const DELIVERY_LABELS: ServiceLabels = {
  provider: 'Tài xế',
  feeLabel: 'Cước dịch vụ',
  senderPlaceholder: 'Nhập thông tin người gửi',
  senderStatus: 'Đang lấy hàng',
  senderScreenTitle: 'Thông tin người gửi',
  senderNameLabel: 'Họ và tên người gửi',
  senderPhonePlaceholder: 'Số điện thoại người gửi',
  senderLocationTitle: 'Lựa chọn địa điểm',
  senderLocationPlaceholder: 'Nhập địa chỉ lấy hàng',
  receiverPlaceholder: 'Nhập điểm gửi hàng',
  receiverAddPlaceholder: '+ Thêm địa điểm gửi hàng',
  receiverStatus: 'Đang lấy hàng',
  receiverScreenTitle: 'Thông tin người nhận',
  receiverLocationTitle: 'Thêm điểm gửi hàng',
  receiverLocationPlaceholder: 'Nhập địa chỉ người nhận',
  confirmTitle: 'Xác nhận giao hàng',
  confirmHint: 'Vui lòng chọn địa điểm gửi hàng',
  stopUnit: 'điểm giao',
  mapPickupLabel: 'Điểm lấy hàng',
  mapDropLabel: 'Điểm giao',
  trackingAccepted: 'Đang lấy hàng',
  trackingEta: '{eta} phút nữa Tài xế đến lấy hàng',
  trackingDelivering: 'Đang giao',
  trackingDone: 'Giao hàng thành công',
};

export const RIDE_LABELS: ServiceLabels = {
  provider: 'Tài xế',
  feeLabel: 'Cước chuyến đi',
  senderPlaceholder: 'Nhập thông tin người đi',
  senderStatus: 'Điểm đón',
  senderScreenTitle: 'Thông tin người đi',
  senderNameLabel: 'Họ và tên người đi',
  senderPhonePlaceholder: 'Số điện thoại người đi',
  senderLocationTitle: 'Chọn điểm đón',
  senderLocationPlaceholder: 'Nhập điểm đón',
  receiverPlaceholder: 'Nhập điểm đến',
  receiverAddPlaceholder: '+ Thêm điểm đến',
  receiverStatus: 'Điểm đến',
  receiverScreenTitle: 'Điểm đến',
  receiverLocationTitle: 'Chọn điểm đến',
  receiverLocationPlaceholder: 'Nhập điểm đến',
  confirmTitle: 'Xác nhận đặt xe',
  confirmHint: 'Vui lòng chọn điểm đón và điểm đến',
  stopUnit: 'điểm đến',
  mapPickupLabel: 'Điểm đón',
  mapDropLabel: 'Điểm đến',
  trackingAccepted: 'Đang đến đón',
  trackingEta: '{eta} phút nữa Tài xế đến đón bạn',
  trackingDelivering: 'Đang di chuyển',
  trackingDone: 'Chuyến đi hoàn thành',
};

export const ONSITE_LABELS: ServiceLabels = {
  provider: 'Thợ',
  feeLabel: 'Phí gọi thợ',
  senderPlaceholder: 'Nhập thông tin liên hệ',
  senderStatus: 'Địa điểm',
  senderScreenTitle: 'Thông tin liên hệ',
  senderNameLabel: 'Họ và tên người liên hệ',
  senderPhonePlaceholder: 'Số điện thoại liên hệ',
  senderLocationTitle: 'Địa điểm cần thợ',
  senderLocationPlaceholder: 'Nhập địa điểm cần thợ',
  receiverPlaceholder: '',
  receiverAddPlaceholder: '',
  receiverStatus: '',
  receiverScreenTitle: '',
  receiverLocationTitle: '',
  receiverLocationPlaceholder: '',
  confirmTitle: 'Xác nhận gọi thợ',
  confirmHint: 'Vui lòng nhập địa điểm cần thợ',
  stopUnit: 'địa điểm',
  mapPickupLabel: 'Địa điểm',
  mapDropLabel: '',
  trackingAccepted: 'Thợ đang đến',
  trackingEta: '{eta} phút nữa Thợ đến nơi',
  trackingDelivering: 'Đang thực hiện',
  trackingDone: 'Hoàn thành công việc',
};

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
  kind: ServiceKind;
  labels: ServiceLabels;
  /** số điểm đến tối đa (0 = dịch vụ tận nơi, không có điểm đến) */
  maxStops: number;
  options: ServiceOptionDef[];
}

const VAT_LINE = '* Giá đã bao gồm VAT';

export const SERVICE_GROUPS: Record<ServiceKey, ServiceGroupDef> = {
  delivery: {
    key: 'delivery',
    title: 'Giao hàng',
    icon: Icons.scooter,
    kind: 'delivery',
    labels: DELIVERY_LABELS,
    maxStops: 10,
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
    kind: 'delivery',
    labels: DELIVERY_LABELS,
    maxStops: 10,
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
    kind: 'delivery',
    labels: DELIVERY_LABELS,
    maxStops: 10,
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
  // ---------------------------------------------------------------- Chở khách
  bike: {
    key: 'bike',
    title: 'Xe máy',
    icon: Icons.motorbike,
    kind: 'ride',
    labels: RIDE_LABELS,
    maxStops: 1,
    options: [
      {
        id: 'xe-may',
        serviceId: 31,
        name: 'Xe máy',
        description: 'Đón tận nơi, 1 hành khách',
        basePrice: 12000,
        includedKm: 2,
        perKmPrice: 4500,
        extraStopPrice: 0,
        icon: Icons.motorbike,
        infoLines: ['Giá mở cửa (2km đầu): đ12.000', 'Mỗi km tiếp theo: đ4.500', 'Phụ phí giờ cao điểm / mưa: +đ5.000', 'Miễn phí chờ 5 phút đầu', VAT_LINE],
      },
      {
        id: 'xe-may-plus',
        serviceId: 33,
        name: 'Xe máy Plus',
        description: 'Tài xế 4.8★ trở lên, xe đời mới',
        basePrice: 16000,
        includedKm: 2,
        perKmPrice: 5500,
        extraStopPrice: 0,
        icon: Icons.motorbike,
        infoLines: ['Giá mở cửa (2km đầu): đ16.000', 'Mỗi km tiếp theo: đ5.500', 'Tài xế đánh giá 4.8★ trở lên', 'Tặng nón bảo hiểm sạch & áo mưa', VAT_LINE],
      },
    ],
  },
  car: {
    key: 'car',
    title: 'Xe hơi',
    icon: Icons.car,
    kind: 'ride',
    labels: RIDE_LABELS,
    maxStops: 1,
    options: [
      {
        id: 'xe-4-cho',
        serviceId: 41,
        name: 'Xe 4 chỗ',
        description: 'Sedan / hatchback, tối đa 4 khách',
        basePrice: 30000,
        includedKm: 2,
        perKmPrice: 11000,
        extraStopPrice: 0,
        icon: Icons.car,
        infoLines: ['Giá mở cửa (2km đầu): đ30.000', 'Mỗi km tiếp theo: đ11.000', 'Phụ phí giờ cao điểm: +đ10.000', 'Miễn phí chờ 5 phút đầu', VAT_LINE],
      },
      {
        id: 'xe-4-cho-plus',
        serviceId: 43,
        name: 'Xe 4 chỗ Plus',
        description: 'Xe đời mới, tài xế 4.9★',
        basePrice: 38000,
        includedKm: 2,
        perKmPrice: 13500,
        extraStopPrice: 0,
        icon: Icons.car,
        infoLines: ['Giá mở cửa (2km đầu): đ38.000', 'Mỗi km tiếp theo: đ13.500', 'Xe đời 2020 trở lên, có nước suối', 'Tài xế đánh giá 4.9★ trở lên', VAT_LINE],
      },
    ],
  },
  car6: {
    key: 'car6',
    title: 'Xe 6 chỗ',
    icon: Icons.carSeat,
    kind: 'ride',
    labels: RIDE_LABELS,
    maxStops: 1,
    options: [
      {
        id: 'xe-6-cho',
        serviceId: 51,
        name: 'Xe 6 chỗ',
        description: 'SUV / MPV, tối đa 6 khách',
        basePrice: 38000,
        includedKm: 2,
        perKmPrice: 13000,
        extraStopPrice: 0,
        icon: Icons.carSeat,
        infoLines: ['Giá mở cửa (2km đầu): đ38.000', 'Mỗi km tiếp theo: đ13.000', 'Phụ phí giờ cao điểm: +đ10.000', 'Khoang hành lý rộng', VAT_LINE],
      },
      {
        id: 'xe-7-cho',
        serviceId: 53,
        name: 'Xe 7 chỗ',
        description: 'Fortuner, Innova… tối đa 7 khách',
        basePrice: 42000,
        includedKm: 2,
        perKmPrice: 14500,
        extraStopPrice: 0,
        icon: Icons.carSeat,
        infoLines: ['Giá mở cửa (2km đầu): đ42.000', 'Mỗi km tiếp theo: đ14.500', 'Phụ phí giờ cao điểm: +đ10.000', 'Phù hợp gia đình, nhóm bạn', VAT_LINE],
      },
      {
        id: 'xe-6-cho-san-bay',
        serviceId: 55,
        name: 'Xe 6 chỗ sân bay',
        description: 'Đưa đón sân bay, giá trọn gói',
        basePrice: 250000,
        includedKm: 15,
        perKmPrice: 10000,
        extraStopPrice: 0,
        icon: Icons.carSeat,
        infoLines: ['Trọn gói 15km đầu: đ250.000', 'Vượt km: đ10.000/km', 'Đã gồm phí ra vào sân bay', 'Chờ tối đa 30 phút sau giờ hạ cánh', VAT_LINE],
      },
    ],
  },
  driver: {
    key: 'driver',
    title: 'Gọi tài xế',
    icon: Icons.steering,
    kind: 'ride',
    labels: RIDE_LABELS,
    maxStops: 1,
    options: [
      {
        id: 'tai-xe-chuyen',
        serviceId: 61,
        name: 'Tài xế theo chuyến',
        description: 'Lái xe của bạn, tính theo km',
        basePrice: 150000,
        includedKm: 10,
        perKmPrice: 8000,
        extraStopPrice: 0,
        icon: Icons.steering,
        infoLines: ['Phí tối thiểu (10km đầu): đ150.000', 'Mỗi km tiếp theo: đ8.000', 'Tài xế có bằng B2 trở lên, tối thiểu 3 năm kinh nghiệm', 'Xăng, phí cầu đường do chủ xe chi trả', VAT_LINE],
      },
      {
        id: 'tai-xe-4h',
        serviceId: 63,
        name: 'Tài xế 4 giờ',
        description: 'Thuê tài xế nửa ngày, tối đa 60km',
        basePrice: 450000,
        includedKm: 60,
        perKmPrice: 5000,
        extraStopPrice: 0,
        icon: Icons.steering,
        infoLines: ['Giá thuê 4 giờ: đ450.000 (60km đầu)', 'Vượt km: đ5.000/km', 'Vượt giờ: đ100.000/giờ', 'Xăng, phí cầu đường do chủ xe chi trả', VAT_LINE],
      },
      {
        id: 'tai-xe-8h',
        serviceId: 65,
        name: 'Tài xế 8 giờ',
        description: 'Thuê tài xế cả ngày, tối đa 120km',
        basePrice: 800000,
        includedKm: 120,
        perKmPrice: 5000,
        extraStopPrice: 0,
        icon: Icons.steering,
        infoLines: ['Giá thuê 8 giờ: đ800.000 (120km đầu)', 'Vượt km: đ5.000/km', 'Vượt giờ: đ100.000/giờ', 'Xăng, phí cầu đường do chủ xe chi trả', VAT_LINE],
      },
    ],
  },
  // ---------------------------------------------------------------- Dịch vụ tận nơi
  handyman: {
    key: 'handyman',
    title: 'Gọi thợ',
    icon: Icons.tools,
    kind: 'onsite',
    labels: ONSITE_LABELS,
    maxStops: 0,
    options: [
      {
        id: 'tho-dien',
        serviceId: 71,
        name: 'Thợ điện',
        description: 'Chập điện, ổ cắm, đèn, quạt, CB',
        basePrice: 100000,
        includedKm: 0,
        perKmPrice: 0,
        extraStopPrice: 0,
        icon: Icons.flash,
        infoLines: ['Phí gọi thợ (khảo sát): đ100.000', 'Công sửa chữa: báo giá tại chỗ trước khi làm', 'Vật tư thay thế tính riêng', 'Bảo hành công 7 ngày', VAT_LINE],
      },
      {
        id: 'tho-nuoc',
        serviceId: 73,
        name: 'Thợ nước',
        description: 'Rò rỉ, tắc nghẽn, vòi sen, bồn cầu',
        basePrice: 100000,
        includedKm: 0,
        perKmPrice: 0,
        extraStopPrice: 0,
        icon: 'mci:water-pump',
        infoLines: ['Phí gọi thợ (khảo sát): đ100.000', 'Công sửa chữa: báo giá tại chỗ trước khi làm', 'Vật tư thay thế tính riêng', 'Bảo hành công 7 ngày', VAT_LINE],
      },
      {
        id: 'tho-dien-lanh',
        serviceId: 75,
        name: 'Thợ điện lạnh',
        description: 'Vệ sinh, bơm gas, sửa máy lạnh / tủ lạnh',
        basePrice: 150000,
        includedKm: 0,
        perKmPrice: 0,
        extraStopPrice: 0,
        icon: 'mci:snowflake',
        infoLines: ['Phí gọi thợ (khảo sát): đ150.000', 'Vệ sinh máy lạnh treo tường: đ150.000/máy', 'Bơm gas: đ150.000 - đ350.000 tuỳ loại', 'Bảo hành công 15 ngày', VAT_LINE],
      },
      {
        id: 'tho-khoa',
        serviceId: 77,
        name: 'Thợ khoá',
        description: 'Mở khoá, thay ổ, làm chìa, khoá cửa cuốn',
        basePrice: 120000,
        includedKm: 0,
        perKmPrice: 0,
        extraStopPrice: 0,
        icon: Icons.lock,
        infoLines: ['Phí gọi thợ: đ120.000', 'Mở khoá cửa / xe: từ đ150.000', 'Thay ổ khoá: báo giá theo loại', 'Yêu cầu xuất trình giấy tờ chứng minh sở hữu', VAT_LINE],
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
