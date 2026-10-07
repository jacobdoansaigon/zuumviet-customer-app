// Lấy dữ liệu "Hoạt động" từ orderApi (BE thật). Chỉ rơi về mock khi app CHƯA cấu hình EXPO_PUBLIC_API_URL
// (chạy demo UI offline) — BE lỗi/rỗng thì hiện đúng lỗi/rỗng, không trộn dữ liệu mẫu nữa.
import { orderApi, ApiError } from '@/services/api';
import { ensureServiceCatalog } from '@/services/serviceCatalog';
import { MOCK_ORDERS, type ActivityOrder } from '@/constants/mockOrders';
import { mapDeliveryOrder } from './orderUtils';

export type ActivitySource = 'api' | 'mock';

export type ActivityListResult = {
  orders: ActivityOrder[];
  source: ActivitySource;
  /** thông báo lỗi API (nếu có) */
  error?: string;
};

const noApiConfigured = (e: unknown) => e instanceof ApiError && e.status === 0;

function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.status ? `${e.message} (HTTP ${e.status})` : e.message;
  if (e instanceof Error) return e.message;
  return 'Không tải được danh sách chuyến đi';
}

export async function fetchActivityOrders(): Promise<ActivityListResult> {
  try {
    // catalog để map service_id → nhóm/tên dịch vụ; lỗi catalog không chặn danh sách
    await ensureServiceCatalog().catch(() => null);
    const res = await orderApi.getOrders();
    const items = (res?.items ?? []).map(mapDeliveryOrder);
    return { orders: items, source: 'api' };
  } catch (e) {
    if (noApiConfigured(e)) return { orders: MOCK_ORDERS, source: 'mock', error: errorMessage(e) };
    return { orders: [], source: 'api', error: errorMessage(e) };
  }
}

export async function fetchActivityOrder(id: string): Promise<ActivityOrder | null> {
  const fromMock = () => MOCK_ORDERS.find((o) => o.id === id) ?? null;
  // id của mock (chỉ có khi đang chạy demo offline) không tồn tại trên BE → trả mock ngay
  if (fromMock()) return fromMock();
  try {
    await ensureServiceCatalog().catch(() => null);
    const raw = await orderApi.getOrderDetail(id);
    return raw && raw.id != null ? mapDeliveryOrder(raw) : null;
  } catch {
    return null;
  }
}
