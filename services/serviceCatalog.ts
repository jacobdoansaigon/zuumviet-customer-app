// services/serviceCatalog.ts — map option trong catalog app (constants/mockBooking.ts) sang id dịch vụ THẬT trên BE.
//
// Vì sao: id trong catalog (serviceId 1, 3, 5, 11...) là số đặt tạm lúc dựng UI, còn bảng `service` trên Railway
// được seed từ zv-api-railway/scripts/seed.php với id tự tăng (1..32). BE từ chối đơn có service_id không tồn tại
// → trước khi tạo đơn phải tải GET /site/services 1 lần rồi tra theo TÊN (seed đặt tên trùng đúng tên option).
// Nhóm "Tài xế lái thay" là ngoại lệ: option tên 'Xe máy'/'Xe hơi' (trùng tên nhóm Xe máy/Xe hơi chở khách)
// nên trên BE đặt là 'Tài xế lái thay - Xe máy' / 'Tài xế lái thay - Xe hơi'.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { serviceApi, type ServiceItem } from '@/services/api';
import { SERVICE_GROUPS, SERVICE_KEYS, type ServiceKey, type ServiceOptionDef } from '@/constants/mockBooking';

const CACHE_KEY = '@zv/customer/serviceCatalog';
const CACHE_TTL_MS = 6 * 3600 * 1000;

type CatalogCache = { fetchedAt: number; items: ServiceItem[] };

let items: ServiceItem[] | null = null;
let byName: Map<string, ServiceItem> = new Map();
let inflight: Promise<ServiceItem[]> | null = null;

const normalizeName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

function index(list: ServiceItem[]) {
  items = list;
  byName = new Map(list.map((s) => [normalizeName(String(s.name)), s]));
}

async function readCache(): Promise<CatalogCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogCache;
    return Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(list: ServiceItem[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), items: list } satisfies CatalogCache));
  } catch {
    /* ignore */
  }
}

/**
 * Tải danh sách dịch vụ thật (cần đã đăng nhập). Dùng cache trong CACHE_TTL_MS để không gọi lại mỗi lần đặt;
 * mạng lỗi mà còn cache cũ thì vẫn dùng cache. Ném lỗi khi không có gì để dùng.
 */
export async function ensureServiceCatalog(force = false): Promise<ServiceItem[]> {
  if (items && !force) return items;
  if (inflight) return inflight;
  inflight = (async () => {
    const cached = force ? null : await readCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && cached.items.length) {
      index(cached.items);
      return cached.items;
    }
    try {
      const res = await serviceApi.list();
      const list = (res?.items ?? []).filter((s) => Number(s.status) === 1 || s.status == null);
      if (!list.length) throw new Error('Danh sách dịch vụ trống');
      index(list);
      await writeCache(list);
      return list;
    } catch (e) {
      if (cached?.items.length) {
        index(cached.items);
        return cached.items;
      }
      throw e;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Tên dịch vụ trên BE tương ứng 1 option (xem chú thích đầu file về nhóm Tài xế lái thay) */
export function serverServiceName(service: ServiceKey, option: ServiceOptionDef): string {
  if (service === 'driver') return `Tài xế lái thay - ${option.name}`;
  return option.name;
}

/** id dịch vụ thật cho option; null khi catalog chưa tải hoặc BE chưa có dịch vụ cùng tên */
export function resolveServiceId(service: ServiceKey, option: ServiceOptionDef): number | null {
  if (!items) return null;
  const found = byName.get(normalizeName(serverServiceName(service, option)));
  return found ? Number(found.id) : null;
}

/** Tìm ngược: từ service_id của đơn trên BE → nhóm + option trong catalog (để màn theo dõi/hoạt động hiện đúng tên) */
export function findOptionByServiceId(serviceId: number): { service: ServiceKey; option: ServiceOptionDef } | null {
  if (!items) return null;
  const item = items.find((s) => Number(s.id) === serviceId);
  if (!item) return null;
  const wanted = normalizeName(String(item.name));
  for (const key of SERVICE_KEYS) {
    for (const option of SERVICE_GROUPS[key].options) {
      if (normalizeName(serverServiceName(key, option)) === wanted) return { service: key, option };
    }
  }
  return null;
}

/** Tên hiển thị của service_id (fallback khi không map được về catalog) */
export function serviceNameById(serviceId: number): string | null {
  const item = items?.find((s) => Number(s.id) === serviceId);
  return item ? String(item.name) : null;
}

export function getServiceCatalog(): ServiceItem[] | null {
  return items;
}
