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

export type DeliveryOrder = {
  id: number;
  status: number;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
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
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function saveSession(token: string, customer: CustomerProfile) {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.token, token],
    [STORAGE_KEYS.customer, JSON.stringify(customer)],
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.customer,
    STORAGE_KEYS.otpSession,
  ]);
}

export async function getStoredCustomer(): Promise<CustomerProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.customer);
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

  logout: () => clearSession(),
};

export const customerApi = {
  getProfile: (id: number) =>
    request<CustomerProfile>(`/site/customeraccounts/${id}`, { auth: true }),
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
