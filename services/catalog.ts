// services/catalog.ts — danh mục dịch vụ THẬT từ GET /v1/public/catalog (không cần đăng nhập).
// Nhóm theo `category` (khớp ServiceKey của app), trình bày theo `code` (constants/booking.ts SERVICE_PRESENTATION).
// Cache AsyncStorage 1 giờ để mở app hiện ngay; giá trên danh sách chỉ là ƯỚC TÍNH từ bảng giá catalog —
// giá tính tiền luôn là giá báo của POST /v1/customer/quotes.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from '@/services/store';
import { api, type ZuumResponse } from '@/services/zuum';
import { SERVICE_GROUPS, SERVICE_PRESENTATION, type ServiceKey } from '@/constants/booking';
import type { IconName } from '@/components/ui/Icon';

export type Catalog = ZuumResponse<'GET /v1/public/catalog'>;
export type CatalogService = Catalog['categories'][number]['services'][number];
export type CatalogAddon = CatalogService['addons'][number];
export type WeightTier = CatalogService['weightTiers'][number];

const CACHE_KEY = '@zv/customer/catalog';
const CACHE_TTL_MS = 3600 * 1000;

type CatalogCache = { fetchedAt: number; catalog: Catalog };

const catalogStore = createStore<Catalog | null>(null);
let fetchedAt = 0;
let inflight: Promise<Catalog> | null = null;

function isCatalog(v: unknown): v is Catalog {
  return !!v && typeof v === 'object' && Array.isArray((v as Catalog).categories);
}

async function readCache(): Promise<CatalogCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (v && typeof v === 'object' && isCatalog((v as CatalogCache).catalog)) return v as CatalogCache;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Tải catalog (dùng bản trong bộ nhớ / cache máy nếu còn mới). Mạng lỗi mà có cache cũ thì vẫn dùng cache cũ;
 * không có gì để dùng thì ném lỗi.
 */
export async function ensureCatalog(force = false): Promise<Catalog> {
  const current = catalogStore.get();
  if (current && !force && Date.now() - fetchedAt < CACHE_TTL_MS) return current;
  if (inflight) return inflight;
  inflight = (async () => {
    const cached = force ? null : await readCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      fetchedAt = cached.fetchedAt;
      catalogStore.set(cached.catalog);
      return cached.catalog;
    }
    try {
      const fresh = await api('GET /v1/public/catalog');
      fetchedAt = Date.now();
      catalogStore.set(fresh);
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt, catalog: fresh } satisfies CatalogCache));
      } catch {
        /* ignore */
      }
      return fresh;
    } catch (e) {
      const fallback = current ?? cached?.catalog ?? (await readCache())?.catalog;
      if (fallback) {
        catalogStore.set(fallback);
        return fallback;
      }
      throw e;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Hook catalog (null khi chưa tải) */
export function useCatalog(): Catalog | null {
  return catalogStore.use();
}

export function getCatalog(): Catalog | null {
  return catalogStore.get();
}

export function allServices(c: Catalog | null = catalogStore.get()): CatalogService[] {
  return c ? c.categories.flatMap((cat) => cat.services) : [];
}

export function findService(id: string | null | undefined, c: Catalog | null = catalogStore.get()): CatalogService | null {
  if (!id) return null;
  return allServices(c).find((s) => s.id === id) ?? null;
}

// ---------------------------------------------------------------- lựa chọn hiển thị
/** 1 dịch vụ catalog đã gắn icon/mô tả để hiện trong danh sách chọn */
export interface ServiceOptionView {
  id: string;
  code: string;
  group: ServiceKey;
  name: string;
  description: string;
  icon: IconName;
  paused: boolean;
  service: CatalogService;
  /** Thuê theo block giờ (pricing.basis = time_block): độ dài 1 block (phút); null = không theo block */
  blockMinutes: number | null;
  maxBlocks: number;
  workRules: string[];
}

export function toOptionView(s: CatalogService): ServiceOptionView {
  const p = SERVICE_PRESENTATION[s.code];
  const group = s.category;
  return {
    id: s.id,
    code: s.code,
    group,
    name: s.name,
    description: s.shortDescription?.trim() || p?.description || '',
    icon: p?.icon ?? SERVICE_GROUPS[group].icon,
    paused: s.status !== 'active',
    service: s,
    blockMinutes: s.pricing.basis === 'time_block' && s.pricing.blockMinutes > 0 ? s.pricing.blockMinutes : null,
    maxBlocks: p?.maxBlocks ?? 4,
    workRules: p?.workRules ?? [],
  };
}

/** Các dịch vụ của 1 nhóm theo thứ tự catalog */
export function optionsFor(group: ServiceKey, c: Catalog | null = catalogStore.get()): ServiceOptionView[] {
  const cat = c?.categories.find((x) => x.key === group);
  return cat ? cat.services.map(toOptionView) : [];
}

// ---------------------------------------------------------------- mô tả giá
const vnd = (n: number) => `đ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const km = (m: number) => `${Math.round((m / 1000) * 10) / 10}km`;

function durationLabel(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
  return `${minutes} phút`;
}

/** Các dòng "Thông tin dịch vụ" sinh từ bảng giá + luật của catalog (không viết tay giá) */
export function serviceInfoLines(s: CatalogService): string[] {
  const lines: string[] = [];
  const p = s.pricing;
  switch (p.basis) {
    case 'distance':
      lines.push(p.includedDistanceMeters > 0 ? `Giá mở cửa (${km(p.includedDistanceMeters)} đầu): ${vnd(p.baseFare)}` : `Giá mở cửa: ${vnd(p.baseFare)}`);
      if (p.perKmFare > 0) lines.push(`Mỗi km tiếp theo: ${vnd(p.perKmFare)}`);
      break;
    case 'flat_per_stop':
      lines.push(`Đồng giá từ ${vnd(s.fromPrice)} / điểm giao`);
      break;
    case 'fixed':
      lines.push(`Giá trọn gói: ${vnd(p.baseFare || s.fromPrice)}`);
      break;
    case 'time_block':
      lines.push(`${vnd(p.baseFare || s.fromPrice)} / block ${durationLabel(p.blockMinutes)}`);
      break;
  }
  if (s.weightTiers.length) {
    const extra = s.weightTiers.filter((t) => t.surcharge > 0);
    if (extra.length) lines.push(`Phụ phí cân nặng: ${extra.map((t) => `${t.label} +${vnd(t.surcharge)}`).join(', ')}`);
  }
  for (const a of s.addons) lines.push(`${a.name}: +${vnd(a.price)}`);
  if (s.rules.allowCod && s.rules.codMaxAmount > 0) lines.push(`Thu hộ (COD) tối đa ${vnd(s.rules.codMaxAmount)}`);
  if (s.rules.allowScheduling) {
    lines.push(
      s.rules.minScheduleLeadMinutes >= 60
        ? `Đặt trước tối thiểu ${durationLabel(s.rules.minScheduleLeadMinutes)}, tối đa ${s.rules.maxScheduleDays} ngày`
        : `Hẹn giờ trước tối đa ${s.rules.maxScheduleDays} ngày`,
    );
  }
  if (s.description?.trim()) lines.push(s.description.trim());
  lines.push('* Giá cuối cùng do ZuumViet báo ở bước xác nhận');
  return lines;
}

/**
 * Giá ƯỚC TÍNH cho danh sách chọn dịch vụ (trước khi báo giá thật): theo bảng giá catalog + quãng đường ước lượng.
 * Không gồm phụ phí vùng/khung giờ/hẻm — luôn hiện kèm dấu "~".
 */
export function estimatePrice(s: CatalogService, input: { distanceMeters: number; stopCount: number; durationMinutes?: number | null; weightSurcharge?: number }): number {
  const p = s.pricing;
  let fare: number;
  switch (p.basis) {
    case 'distance': {
      const extraKm = Math.max(0, Math.ceil((input.distanceMeters - p.includedDistanceMeters) / 1000));
      fare = p.baseFare + extraKm * p.perKmFare;
      break;
    }
    case 'flat_per_stop':
      fare = s.fromPrice * Math.max(1, input.stopCount);
      break;
    case 'time_block': {
      const blocks = p.blockMinutes > 0 && input.durationMinutes ? Math.max(1, Math.ceil(input.durationMinutes / p.blockMinutes)) : 1;
      fare = (p.baseFare || s.fromPrice) * blocks;
      break;
    }
    default:
      fare = p.baseFare || s.fromPrice;
  }
  return Math.max(s.fromPrice, fare) + (input.weightSurcharge ?? 0);
}
