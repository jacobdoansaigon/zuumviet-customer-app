/**
 * ZuumViet Customer API client — paths khớp BE thật (zv-customer + zv-delivery + zv-service + zv-notify)
 *
 * Headers bắt buộc (framework checkAppHeader):
 *   AppName: customer · AppPlatform: iOS|Android|Web · AppVersion · AppDeviceId (duy nhất mỗi máy —
 *   BE dùng làm device id cho push) · AppLocale
 *   Authorization: <jwt>   (không dùng prefix "Bearer ")
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const STORAGE_KEYS = {
  token: '@zv/customer/token',
  customer: '@zv/customer/profile',
  otpSession: '@zv/customer/otpSession',
  deviceId: '@zv/customer/deviceId',
} as const;

const APP_PLATFORM = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
const APP_VERSION = String(Constants.expoConfig?.version ?? '1.0.0');

let deviceIdCache: string | null = null;

/**
 * Mã thiết bị ổn định cho header AppDeviceId — sinh 1 lần rồi lưu lại. BE (zv-notify) gắn push token
 * theo mã này, nên 2 máy không được trùng nhau (trước đây hardcode 1 chuỗi cho mọi máy).
 */
export async function getDeviceId(): Promise<string> {
  if (deviceIdCache) return deviceIdCache;
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  } catch {
    /* ignore */
  }
  if (!id && typeof localStorage !== 'undefined') {
    try {
      id = localStorage.getItem(STORAGE_KEYS.deviceId);
    } catch {
      /* ignore */
    }
  }
  if (!id) {
    const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    id = `${Platform.OS}-${Date.now().toString(36)}-${rand}`;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.deviceId, id);
    } catch {
      /* ignore */
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.deviceId, id);
      } catch {
        /* ignore */
      }
    }
  }
  deviceIdCache = id;
  return id;
}

/** VN: bỏ số 0 đầu nếu có (090x → 90x), chỉ giữ digits */
export function normalizePhoneVn(phone: string): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export type OtpSessionData = {
  phone: string;
  country_code: string;
  otp_id: number;
  otp_auth_code?: string;
  otp_group: string;
  otp_debug?: string;
  intent?: 'login' | 'register';
};

export type CustomerProfile = {
  id: number;
  fullname?: string;
  full_name?: string;
  phone?: string;
  country_code?: string;
  email?: string;
  online_status?: number;
  token?: string;
  [key: string]: unknown;
};

export type OtpSendResult = {
  id: number;
  group: string;
  auth_code: string;
  country_code: string;
  phone: string;
  date_created: number;
  otp_debug?: string;
};

export type OtpVerifyResult = {
  id: number;
  group: string;
  auth_code: string;
  country_code: string;
  phone: string;
  date_created: number;
};

export type LoginOtpResult =
  | (CustomerProfile & { token: string; need_register?: false })
  | {
      need_register: true;
      otp_id: number;
      otp_auth_code: string;
      otp_group: string;
      country_code: string;
      phone: string;
    };

export type LoginNeedRegister = Extract<LoginOtpResult, { need_register: true }>;
export type LoginSuccess = CustomerProfile & { token: string };

/** Kết quả loginotp yêu cầu đăng ký (SĐT chưa có tài khoản) */
export function isNeedRegister(r: LoginOtpResult): r is LoginNeedRegister {
  return !!r && typeof r === 'object' && 'need_register' in r && r.need_register === true;
}

/** Tên hiển thị của khách (BE trả full_name hoặc fullname) */
export function getDisplayName(c?: CustomerProfile | null, fallback = 'Khách hàng'): string {
  const n = (c?.full_name || c?.fullname || '').toString().trim();
  return n || fallback;
}

/** SĐT dạng hiển thị "+84 87654321" */
export function formatPhoneDisplay(phone?: string | null, countryCode = '84'): string {
  const p = normalizePhoneVn(String(phone ?? ''));
  if (!p) return '';
  return `+${countryCode} ${p}`;
}

export type DeliveryOrder = {
  id: number;
  status: number;
  [key: string]: unknown;
};

/** Dịch vụ thật trên BE (GET /site/services) — id dùng cho service_id khi tạo đơn */
export type ServiceItem = {
  id: number;
  name: string;
  type: number;
  transportation: number;
  image_url?: string;
  status: number;
};

/** Lý do huỷ (GET /site/servicecancelreasons) — BE bắt cancel_reason phải thuộc đúng service của đơn */
export type CancelReasonItem = {
  id: number;
  service_id: number;
  /** 1 = khách hàng, 3 = tài xế (theo Zuum\Rest\Account) */
  account_type: number;
  name: string;
  cost: number;
  proof: number;
};

/** Tiến trình tìm tài xế (GET /site/deliveryorderprocesses/last) */
export type OrderProcess = {
  id: number;
  order_id: number;
  radius: number;
  /** QUEUED 1 · SCANNING 3 · COMPLETED 5 · CANCELLED 7 (DeliveryOrderProcess) */
  status: number;
  date_expired: number;
  order?: { id: number; driver_account_id: number; status: number };
};

/** Các trạng thái đơn còn "đang chạy" (hiện banner chuyến đang đi trên Home) */
export const ACTIVE_ORDER_STATUSES: readonly number[] = [1, 3, 5, 7, 9, 11, 13];

export function isActiveOrder(o: DeliveryOrder): boolean {
  return ACTIVE_ORDER_STATUSES.includes(Number(o.status));
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

/**
 * true khi lỗi do chưa cấu hình API (EXPO_PUBLIC_API_URL trống) hoặc endpoint chưa có trên BE (404).
 * Các màn chưa có backend (hồ sơ, đổi passcode) dùng để fallback sang chế độ demo/local.
 */
export function isDemoFallbackError(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 0 || e.status === 404);
}

export function getErrorMessage(e: unknown, fallback = 'Có lỗi xảy ra trong quá trình'): string {
  if (e instanceof ApiError) return e.message || fallback;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function ensureBaseUrl() {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      'Thiếu EXPO_PUBLIC_API_URL — set URL Railway trong .env'
    );
  }
}

async function getToken(): Promise<string | null> {
  let t = await AsyncStorage.getItem(STORAGE_KEYS.token);
  if (!t && typeof localStorage !== 'undefined') {
    t = localStorage.getItem(STORAGE_KEYS.token);
  }
  return t;
}

export type SessionEvent = 'login' | 'logout';
const sessionListeners = new Set<(event: SessionEvent) => void>();

/** Nghe đăng nhập/đăng xuất (vd hooks/useNotifications đăng ký/huỷ thiết bị push với BE) */
export function addSessionListener(listener: (event: SessionEvent) => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function notifySession(event: SessionEvent) {
  sessionListeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* listener tự lo lỗi của mình */
    }
  });
}

export async function saveSession(token: string, customer: CustomerProfile) {
  const profile = JSON.stringify(customer);
  await AsyncStorage.setItem(STORAGE_KEYS.token, token);
  await AsyncStorage.setItem(STORAGE_KEYS.customer, profile);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.customer, profile);
    } catch {
      /* ignore quota */
    }
  }
  notifySession('login');
}

export async function clearSession() {
  // Báo trước khi xoá token để listener còn gọi được API huỷ thiết bị push (cần JWT)
  notifySession('logout');
  await AsyncStorage.removeItem(STORAGE_KEYS.token);
  await AsyncStorage.removeItem(STORAGE_KEYS.customer);
  await AsyncStorage.removeItem(STORAGE_KEYS.otpSession);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.customer);
      localStorage.removeItem(STORAGE_KEYS.otpSession);
    } catch {
      /* ignore */
    }
  }
}

export async function getStoredCustomer(): Promise<CustomerProfile | null> {
  let raw = await AsyncStorage.getItem(STORAGE_KEYS.customer);
  if (!raw && typeof localStorage !== 'undefined') {
    raw = localStorage.getItem(STORAGE_KEYS.customer);
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerProfile;
  } catch {
    return null;
  }
}

export async function saveOtpSession(data: OtpSessionData | Record<string, unknown>) {
  const phone = normalizePhoneVn(String((data as OtpSessionData).phone ?? ''));
  const payload = { ...data, phone };
  await AsyncStorage.setItem(STORAGE_KEYS.otpSession, JSON.stringify(payload));
}

export async function getOtpSession<T = OtpSessionData>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.otpSession);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  ensureBaseUrl();

  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    AppName: 'customer',
    AppPlatform: APP_PLATFORM,
    AppVersion: APP_VERSION,
    AppDeviceId: await getDeviceId(),
    AppLocale: 'vi',
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) {
      headers.Authorization = token;
    }
  }

  let url = `${BASE_URL}${path}`;
  if (options.query) {
    const qs = Object.entries(options.query)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const msg = (() => {
      if (typeof data === 'object' && data) {
        const err = (data as { error?: unknown; message?: unknown }).error
          ?? (data as { message?: unknown }).message;
        if (Array.isArray(err)) return err.join(', ');
        if (err != null) return String(err);
      }
      return `API ${response.status}`;
    })();
    throw new ApiError(response.status, msg, data);
  }

  return data as T;
}

const DEFAULT_COUNTRY = '84';

export const authApi = {
  sendOtp: (phone: string, otpGroup = 'otp_general', countryCode = DEFAULT_COUNTRY) =>
    request<OtpSendResult>('/site/customerotps', {
      method: 'POST',
      auth: false,
      body: {
        phone: normalizePhoneVn(phone),
        country_code: countryCode,
        otp_group: otpGroup,
      },
    }),

  verifyOtp: (params: {
    phone: string;
    otpId: number;
    otpCode: string;
    otpGroup?: string;
    countryCode?: string;
  }) =>
    request<OtpVerifyResult>('/site/customerotps/verify', {
      method: 'POST',
      auth: false,
      body: {
        phone: normalizePhoneVn(params.phone),
        country_code: params.countryCode ?? DEFAULT_COUNTRY,
        otp_group: params.otpGroup ?? 'otp_general',
        otp_id: params.otpId,
        otp_code: params.otpCode,
      },
    }),

  loginByOtp: (params: {
    phone: string;
    otpId: number;
    otpCode: string;
    otpAuthCode: string;
    otpGroup?: string;
    countryCode?: string;
  }) =>
    request<LoginOtpResult>('/site/customeraccounts/loginotp', {
      method: 'POST',
      auth: false,
      body: {
        phone: normalizePhoneVn(params.phone),
        country_code: params.countryCode ?? DEFAULT_COUNTRY,
        otp_group: params.otpGroup ?? 'otp_general',
        otp_id: params.otpId,
        otp_code: params.otpCode,
        otp_auth_code: params.otpAuthCode,
      },
    }),

  loginPassword: (phone: string, password: string, countryCode = DEFAULT_COUNTRY) =>
    request<CustomerProfile & { token: string }>('/site/customeraccounts/login', {
      method: 'POST',
      auth: false,
      body: {
        login_account: normalizePhoneVn(phone),
        login_password: password,
        country_code: countryCode,
      },
    }),

  register: (body: Record<string, unknown>) => {
    const phone = normalizePhoneVn(String(body.phone ?? ''));
    return request<CustomerProfile>('/site/customeraccounts', {
      method: 'POST',
      auth: false,
      body: { ...body, phone },
    });
  },

  checkExists: (phone: string, countryCode = DEFAULT_COUNTRY) =>
    request<{ id: number; phone: string; status: number }>('/site/customeraccounts/check', {
      method: 'POST',
      auth: false,
      body: { phone: normalizePhoneVn(phone), country_code: countryCode },
    }),

  /** Đổi passcode khi đã đăng nhập — BE bắt buộc có passcode cũ (CustomerAccounts::changePassword) */
  changePassword: (passwordOld: string, password: string) =>
    request<CustomerProfile>('/site/customeraccounts/changepassword', {
      method: 'POST',
      auth: true,
      body: { password_old: passwordOld, password, password_confirm: password },
    }),

  /**
   * Quên passcode: đặt passcode mới bằng phiên OTP vừa xác thực (CustomerAccounts::resetPassword —
   * route này vẫn cần JWT, app đã đăng nhập bằng loginotp trước khi tới bước này).
   */
  resetPassword: (params: { phone: string; otpId: number; otpAuthCode: string; otpGroup: string; password: string; countryCode?: string }) =>
    request<{ result: boolean }>('/site/customeraccounts/resetpassword', {
      method: 'POST',
      auth: true,
      body: {
        phone: normalizePhoneVn(params.phone),
        country_code: params.countryCode ?? DEFAULT_COUNTRY,
        otp_id: params.otpId,
        otp_auth_code: params.otpAuthCode,
        otp_group: params.otpGroup,
        password: params.password,
        password_confirm: params.password,
      },
    }),

  logout: () => clearSession(),
};

/** Dữ liệu tham chiếu từ zv-service (cần JWT) */
export const serviceApi = {
  /** Toàn bộ dịch vụ đang bật — app map theo tên sang option trong catalog (services/serviceCatalog.ts) */
  list: () =>
    request<{ total: number; items: ServiceItem[] }>('/site/services', {
      auth: true,
      query: { limit: 200 },
    }),

  /** Lý do huỷ của 1 dịch vụ, lọc theo phía khách (account_type 1) */
  cancelReasons: (serviceId: number, accountType = 1) =>
    request<{ total: number; items: CancelReasonItem[] }>('/site/servicecancelreasons', {
      auth: true,
      query: { service_id: serviceId, account_type: accountType, limit: 100 },
    }),
};

/** Đăng ký/huỷ thiết bị nhận push (zv-notify). Token Expo dạng ExponentPushToken[...] được BE gửi qua Expo Push API. */
export const deviceApi = {
  init: (pushToken: string, info: { screen_width?: number; screen_height?: number; device_name?: string; device_brand?: string; os?: string } = {}) =>
    request<{ id: number; device_id: string }>('/site/notifydevices/init', {
      auth: true,
      query: { push_tracker_id: pushToken, ...info },
    }),
  deinit: (pushToken: string) =>
    request<unknown>('/site/notifydevices/deinit', { auth: true, query: { push_tracker_id: pushToken } }),
};

/** Ghi đè profile đã lưu trong storage (giữ token hiện tại). */
export async function updateStoredCustomer(patch: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
  const current = await getStoredCustomer();
  if (!current) return null;
  const token = await getToken();
  const next = { ...current, ...patch } as CustomerProfile;
  await saveSession(token ?? String(current.token ?? ''), next);
  return next;
}

export const customerApi = {
  getProfile: (id: number) =>
    request<CustomerProfile>(`/site/customeraccounts/${id}`, { auth: true }),

  /** Cập nhật hồ sơ (họ tên, email, avatar). TODO(BE): xác nhận path PUT /site/customeraccounts/{id}. */
  updateProfile: (id: number, body: Partial<Pick<CustomerProfile, 'full_name' | 'email'>> & Record<string, unknown>) =>
    request<CustomerProfile>(`/site/customeraccounts/${id}`, {
      method: 'PUT',
      auth: true,
      body,
    }),
};

/** "Dán từ Zalo": gửi nguyên đoạn tin nhắn đã copy để BE gọi LLM tách tên/SĐT/địa chỉ/ghi chú. */
export interface ParsedAddress {
  name: string;
  phone: string;
  address: string;
  note: string;
}

export const addressParseApi = {
  parse: (text: string) =>
    request<ParsedAddress>('/site/addressparses', {
      method: 'POST',
      auth: true,
      body: { text },
    }),
};

export const orderApi = {
  getOrders: (status?: number) =>
    request<{ total: number; items: DeliveryOrder[] }>('/site/deliveryorders', {
      auth: true,
      query: status !== undefined ? { status } : undefined,
    }),

  createOrder: (body: Record<string, unknown>) =>
    request<DeliveryOrder>('/site/deliveryorders', {
      method: 'POST',
      auth: true,
      body,
    }),

  dryMode: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>('/site/deliveryorders/drymode', {
      method: 'POST',
      auth: true,
      body,
    }),

  getOrderDetail: (id: number | string) =>
    request<DeliveryOrder>(`/site/deliveryorders/${id}`, { auth: true }),

  /**
   * Bắt đầu tìm tài xế cho đơn vừa tạo. BE KHÔNG tự làm bước này: POST /site/deliveryorders chỉ lưu đơn
   * (NEW), còn tìm/đẩy đơn cho tài xế chỉ chạy khi có process (→ RabbitMQ → zv-queue → candidates → push).
   */
  startDriverSearch: (orderId: number | string) =>
    request<OrderProcess>(`/site/deliveryorderprocesses/${orderId}`, { method: 'POST', auth: true, body: {} }),

  /** Tiến trình tìm tài xế gần nhất của đơn (để biết đang quét / hết hạn chưa) */
  getLastProcess: (orderId: number | string) =>
    request<{ total: number; items: OrderProcess[] }>('/site/deliveryorderprocesses/last', {
      auth: true,
      query: { order_id: orderId },
    }),

  /**
   * Huỷ đơn phía khách. cancel_reason = id trong bảng service_cancel_reason của ĐÚNG service của đơn
   * (0 được phép khi chưa có tài xế — BE chỉ kiểm tra khi đã gán tài xế).
   */
  cancelOrder: (
    id: number | string,
    body: { cancel_reason: number; cancel_reason_text: string; cancel_reason_file_id_list?: number[]; lat: number; long: number },
  ) =>
    request<DeliveryOrder>(`/site/deliveryorders/customercancel/${id}`, {
      method: 'PUT',
      auth: true,
      body: { cancel_reason_file_id_list: [], ...body },
    }),
};

export const PROCESS_STATUS = { QUEUED: 1, SCANNING: 3, COMPLETED: 5, CANCELLED: 7 } as const;

/** Ví (zv-wallet). WALLET_MAIN = 1 (tài khoản chính), WALLET_BONUS = 3 (tài khoản thưởng) */
export const WALLET = { MAIN: 1, BONUS: 3 } as const;

export const walletRemoteApi = {
  balance: (wallet: number = WALLET.MAIN) =>
    request<{ balance_amount: number }>('/site/transactions/balance', { auth: true, query: { wallet } }),
};

export const ORDER_STATUS = {
  NEW: 1,
  ASSIGNING: 3,
  ACCEPTED: 5,
  BOARDED: 7,
  PICKED: 9,
  STARTED: 11,
  DELIVERING: 13,
  COMPLETED: 15,
  FAIL: 17,
  CUSTOMER_CANCELLED: 19,
  DRIVER_CANCELLED: 21,
} as const;
