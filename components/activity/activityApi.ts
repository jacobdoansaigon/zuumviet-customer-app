// Lấy dữ liệu "Hoạt động" từ orderApi (BE thật) — fallback sang mock khi API lỗi/rỗng (chỉ __DEV__)
import { orderApi, ApiError } from '@/services/api';
import { MOCK_ORDERS, type ActivityOrder } from '@/constants/mockOrders';
import { mapDeliveryOrder } from './orderUtils';

export type ActivitySource = 'api' | 'mock';

export type ActivityListResult = {
  orders: ActivityOrder[];
  source: ActivitySource;
  /** thông báo lỗi API (nếu có) — vẫn có thể kèm mock khi dev */
  error?: string;
};

const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.status ? `${e.message} (HTTP ${e.status})` : e.message;
  if (e instanceof Error) return e.message;
  return 'Không tải được danh sách chuyến đi';
}

export async function fetchActivityOrders(): Promise<ActivityListResult> {
  try {
    const res = await orderApi.getOrders();
    const items = (res?.items ?? []).map(mapDeliveryOrder);
    if (items.length === 0 && IS_DEV) {
      return { orders: MOCK_ORDERS, source: 'mock' };
    }
    return { orders: items, source: 'api' };
  } catch (e) {
    const error = errorMessage(e);
    if (IS_DEV) return { orders: MOCK_ORDERS, source: 'mock', error };
    return { orders: [], source: 'api', error };
  }
}

export async function fetchActivityOrder(id: string): Promise<ActivityOrder | null> {
  const fromMock = () => MOCK_ORDERS.find((o) => o.id === id) ?? null;
  // id của mock không tồn tại trên BE → trả mock ngay, tránh gọi API vô ích
  if (IS_DEV && fromMock()) return fromMock();
  try {
    const raw = await orderApi.getOrderDetail(id);
    return raw && raw.id != null ? mapDeliveryOrder(raw) : IS_DEV ? fromMock() : null;
  } catch {
    return IS_DEV ? fromMock() : null;
  }
}
