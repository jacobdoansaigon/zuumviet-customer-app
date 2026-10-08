// constants/booking.ts — hằng số GIAO DIỆN của luồng đặt (nhãn theo loại dịch vụ, icon, nhóm trên lưới Home).
// Dịch vụ, giá, luật (COD, hẹn giờ, số điểm…), cân nặng, dịch vụ cộng thêm đều lấy từ GET /v1/public/catalog
// (services/catalog.ts) — file này KHÔNG chứa giá hay id dịch vụ.
import { Icons, type IconName } from '@/components/ui/Icon';

/** Khớp `category` của catalog API */
export type ServiceKey = 'delivery' | 'transport' | 'rental' | 'bike' | 'car' | 'intercity' | 'driver' | 'handyman' | 'labor';

export const SERVICE_KEYS: ServiceKey[] = ['delivery', 'transport', 'rental', 'bike', 'car', 'intercity', 'driver', 'handyman', 'labor'];

/** Chuỗi bất kỳ (param route, link cũ) → ServiceKey; nhóm cũ "car6" (Xe 6 chỗ) nay nằm trong Xe hơi */
export function toServiceKey(v: unknown): ServiceKey {
  if (v === 'car6') return 'car';
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
  trackingEta: 'Khoảng {eta} phút nữa Tài xế đến lấy hàng',
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
  trackingEta: 'Khoảng {eta} phút nữa Tài xế đến đón bạn',
  trackingDelivering: 'Đang di chuyển',
  trackingDone: 'Chuyến đi hoàn thành',
};

/** Dọn nhà: 2 địa chỉ (nhà cũ/nhà mới) nhưng không phải "giao hàng" — đổi hết nhãn cho đúng ngữ cảnh */
export const RENTAL_LABELS: ServiceLabels = {
  provider: 'Đội chuyển nhà',
  feeLabel: 'Cước dọn nhà',
  senderPlaceholder: 'Nhập thông tin nhà cũ',
  senderStatus: 'Đang đến lấy đồ',
  senderScreenTitle: 'Thông tin nhà cũ (điểm đi)',
  senderNameLabel: 'Họ và tên người liên hệ',
  senderPhonePlaceholder: 'Số điện thoại liên hệ',
  senderLocationTitle: 'Địa chỉ nhà cũ',
  senderLocationPlaceholder: 'Nhập địa chỉ nhà/căn hộ cũ',
  receiverPlaceholder: 'Nhập địa chỉ nhà mới',
  receiverAddPlaceholder: '+ Thêm địa chỉ nhà mới',
  receiverStatus: 'Đang chuyển đến',
  receiverScreenTitle: 'Thông tin nhà mới (điểm đến)',
  receiverLocationTitle: 'Địa chỉ nhà mới',
  receiverLocationPlaceholder: 'Nhập địa chỉ nhà/căn hộ mới',
  confirmTitle: 'Xác nhận dọn nhà',
  confirmHint: 'Vui lòng chọn địa chỉ nhà mới',
  stopUnit: 'điểm đến',
  mapPickupLabel: 'Nhà cũ',
  mapDropLabel: 'Nhà mới',
  trackingAccepted: 'Đội chuyển nhà đang đến',
  trackingEta: 'Khoảng {eta} phút nữa đội chuyển nhà đến nơi',
  trackingDelivering: 'Đang vận chuyển',
  trackingDone: 'Dọn nhà thành công',
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
  trackingEta: 'Khoảng {eta} phút nữa Thợ đến nơi',
  trackingDelivering: 'Đang thực hiện',
  trackingDone: 'Hoàn thành công việc',
};

/** Thuê nhân công: giống gọi thợ (1 địa điểm), đổi cách gọi "Nhân công" */
export const LABOR_LABELS: ServiceLabels = {
  ...ONSITE_LABELS,
  provider: 'Nhân công',
  feeLabel: 'Phí thuê nhân công',
  senderLocationTitle: 'Địa điểm làm việc',
  senderLocationPlaceholder: 'Nhập địa điểm cần nhân công',
  senderStatus: 'Địa điểm làm việc',
  confirmTitle: 'Xác nhận thuê nhân công',
  confirmHint: 'Vui lòng nhập địa điểm làm việc',
  trackingAccepted: 'Nhân công đang đến',
  trackingEta: 'Khoảng {eta} phút nữa Nhân công đến nơi',
  trackingDelivering: 'Đang làm việc',
  trackingDone: 'Hoàn thành công việc',
};

export interface ServiceGroupDef {
  key: ServiceKey;
  title: string;
  icon: IconName;
  kind: ServiceKind;
  labels: ServiceLabels;
  /** số điểm đến tối đa khi catalog chưa tải (thực tế dùng rules.maxStops của dịch vụ đang chọn) */
  maxStops: number;
}

export const SERVICE_GROUPS: Record<ServiceKey, ServiceGroupDef> = {
  delivery: { key: 'delivery', title: 'Giao hàng', icon: Icons.deliveryBike, kind: 'delivery', labels: DELIVERY_LABELS, maxStops: 10 },
  transport: { key: 'transport', title: 'Vận tải', icon: Icons.truck, kind: 'delivery', labels: DELIVERY_LABELS, maxStops: 5 },
  rental: { key: 'rental', title: 'Dọn nhà', icon: Icons.van, kind: 'delivery', labels: RENTAL_LABELS, maxStops: 1 },
  bike: { key: 'bike', title: 'Xe máy', icon: Icons.scooter, kind: 'ride', labels: RIDE_LABELS, maxStops: 1 },
  car: { key: 'car', title: 'Xe hơi', icon: Icons.carSide, kind: 'ride', labels: RIDE_LABELS, maxStops: 1 },
  driver: { key: 'driver', title: 'Tài xế lái thay', icon: Icons.steering, kind: 'ride', labels: RIDE_LABELS, maxStops: 1 },
  intercity: { key: 'intercity', title: 'Xe đường dài', icon: Icons.vanPassenger, kind: 'ride', labels: RIDE_LABELS, maxStops: 1 },
  handyman: { key: 'handyman', title: 'Gọi thợ', icon: Icons.tools, kind: 'onsite', labels: ONSITE_LABELS, maxStops: 0 },
  labor: { key: 'labor', title: 'Thuê nhân công', icon: Icons.hardHat, kind: 'onsite', labels: LABOR_LABELS, maxStops: 0 },
};

/**
 * Xe máy và Xe hơi cùng là "chở khách nội thành" → gộp chung 1 danh sách trong màn đặt xe
 * để đổi qua lại loại xe mà không phải thoát ra ngoài (giữ nguyên điểm đón/điểm đến đã chọn).
 */
export const URBAN_RIDE_KEYS: ServiceKey[] = ['bike', 'car'];

/**
 * Trình bày từng dịch vụ theo `code` của catalog (icon + mô tả ngắn khi catalog chưa có shortDescription,
 * quy tắc làm việc của Thuê nhân công). Dịch vụ mới thêm ở admin mà chưa có ở đây vẫn hiện bình thường với icon nhóm.
 */
export interface ServicePresentation {
  icon: IconName;
  description?: string;
  /** Thuê nhân công: số block tối đa cho chọn (mặc định 4) */
  maxBlocks?: number;
  workRules?: string[];
}

export const SERVICE_PRESENTATION: Record<string, ServicePresentation> = {
  'delivery-sieu-toc': { icon: Icons.deliveryBike, description: 'Giao hàng nội thành nhanh trong ngày' },
  'delivery-sieu-re': { icon: Icons.deliveryBike, description: 'Giao hàng tiết kiệm' },
  'delivery-dong-gia-25k': { icon: Icons.deliveryBike, description: 'Đồng giá theo điểm giao' },
  'transport-ban-tai': { icon: Icons.truck, description: 'Xe bán tải, hàng cồng kềnh' },
  'transport-tai-nho': { icon: Icons.truck, description: 'Xe tải nhỏ, chở đồ gia dụng' },
  'transport-tai-trung': { icon: Icons.truck, description: 'Xe tải trung, chuyển kho' },
  'rental-phong-tro': { icon: Icons.van, description: 'Phù hợp phòng trọ, ít đồ' },
  'rental-can-ho': { icon: Icons.truck, description: 'Phù hợp căn hộ' },
  'rental-nha-pho': { icon: Icons.truck, description: 'Nhà phố, văn phòng' },
  'bike-xe-may': { icon: Icons.scooter, description: 'Đón tận nơi, 1 hành khách' },
  'bike-xe-may-plus': { icon: Icons.scooter, description: 'Xe đời mới, tài xế đánh giá cao' },
  'car-xe-4-cho': { icon: Icons.carSide, description: 'Sedan / hatchback, tối đa 4 khách' },
  'car-xe-6-cho': { icon: Icons.carSeat, description: 'SUV / MPV, tối đa 6 khách' },
  'car-xe-7-cho': { icon: Icons.carSeat, description: 'Tối đa 7 khách' },
  'car-xe-cao-cap': { icon: Icons.luxuryCar, description: 'Xe sang đời mới' },
  'car-xe-6-cho-san-bay': { icon: Icons.carSeat, description: 'Đưa đón sân bay' },
  'driver-xe-may': { icon: Icons.scooter, description: 'Tài xế lái xe máy của bạn' },
  'driver-xe-hoi': { icon: Icons.carSide, description: 'Tài xế lái xe hơi của bạn' },
  'intercity-4-cho': { icon: Icons.carSide, description: 'Liên tỉnh, sedan 4 chỗ, đón tận nơi' },
  'intercity-7-cho': { icon: Icons.carSeat, description: 'SUV / MPV 7 chỗ' },
  'intercity-limousine-9': { icon: Icons.vanPassenger, description: 'Limousine 9 chỗ' },
  'intercity-16-cho': { icon: 'mci:bus', description: 'Xe 16 chỗ cho nhóm / gia đình' },
  'intercity-29-cho': { icon: 'mci:bus', description: 'Xe 29 chỗ cho đoàn' },
  'intercity-45-cho': { icon: 'mci:bus', description: 'Xe khách cỡ lớn' },
  'handyman-dien': { icon: Icons.flash, description: 'Chập điện, ổ cắm, đèn, quạt, CB' },
  'handyman-nuoc': { icon: 'mci:water-pump', description: 'Rò rỉ, tắc nghẽn, vòi sen, bồn cầu' },
  'handyman-dien-lanh': { icon: 'mci:snowflake', description: 'Vệ sinh, bơm gas máy lạnh / tủ lạnh' },
  'handyman-khoa': { icon: Icons.lock, description: 'Mở khoá, thay ổ, làm chìa' },
  'labor-boc-xep': {
    icon: Icons.hardHat,
    description: 'Khuân vác, sắp xếp kho',
    maxBlocks: 3,
    workRules: [
      'Có mặt tại điểm hẹn đúng giờ',
      'Nghỉ giải lao 10 phút sau mỗi 2 giờ làm việc liên tục',
      'Báo trước nếu hàng cồng kềnh, dễ vỡ hoặc ở tầng cao không có thang máy',
    ],
  },
  'labor-giup-viec': {
    icon: 'mci:broom',
    description: 'Dọn dẹp, lau nhà, giặt ủi',
    maxBlocks: 4,
    workRules: [
      'Khách chuẩn bị sẵn nước sạch, điện để nhân viên làm việc',
      'Công việc ngoài phạm vi đã đặt (vd trông trẻ, nấu ăn) cần thoả thuận thêm trước',
    ],
  },
  'labor-phu-ho': {
    icon: 'mci:shovel',
    description: 'Phụ việc xây dựng, sửa chữa',
    maxBlocks: 2,
    workRules: ['Khách cung cấp đầy đủ vật tư, dụng cụ thi công tại chỗ', 'Nhân công chỉ phụ việc, không chịu trách nhiệm kỹ thuật thi công chính'],
  },
  'labor-su-kien': {
    icon: 'mci:account-group-outline',
    description: 'Chạy bàn, tạp vụ, hỗ trợ sự kiện',
    maxBlocks: 3,
    workRules: ['Có mặt trước giờ sự kiện 30 phút để chuẩn bị'],
  },
};

/** Tiền tip: mỗi lần bấm + là 5.000đ */
export const TIP_STEP = 5000;

/** Dọn nhà: đồ đặc biệt cần báo trước cho đội bốc xếp (ghi vào ghi chú đơn) */
export const MOVING_BULKY_ITEMS: { id: string; label: string }[] = [
  { id: 'fridge', label: 'Tủ lạnh lớn' },
  { id: 'washer', label: 'Máy giặt' },
  { id: 'ac', label: 'Máy lạnh (cần tháo/lắp)' },
  { id: 'piano', label: 'Đàn piano/organ' },
  { id: 'safe', label: 'Tủ sắt / két sắt' },
  { id: 'fish_tank', label: 'Hồ cá / bể cá' },
  { id: 'plant', label: 'Cây cảnh lớn' },
  { id: 'other', label: 'Khác' },
];

/** Khung nhìn bản đồ mặc định khi chưa có vị trí nào (trung tâm TP.HCM) — chỉ để canh bản đồ, không phải địa chỉ */
export const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };

export type ViewOptionId = 'view' | 'view_check' | 'no_view';
export const VIEW_OPTIONS: { id: ViewOptionId; label: string }[] = [
  { id: 'view', label: 'Được xem hàng' },
  { id: 'view_check', label: 'Được xem và kiểm hàng' },
  { id: 'no_view', label: 'Không được xem hàng' },
];
