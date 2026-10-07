// Tiện ích cho "Hoạt động của tôi": map DeliveryOrder (BE) → ActivityOrder, nhãn/màu trạng thái, định dạng ngày & tiền
import { ORDER_STATUS, type DeliveryOrder } from '@/services/api';
import { Colors } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/mockBooking';
import { findOptionByServiceId, serviceNameById } from '@/services/serviceCatalog';
import { type IconName } from '@/components/ui';
import type {
  ActivityDriver,
  ActivityOrder,
  ActivityService,
  ActivityStop,
  ActivityStopStatus,
} from '@/constants/mockOrders';

export type ActivityFilter = 'all' | ActivityService;

/** Thứ tự đúng như lưới trang chủ (components/home/ServiceCard.tsx) — đủ 9 danh mục, không gộp
 *  chung "Đặt xe" nữa. Nhãn/icon lấy thẳng từ SERVICE_GROUPS để không phải khai trùng ở 2 nơi. */
const ACTIVITY_SERVICE_ORDER: ActivityService[] = ['bike', 'car', 'intercity', 'delivery', 'transport', 'rental', 'driver', 'handyman', 'labor'];

export const ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  ...ACTIVITY_SERVICE_ORDER.map((key) => ({ label: SERVICE_GROUPS[key].title, value: key as ActivityFilter })),
];

/** Nhãn chi tiết theo từng trạng thái BE (giữ nguyên mapping của màn Đơn hàng cũ) */
export const STATUS_LABEL: Record<number, string> = {
  [ORDER_STATUS.NEW]: 'Mới',
  [ORDER_STATUS.ASSIGNING]: 'Đang tìm tài xế',
  [ORDER_STATUS.ACCEPTED]: 'Tài xế đã nhận',
  [ORDER_STATUS.BOARDED]: 'Đã đến lấy',
  [ORDER_STATUS.PICKED]: 'Đã lấy hàng',
  [ORDER_STATUS.STARTED]: 'Bắt đầu',
  [ORDER_STATUS.DELIVERING]: 'Đang giao',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.FAIL]: 'Thất bại',
  [ORDER_STATUS.CUSTOMER_CANCELLED]: 'Bạn đã huỷ',
  [ORDER_STATUS.DRIVER_CANCELLED]: 'Tài xế huỷ',
};

export function isActiveStatus(status: number) {
  return status >= ORDER_STATUS.NEW && status <= ORDER_STATUS.DELIVERING;
}

export function isCancelledStatus(status: number) {
  return (
    status === ORDER_STATUS.CUSTOMER_CANCELLED ||
    status === ORDER_STATUS.DRIVER_CANCELLED ||
    status === ORDER_STATUS.FAIL
  );
}

export function isCompletedStatus(status: number) {
  return status === ORDER_STATUS.COMPLETED;
}

/** Trạng thái tím 11px trên card "Đang trên đường" */
export function activeStatusLabel(status: number) {
  if (status <= ORDER_STATUS.ASSIGNING) return 'Đang tìm tài xế';
  if (status <= ORDER_STATUS.BOARDED) return 'Tài xế đang đến';
  return 'Đang trong chuyến';
}

/** Trạng thái 11px trên card lịch sử ("Huỷ chuyến" đỏ khi huỷ) */
export function historyStatusLabel(status: number) {
  if (status === ORDER_STATUS.COMPLETED) return 'Hoàn thành';
  if (status === ORDER_STATUS.FAIL) return 'Giao thất bại';
  if (isCancelledStatus(status)) return 'Huỷ chuyến';
  return STATUS_LABEL[status] ?? `Trạng thái ${status}`;
}

export function statusColor(status: number) {
  if (status === ORDER_STATUS.COMPLETED) return Colors.successDark;
  if (isCancelledStatus(status)) return Colors.error;
  if (status >= ORDER_STATUS.ACCEPTED && status <= ORDER_STATUS.DELIVERING) return Colors.primary;
  if (isActiveStatus(status)) return Colors.primary;
  return Colors.warning;
}

export function serviceIcon(service: ActivityService): IconName {
  return SERVICE_GROUPS[service].icon;
}

export function filterOrders(orders: ActivityOrder[], filter: ActivityFilter) {
  if (filter === 'all') return orders;
  return orders.filter((o) => o.service === filter);
}

// ── Định dạng ngày giờ ────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Hôm nay" / "Hôm qua" / "Ngày mai" / "04/05/2020" */
export function formatDayLabel(ms: number) {
  const today = startOfDay(Date.now());
  const diffDays = Math.round((startOfDay(ms) - today) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === -1) return 'Hôm qua';
  if (diffDays === 1) return 'Ngày mai';
  return formatDate(ms);
}

/** "04/05/2020" */
export function formatDate(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "12:19pm" */
export function formatTime12(ms: number) {
  const d = new Date(ms);
  const h = d.getHours();
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(d.getMinutes())}${suffix}`;
}

/** "09:14" */
export function formatTime24(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Tiêu đề màn chi tiết: "08/09/2019 - 7:19pm" */
export function formatDateTimeTitle(ms: number) {
  return `${formatDate(ms)} - ${formatTime12(ms)}`;
}

/** Dòng đậm trên card đang chạy: "03/10/2020 | 09:14" */
export function formatDateBar(ms: number) {
  return `${formatDate(ms)} | ${formatTime24(ms)}`;
}

// ── Định dạng tiền ────────────────────────────────────────────────────
/** 93000 → "93.000" */
export function formatVnd(n: number) {
  const abs = Math.abs(Math.round(n));
  const s = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-${s}` : s;
}

/** 93000 → "93k", 1500000 → "1.5tr", 500 → "500đ" */
export function formatShortVnd(n: number) {
  if (n >= 1000000) {
    const v = n / 1000000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}tr`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}k`;
  }
  return `${formatVnd(n)}đ`;
}

// ── Map dữ liệu BE → ActivityOrder ────────────────────────────────────
type Raw = Record<string, unknown>;

const str = (v: unknown): string | undefined => {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
};

const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const obj = (v: unknown): Raw | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : undefined);

const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x): x is Raw => !!obj(x)) : []);

/** unix giây / ms / ISO → ms */
const toMs = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
    const parsed = Date.parse(v);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const first = <T>(...vals: (T | undefined)[]) => vals.find((v) => v !== undefined);

/**
 * Nhóm dịch vụ của đơn: ưu tiên map service_id thật → catalog (services/serviceCatalog.ts, đã tải sau đăng nhập);
 * chưa có catalog thì đoán theo tên dịch vụ BE trả kèm (nếu có) — thứ tự khớp từ khoá đặc trưng nhất trước.
 */
function detectService(raw: Raw): ActivityService {
  const mapped = findOptionByServiceId(num(raw.service_id) ?? 0);
  // 'car6' (nhóm cũ giữ để tương thích link) hiển thị chung với Xe hơi
  if (mapped) return mapped.service === 'car6' ? 'car' : mapped.service;
  const hint = [serviceNameById(num(raw.service_id) ?? 0), raw.service_type, raw.service, raw.vehicle_type, raw.service_name, raw.type]
    .map((v) => (typeof v === 'string' ? v : obj(v) ? str(obj(v)!.name) : undefined))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/(thợ|sửa chữa|handyman|electrician|plumber)/.test(hint)) return 'handyman';
  if (/(nhân công|bốc xếp|phụ hồ|lao động|giúp việc|sự kiện|\blabor\b|\bmover)/.test(hint)) return 'labor';
  if (/(dọn nhà|chuyển nhà|phòng trọ|căn hộ|nhà phố|\brental\b|\bmoving\b)/.test(hint)) return 'rental';
  if (/(lái thay|tài xế riêng|driver hire)/.test(hint)) return 'driver';
  if (/(đường dài|liên tỉnh|intercity|limousine|xe ghép|16 chỗ|29 chỗ|45 chỗ)/.test(hint)) return 'intercity';
  if (/(tải|truck|van|transport|cargo|bán tải)/.test(hint)) return 'transport';
  if (/(xe máy|scooter|motorbike|\bmoto\b)/.test(hint)) return 'bike';
  if (/(xe hơi|xe 4 chỗ|xe 6 chỗ|xe 7 chỗ|cao cấp|sedan|taxi|\bcar\b)/.test(hint)) return 'car';
  return 'delivery';
}

function detectServiceName(raw: Raw, service: ActivityService) {
  const mapped = findOptionByServiceId(num(raw.service_id) ?? 0);
  if (mapped) return mapped.option.name;
  const svc = obj(raw.service);
  const name = first(serviceNameById(num(raw.service_id) ?? 0) ?? undefined, str(raw.service_name), svc ? str(svc.name) : undefined);
  return name ?? SERVICE_GROUPS[service].title;
}

/** Trạng thái điểm giao theo DeliveryOrderDetail (NEW 1 · COMPLETED 3 · FAILED 5 · RETURNED 7) + trạng thái đơn */
function stopStatusFrom(v: unknown, orderStatus: number): ActivityStopStatus | undefined {
  const s = num(v);
  if (s === undefined) return undefined;
  if (s === 3 || s === 7) return 'done';
  if (s === 5) return 'failed';
  if (orderStatus >= ORDER_STATUS.COMPLETED && orderStatus < ORDER_STATUS.FAIL) return 'done';
  if (orderStatus >= ORDER_STATUS.DELIVERING) return 'delivering';
  if (orderStatus >= ORDER_STATUS.PICKED) return 'picked';
  return 'pending';
}

/** details[] của BE: {full_name, phone, wayout_address, status, ...} */
function mapStop(raw: Raw, fallbackTitle: string, orderStatus: number): ActivityStop {
  const address = first(str(raw.wayout_address), str(raw.address), str(raw.full_address));
  const name = first(str(raw.full_name), str(raw.name), str(raw.receiver_name));
  const phone = str(raw.phone);
  const title = name ? `${name}${phone ? ` · ${phone}` : ''}` : (address ?? fallbackTitle);
  return {
    title,
    address: address && address !== title ? address : undefined,
    status: stopStatusFrom(raw.status, orderStatus),
  };
}

/** enrichOrderData: driver{full_name, phone, avatar_url, rating} + driver_account_id (chỉ có khi đơn đã gán tài xế) */
function mapDriver(raw: Raw): ActivityDriver | undefined {
  const driverId = num(raw.driver_account_id) ?? 0;
  const d = obj(raw.driver);
  const name = d ? str(d.full_name) ?? str(d.fullname) : undefined;
  if (driverId <= 0 || !name) return undefined;
  const vehicle = d ? obj(d.vehicle) : undefined;
  return {
    id: String(driverId),
    name,
    avatar: d ? str(d.avatar_url) ?? null : null,
    rating: (d ? num(d.rating) : undefined) || 5,
    reviews: 0,
    plate: first(vehicle ? str(vehicle.license_plates) : undefined, d ? str(d.license_plate) : undefined) ?? '',
    vehicle: first(vehicle ? str(vehicle.name) : undefined, d ? str(d.vehicle_name) : undefined) ?? '',
  };
}

/** Chuyển DeliveryOrder từ /site/deliveryorders (getJsonDataForApp + enrichOrderData) sang cấu trúc hiển thị. */
export function mapDeliveryOrder(order: DeliveryOrder): ActivityOrder {
  const raw = order as Raw;
  const service = detectService(raw);
  const status = Number(order.status) || ORDER_STATUS.NEW;
  const pickupName = str(raw.pickup_fullname);
  const pickupAddress = str(raw.pickup_address);
  const pickup: ActivityStop = {
    title: pickupName ? `${pickupName}${str(raw.pickup_phone) ? ` · ${str(raw.pickup_phone)}` : ''}` : (pickupAddress ?? 'Điểm lấy hàng'),
    address: pickupName ? pickupAddress : undefined,
    status: status >= ORDER_STATUS.PICKED ? 'picked' : 'pending',
  };

  const details = arr(raw.details);
  const dropoffs: ActivityStop[] = details.length ? details.map((s, i) => mapStop(s, `Điểm giao ${i + 1}`, status)) : [{ title: 'Điểm giao hàng' }];

  const total = num(raw.price_final) ?? 0;
  const tip = num(raw.price_tip) ?? 0;
  // PAYMENT_METHOD_WALLET = 1, CASH = 3
  const wallet = num(raw.payment_method) === 1;
  const pickupDate = num(raw.pickup_date) ?? 0;

  return {
    id: String(order.id),
    code: `#${order.id}`,
    service,
    serviceName: detectServiceName(raw, service),
    status,
    createdAt: toMs(raw.date_created) ?? Date.now(),
    scheduledAt: pickupDate > 0 ? pickupDate * 1000 : undefined,
    pickup,
    dropoffs,
    driver: mapDriver(raw),
    payment: {
      method: wallet ? 'wallet' : 'cash',
      methodLabel: wallet ? 'Tài khoản' : 'Tiền mặt',
      tip,
      total,
    },
    note: str(raw.note),
    // Đánh giá của khách cho đơn này nằm ở zv-driver (driverreviews) — chưa gộp vào JSON đơn → ratingStore giữ cục bộ
    rating: undefined,
  };
}
