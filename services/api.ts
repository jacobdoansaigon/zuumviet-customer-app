/**
 * ZuumViet Customer API client — paths khớp BE thật (zv-customer + zv-delivery)
 *
 * Headers bắt buộc:
 *   AppName: customer
 *   Authorization: <jwt>   (không dùng prefix "Bearer ")
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const STORAGE_KEYS = {
  token: '@zv/customer/token',
  customer: '@zv/customer/profile',
  otpSession: '@zv/customer/otpSession',
} as const;

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
}

export async function clearSession() {
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
    AppPlatform: 'iOS',
    AppVersion: '1.0.0',
    AppDeviceId: 'zuumcustomer-expo',
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

  /**
   * Đổi passcode (mật khẩu). TODO(BE): xác nhận path thật — hiện dùng
   * PUT /site/customeraccounts/changepassword ; màn hình fallback demo khi 404.
   */
  changePassword: (body: { old_password?: string; new_password: string }) =>
    request<{ success?: boolean }>('/site/customeraccounts/changepassword', {
      method: 'PUT',
      auth: true,
      body,
    }),

  logout: () => clearSession(),
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

  cancelOrder: (id: number | string, body: Record<string, unknown> = {}) =>
    request(`/site/deliveryorders/customercancel/${id}`, {
      method: 'PUT',
      auth: true,
      body,
    }),
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
