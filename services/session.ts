// services/session.ts — đăng nhập / đăng xuất / hồ sơ khách (GET /v1/customer/me) trên nền services/zuum.ts.
// Token response không kèm hồ sơ → sau MỌI lần đăng nhập/đăng ký phải gọi /me. Hồ sơ cache AsyncStorage để mở app
// hiện ngay tên/SĐT, rồi làm mới nền.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from '@/services/store';
import {
  api,
  clearTokens,
  emitSession,
  getDeviceId,
  hasSession,
  onSessionChange,
  saveTokens,
  type AuthTokens,
  type ZuumResponse,
  type ZuumRoutes,
} from '@/services/zuum';

export type CustomerProfile = ZuumResponse<'GET /v1/customer/me'>;

const PROFILE_KEY = '@zv/customer/profile';

const profileStore = createStore<CustomerProfile | null>(null);

function isProfile(v: unknown): v is CustomerProfile {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.phone === 'string' && typeof p.fullName === 'string';
}

async function writeProfile(p: CustomerProfile | null) {
  profileStore.set(p);
  try {
    if (p) await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else await AsyncStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

/** Hồ sơ đã cache (đọc từ máy nếu chưa có trong bộ nhớ) */
export async function getProfile(): Promise<CustomerProfile | null> {
  const cur = profileStore.get();
  if (cur) return cur;
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (isProfile(v)) {
      profileStore.set(v);
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Hook hồ sơ hiện tại (null khi chưa tải / chưa đăng nhập) */
export function useProfile(): CustomerProfile | null {
  return profileStore.use();
}

/** Tải lại /me và cập nhật cache */
export async function refreshProfile(): Promise<CustomerProfile> {
  const me = await api('GET /v1/customer/me');
  await writeProfile(me);
  return me;
}

/** Cập nhật hồ sơ (họ tên, email, ảnh đại diện) */
export async function updateProfile(body: ZuumRoutes['PATCH /v1/customer/me']['body']): Promise<CustomerProfile> {
  const me = await api('PATCH /v1/customer/me', { body });
  await writeProfile(me);
  return me;
}

/** Còn phiên đăng nhập (refresh token chưa hết hạn) — kèm nạp hồ sơ cache */
export async function restoreSession(): Promise<boolean> {
  const ok = await hasSession();
  if (ok) await getProfile();
  return ok;
}

/** Vừa nhận token (đăng nhập OTP / passcode / đăng ký): lưu → /me → báo 'login' */
export async function completeLogin(t: AuthTokens): Promise<CustomerProfile> {
  await saveTokens(t);
  try {
    const me = await refreshProfile();
    emitSession('login');
    return me;
  } catch (e) {
    await clearTokens();
    throw e;
  }
}

async function bestEffort(p: Promise<unknown>, ms = 4000): Promise<void> {
  await Promise.race([p.catch(() => undefined), new Promise<void>((resolve) => setTimeout(resolve, ms))]);
}

/** Đăng xuất: gỡ thiết bị nhận push → thu hồi phiên → xoá dữ liệu phiên trên máy (2 bước đầu không bắt buộc thành công) */
export async function logout(): Promise<void> {
  const deviceId = await getDeviceId();
  await bestEffort(api('DELETE /v1/customer/devices/:deviceId', { params: { deviceId } }));
  await bestEffort(api('POST /v1/auth/logout'));
  await clearTokens();
  await writeProfile(null);
  emitSession('logout');
}

// hết phiên (refresh bị từ chối) → xoá hồ sơ cache
onSessionChange((event) => {
  if (event === 'expired') void writeProfile(null);
});

// ---------------------------------------------------------------- hiển thị
/** "+84901234567" → "0901 234 567" (SĐT server lưu dạng E.164) */
export function formatPhone(phone?: string | null): string {
  const raw = String(phone ?? '').trim();
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  else if (!digits.startsWith('0') && digits.length === 9) digits = `0${digits}`;
  if (digits.length === 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return digits || raw;
}

/** SĐT dạng nhập liệu trong nước: "+84901234567" → "0901234567" (điền sẵn ô SĐT người gửi/liên hệ) */
export function localPhone(phone?: string | null): string {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  else if (!digits.startsWith('0') && digits.length === 9) digits = `0${digits}`;
  return digits;
}

export function displayName(p?: CustomerProfile | null, fallback = 'Khách hàng'): string {
  return p?.fullName?.trim() || fallback;
}
