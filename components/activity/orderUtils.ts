// Tiện ích cho "Hoạt động của tôi": nhãn/màu trạng thái (trạng thái CHUỖI của API mới), lọc theo nhóm dịch vụ,
// định dạng ngày & tiền.
import { Colors } from '@/constants/theme';
import { SERVICE_GROUPS, type ServiceKey } from '@/constants/booking';
import { groupOfOrder, ORDER_STATUS_LABEL, type OrderListItem, type OrderStatus } from '@/services/orders';
import { type IconName } from '@/components/ui';

export type ActivityFilter = 'all' | ServiceKey;

/** Thứ tự đúng như lưới trang chủ (components/home/ServiceCard.tsx) */
const ACTIVITY_SERVICE_ORDER: ServiceKey[] = ['bike', 'car', 'intercity', 'delivery', 'transport', 'rental', 'driver', 'handyman', 'labor'];

export const ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  ...ACTIVITY_SERVICE_ORDER.map((key) => ({ label: SERVICE_GROUPS[key].title, value: key as ActivityFilter })),
];

/** Gợi ý nhãn đánh giá (Figma: 2x2 chips) — tốt / chưa tốt theo số sao */
export const RATING_TAGS_GOOD = ['Rất hài lòng', 'Đúng giờ', 'Chạy an toàn', 'Thái độ tốt'];
export const RATING_TAGS_BAD = ['Đến trễ', 'Thái độ chưa tốt', 'Lái xe ẩu', 'Xe không sạch sẽ'];

export function isCancelledStatus(status: OrderStatus) {
  return status === 'cancelled' || status === 'no_driver_found';
}

export function isCompletedStatus(status: OrderStatus) {
  return status === 'completed';
}

/** Trạng thái tím 11px trên card "Đang trên đường" */
export function activeStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'scheduled':
      return 'Đã hẹn giờ, chờ tới giờ đón';
    case 'searching':
      return 'Đang tìm tài xế';
    case 'assigned':
      return 'Tài xế đang đến';
    case 'arrived_pickup':
      return 'Tài xế đã đến';
    case 'picked_up':
      return 'Đang trong chuyến';
    default:
      return ORDER_STATUS_LABEL[status];
  }
}

/** Trạng thái 11px trên card lịch sử ("Huỷ chuyến" đỏ khi huỷ) */
export function historyStatusLabel(status: OrderStatus) {
  if (status === 'completed') return 'Hoàn thành';
  if (status === 'cancelled') return 'Huỷ chuyến';
  return ORDER_STATUS_LABEL[status];
}

export function statusColor(status: OrderStatus) {
  if (status === 'completed') return Colors.successDark;
  if (isCancelledStatus(status)) return Colors.error;
  return Colors.primary;
}

export function orderIcon(order: Pick<OrderListItem, 'service'>): IconName {
  return SERVICE_GROUPS[groupOfOrder(order.service)].icon;
}

export function filterOrders(orders: OrderListItem[], filter: ActivityFilter) {
  if (filter === 'all') return orders;
  return orders.filter((o) => groupOfOrder(o.service) === filter);
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
