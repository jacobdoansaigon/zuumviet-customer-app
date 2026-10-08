// services/zuum.ts — MỘT cửa duy nhất gọi API ZuumViet (NestJS) cho app khách.
//
// - Client sinh tự động: services/zuum-api.ts (chép bằng scripts/sync-api-client.sh, KHÔNG sửa tay).
// - Phiên: { accessToken (15'), refreshToken (30 ngày, XOAY VÒNG mỗi lần làm mới) } lưu SecureStore (native) /
//   localStorage (web). Làm mới token chạy "single-flight": nhiều request cùng gặp 401 dùng chung MỘT lần gọi
//   /auth/refresh — gửi lại refresh token cũ sẽ bị server thu hồi cả phiên. Cặp token mới được lưu xong mới dùng.
// - Mọi request gửi kèm header x-device-id (mã thiết bị ổn định, cũng là :deviceId khi đăng ký push).
// - Lỗi luôn là ZuumApiError { status, code, message (tiếng Việt, hiện thẳng cho người dùng), details }.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createZuumClient,
  ZuumApiError,
  type ZuumCustomerEvents,
  type ZuumInput,
  type ZuumResponse,
  type ZuumRouteKey,
  type ZuumRoutes,
} from './zuum-api';

export { ZuumApiError };
export type { ZuumCustomerEvents, ZuumResponse, ZuumRoutes };

/** vd http://localhost:7100 — bắt buộc (app không còn chế độ demo) */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

export type AuthTokens = ZuumResponse<'POST /v1/public/auth/refresh'>;

// ---------------------------------------------------------------- lưu trữ token
const TOKENS_KEY = 'zv.customer.session'; // SecureStore chỉ nhận [A-Za-z0-9._-]
const DEVICE_ID_KEY = '@zv/customer/deviceId';

const tokenStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKENS_KEY) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(TOKENS_KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(TOKENS_KEY, value);
      } catch {
        /* hết quota / chế độ riêng tư — phiên chỉ còn trong bộ nhớ */
      }
      return;
    }
    await SecureStore.setItemAsync(TOKENS_KEY, value);
  },
  async remove(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKENS_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKENS_KEY);
  },
};

function isTokens(v: unknown): v is AuthTokens {
  if (!v || typeof v !== 'object') return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.accessToken === 'string' &&
    typeof t.refreshToken === 'string' &&
    typeof t.accessTokenExpiresAt === 'string' &&
    typeof t.refreshTokenExpiresAt === 'string'
  );
}

/** undefined = chưa đọc từ bộ nhớ máy; null = không có phiên */
let tokens: AuthTokens | null | undefined;
let tokensLoading: Promise<AuthTokens | null> | null = null;

async function loadTokens(): Promise<AuthTokens | null> {
  if (tokens !== undefined) return tokens;
  if (!tokensLoading) {
    tokensLoading = (async () => {
      let parsed: AuthTokens | null = null;
      try {
        const raw = await tokenStorage.get();
        const value: unknown = raw ? JSON.parse(raw) : null;
        parsed = isTokens(value) ? value : null;
      } catch {
        parsed = null;
      }
      // có thể đã đăng nhập xong trong lúc đang đọc → không ghi đè
      if (tokens === undefined) tokens = parsed;
      return tokens ?? null;
    })().finally(() => {
      tokensLoading = null;
    });
  }
  return tokensLoading;
}

/** Lưu cặp token mới (đăng nhập / đăng ký / làm mới) — ghi xong bộ nhớ máy rồi mới dùng */
export async function saveTokens(next: AuthTokens): Promise<void> {
  await tokenStorage.set(JSON.stringify(next));
  tokens = next;
}

export async function clearTokens(): Promise<void> {
  tokens = null;
  try {
    await tokenStorage.remove();
  } catch {
    /* ignore */
  }
}

const expired = (iso: string, skewMs = 0) => {
  const t = Date.parse(iso);
  return !Number.isFinite(t) || t - skewMs <= Date.now();
};

/** "Đã đăng nhập" = còn refresh token chưa hết hạn */
export async function hasSession(): Promise<boolean> {
  const t = await loadTokens();
  return !!t && !expired(t.refreshTokenExpiresAt);
}

// ---------------------------------------------------------------- sự kiện phiên
/** login: vừa đăng nhập/đăng ký · logout: người dùng đăng xuất · expired: hết phiên (làm mới token thất bại) */
export type SessionEvent = 'login' | 'logout' | 'expired';
const sessionListeners = new Set<(event: SessionEvent) => void>();

export function onSessionChange(listener: (event: SessionEvent) => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function emitSession(event: SessionEvent) {
  sessionListeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* listener tự lo lỗi của mình */
    }
  });
}

// ---------------------------------------------------------------- mã thiết bị
let deviceIdCache: string | null = null;
let deviceIdLoading: Promise<string> | null = null;

/** Mã thiết bị ổn định (sinh 1 lần rồi lưu) — header x-device-id + :deviceId khi đăng ký push */
export function getDeviceId(): Promise<string> {
  if (deviceIdCache) return Promise.resolve(deviceIdCache);
  if (!deviceIdLoading) {
    deviceIdLoading = (async () => {
      let id: string | null = null;
      try {
        id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      } catch {
        /* ignore */
      }
      if (!id) {
        const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        id = `${Platform.OS}-${Date.now().toString(36)}-${rand}`;
        try {
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        } catch {
          /* ignore — vẫn dùng mã trong phiên chạy này */
        }
      }
      deviceIdCache = id;
      return id;
    })().finally(() => {
      deviceIdLoading = null;
    });
  }
  return deviceIdLoading;
}

// ---------------------------------------------------------------- làm mới token (single-flight)
let refreshing: Promise<boolean> | null = null;
let lastRefreshAt = 0;

async function doRefresh(): Promise<boolean> {
  const current = await loadTokens();
  if (!current || expired(current.refreshTokenExpiresAt)) {
    await expireSession();
    return false;
  }
  try {
    const next = await client.call('POST /v1/public/auth/refresh', { body: { refreshToken: current.refreshToken } });
    await saveTokens(next);
    lastRefreshAt = Date.now();
    return true;
  } catch (e) {
    const err = toZuumError(e);
    // lỗi mạng / máy chủ: giữ phiên, báo lỗi cho request đang chờ; refresh token bị từ chối: hết phiên
    if (err.status === 0 || err.status >= 500 || err.status === 429) throw err;
    await expireSession();
    return false;
  }
}

/**
 * Làm mới token đúng MỘT lần cho mọi request đang gặp 401 cùng lúc. Vừa làm mới xong (≤ 5 giây) thì không làm lại
 * — request gửi bằng access token cũ chỉ cần thử lại bằng token mới.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  if (Date.now() - lastRefreshAt < 5000 && tokens) return Promise.resolve(true);
  refreshing = doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function expireSession(): Promise<void> {
  const had = !!tokens;
  await clearTokens();
  if (had) emitSession('expired');
}

/** Access token còn hạn (tự làm mới trước khi hết hạn 30 giây); null = chưa đăng nhập */
export async function getAccessToken(): Promise<string | null> {
  if (refreshing) await refreshing.catch(() => false);
  const t = await loadTokens();
  if (!t) return null;
  if (expired(t.accessTokenExpiresAt, 30_000)) {
    const ok = await refreshSession().catch(() => false);
    if (!ok) return tokens?.accessToken ?? null;
  }
  return tokens?.accessToken ?? null;
}

// ---------------------------------------------------------------- client + lỗi
const client = createZuumClient({
  baseUrl: API_BASE_URL,
  getAccessToken,
  onUnauthorized: refreshSession,
  headers: (): Record<string, string> => (deviceIdCache ? { 'x-device-id': deviceIdCache } : {}),
});

/** Lỗi bất kỳ → ZuumApiError (mất mạng: status 0, code "network") */
export function toZuumError(e: unknown): ZuumApiError {
  if (e instanceof ZuumApiError) return e;
  if (e instanceof SyntaxError) {
    return new ZuumApiError(502, 'bad_response', 'Máy chủ phản hồi không hợp lệ, vui lòng thử lại sau');
  }
  return new ZuumApiError(0, 'network', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại');
}

type CallArgs<K extends ZuumRouteKey> = {} extends ZuumInput<K> ? [input?: ZuumInput<K>] : [input: ZuumInput<K>];

/**
 * Gọi API: api('GET /v1/customer/orders/:id', { params: { id } }). Kiểu params/query/body/response lấy từ hợp đồng
 * sinh tự động. Ném ZuumApiError — hiện `errorMessage(e)` cho người dùng.
 */
export async function api<K extends ZuumRouteKey>(route: K, ...args: CallArgs<K>): Promise<ZuumResponse<K>> {
  if (!API_BASE_URL) {
    throw new ZuumApiError(0, 'config.missing_api_url', 'Ứng dụng chưa được cấu hình địa chỉ máy chủ (EXPO_PUBLIC_API_URL)');
  }
  await getDeviceId();
  try {
    return await client.call(route, ...args);
  } catch (e) {
    throw toZuumError(e);
  }
}

/** Câu báo lỗi cho người dùng: message của API (lỗi dữ liệu: lý do cụ thể đầu tiên) */
export function errorMessage(e: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  if (e instanceof ZuumApiError) {
    if (e.code === 'validation_failed' && e.details) {
      const first = Object.values(e.details).find((list) => list && list.length > 0)?.[0];
      if (first) return first;
    }
    return e.message || fallback;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/** e là ZuumApiError có code thuộc danh sách (so theo code, không dò chữ trong message) */
export function isApiError(e: unknown, ...codes: string[]): e is ZuumApiError {
  return e instanceof ZuumApiError && (codes.length === 0 || codes.includes(e.code));
}
