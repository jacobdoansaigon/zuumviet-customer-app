// Tiện ích cho "Hoạt động của tôi": map DeliveryOrder (BE) → ActivityOrder, nhãn/màu trạng thái, định dạng ngày & tiền
import { ORDER_STATUS, type DeliveryOrder } from '@/services/api';
import { Colors } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/mockBooking';
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
 * BE chưa có field "loại dịch vụ" cố định (schema /site/deliveryorders vẫn đang thay đổi) → đoán qua
 * vài field hay gặp. Thứ tự khớp: từ khoá đặc trưng nhất trước để đỡ nhận nhầm (vd "thợ điện" phải
 * khớp handyman trước khi rơi xuống delivery mặc định). Không có cách nào chắc chắn 100% cho tới khi
 * BE trả về đúng service_key khớp ServiceKey của app — xem constants/mockBooking.ts.
 */
function detectService(raw: Raw): ActivityService {
  const hint = [raw.service_type, raw.service, raw.vehicle_type, raw.service_name, raw.type]
    .map((v) => (typeof v === 'string' ? v : obj(v) ? str(obj(v)!.name) : undefined))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/(thợ|sửa chữa|handyman|electrician|plumber)/.test(hint)) return 'handyman';
  if (/(nhân công|bốc xếp|phụ hồ|lao động|\blabor\b|\bmover)/.test(hint)) return 'labor';
  if (/(dọn nhà|chuyển nhà|\brental\b|\bmoving\b)/.test(hint)) return 'rental';
  if (/(lái thay|tài xế riêng|driver hire)/.test(hint)) return 'driver';
  if (/(đường dài|liên tỉnh|intercity|limousine|xe ghép)/.test(hint)) return 'intercity';
  if (/(tải|tai|truck|van|transport|cargo)/.test(hint)) return 'transport';
  if (/(xe máy|scooter|motorbike|\bmoto\b)/.test(hint)) return 'bike';
  if (/(xe hơi|xe 4 chỗ|sedan|taxi|\bcar\b)/.test(hint)) return 'car';
  return 'delivery';
}

function detectServiceName(raw: Raw, service: ActivityService) {
  const svc = obj(raw.service);
  const name = first(str(raw.service_name), svc ? str(svc.name) : undefined, str(raw.service_type), str(raw.vehicle_type));
  return name ?? SERVICE_GROUPS[service].title;
}

function stopStatusFrom(v: unknown): ActivityStopStatus | undefined {
  const s = num(v);
  if (s === undefined) return undefined;
  if (s >= ORDER_STATUS.COMPLETED && s < ORDER_STATUS.FAIL) return 'done';
  if (s === ORDER_STATUS.FAIL) return 'failed';
  if (s >= ORDER_STATUS.DELIVERING) return 'delivering';
  if (s >= ORDER_STATUS.PICKED) return 'picked';
  return 'pending';
}

function mapStop(raw: Raw, fallbackTitle: string): ActivityStop {
  const address = first(str(raw.address), str(raw.full_address), str(raw.formatted_address));
  const title = first(str(raw.name), str(raw.title), str(raw.short_address), str(raw.receiver_name), address) ?? fallbackTitle;
  return {
    title,
    address: address && address !== title ? address : undefined,
    status: stopStatusFrom(raw.status),
  };
}

function mapDriver(raw: Raw): ActivityDriver | undefined {
  const d = obj(raw.driver) ?? obj(raw.driver_info);
  const name = first(d ? str(d.fullname) ?? str(d.full_name) ?? str(d.name) : undefined, str(raw.driver_name));
  if (!name) return undefined;
  const vehicle = d ? obj(d.vehicle) : undefined;
  return {
    id: first(d ? str(d.id) : undefined, str(raw.driver_id)) ?? name,
    name,
    avatar: d ? str(d.avatar) ?? str(d.avatar_url) ?? null : null,
    rating: first(d ? num(d.rating) ?? num(d.rate) : undefined, num(raw.driver_rating)) ?? 5,
    reviews: first(d ? num(d.reviews) ?? num(d.total_rating) : undefined) ?? 0,
    plate: first(d ? str(d.plate_number) ?? str(d.plate) ?? str(d.license_plate) : undefined, vehicle ? str(vehicle.plate_number) : undefined, str(raw.driver_plate)) ?? '',
    vehicle: first(vehicle ? str(vehicle.name) ?? str(vehicle.model) : undefined, d ? str(d.vehicle_name) : undefined) ?? '',
  };
}

/** Chuyển DeliveryOrder từ /site/deliveryorders sang cấu trúc hiển thị. Đọc field phòng thủ vì schema BE chưa cố định. */
export function mapDeliveryOrder(order: DeliveryOrder): ActivityOrder {
  const raw = order as Raw;
  const service = detectService(raw);
  const pickupRaw = obj(raw.pickup) ?? obj(raw.from) ?? obj(raw.sender);
  const pickupAddress = first(str(raw.pickup_address), str(raw.from_address), str(raw.sender_address));
  const pickup: ActivityStop = pickupRaw
    ? mapStop(pickupRaw, 'Điểm lấy hàng')
    : { title: pickupAddress ?? 'Điểm lấy hàng' };

  const stopsRaw = first(
    arr(raw.stops).length ? arr(raw.stops) : undefined,
    arr(raw.destinations).length ? arr(raw.destinations) : undefined,
    arr(raw.delivery_points).length ? arr(raw.delivery_points) : undefined,
    arr(raw.receivers).length ? arr(raw.receivers) : undefined
  );
  const dropoffAddress = first(str(raw.delivery_address), str(raw.to_address), str(raw.receiver_address));
  const dropoffs: ActivityStop[] = stopsRaw
    ? stopsRaw.map((s, i) => mapStop(s, `Điểm giao ${i + 1}`))
    : [{ title: dropoffAddress ?? 'Điểm giao hàng' }];

  const total = first(num(raw.total_fee), num(raw.total), num(raw.shipping_fee), num(raw.fee)) ?? 0;
  const tip = first(num(raw.tip), num(raw.tip_fee), num(raw.driver_tip)) ?? 0;
  const paymentHint = String(first(str(raw.payment_method), str(raw.payment_type)) ?? '').toLowerCase();
  const wallet = /(wallet|account|ví|tài khoản|momo)/.test(paymentHint);

  const ratingStars = first(num(raw.rating), num(raw.rate), num(raw.customer_rating));
  const status = Number(order.status) || ORDER_STATUS.NEW;

  return {
    id: String(order.id),
    code: first(str(raw.code), str(raw.order_code), str(raw.tracking_code)) ?? `#${order.id}`,
    service,
    serviceName: detectServiceName(raw, service),
    status,
    createdAt: first(toMs(raw.date_created), toMs(raw.created_at), toMs(raw.createdAt)) ?? Date.now(),
    scheduledAt: first(toMs(raw.schedule_time), toMs(raw.scheduled_at), toMs(raw.pickup_time)),
    pickup,
    dropoffs,
    driver: mapDriver(raw),
    payment: {
      method: wallet ? 'wallet' : 'cash',
      methodLabel: wallet ? 'Tài khoản' : 'Tiền mặt',
      tip,
      total,
    },
    note: first(str(raw.note), str(raw.notes), str(raw.customer_note)),
    rating:
      ratingStars && ratingStars > 0
        ? {
            stars: ratingStars,
            tags: Array.isArray(raw.rating_tags) ? (raw.rating_tags as unknown[]).map(String) : [],
            favorite: Boolean(raw.is_favorite_driver),
            blocked: Boolean(raw.is_blocked_driver),
          }
        : undefined,
  };
}
