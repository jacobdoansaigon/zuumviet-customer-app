// services/authFlow.ts — trạng thái luồng OTP (đăng nhập / đăng ký / quên passcode) giữa các màn auth.
// Có verificationToken (cho phép đăng ký / đặt lại passcode trong ~10 phút) → lưu SecureStore (native) / localStorage (web)
// để web tải lại trang vẫn đi tiếp được; xoá khi xong luồng, khi bỏ dở (rời màn đăng ký / đặt lại) hoặc bắt đầu lại.
//   gửi OTP → { challengeId, resendAfter, debugCode? } → xác minh → verificationToken (dùng 1 lần, ~10 phút)
//   → đăng nhập OTP | đăng ký (needRegister) | đặt lại passcode (purpose reset_passcode).
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '@/services/zuum';

/** login: đăng nhập/đăng ký bằng OTP · reset: quên passcode */
export type AuthIntent = 'login' | 'reset';

export interface AuthFlow {
  /** SĐT người dùng gõ (server tự chuẩn hoá về +84…) */
  phone: string;
  intent: AuthIntent;
  challengeId: string;
  /** ISO — được gửi lại mã sau thời điểm này */
  resendAfter: string;
  /** chỉ có ở môi trường dev/test */
  debugCode: string | null;
  verificationToken: string | null;
  verificationExpiresAt: string | null;
}

const KEY = 'zv.customer.authFlow'; // SecureStore chỉ nhận [A-Za-z0-9._-]

const flowStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  },
  async remove(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};
let cache: AuthFlow | null = null;

export async function getAuthFlow(): Promise<AuthFlow | null> {
  if (cache) return cache;
  try {
    const raw = await flowStorage.get();
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (v && typeof v === 'object' && typeof (v as AuthFlow).challengeId === 'string' && typeof (v as AuthFlow).phone === 'string') {
      cache = v as AuthFlow;
    }
  } catch {
    /* ignore */
  }
  return cache;
}

async function saveAuthFlow(flow: AuthFlow): Promise<AuthFlow> {
  cache = flow;
  try {
    await flowStorage.set(JSON.stringify(flow));
  } catch {
    /* ignore */
  }
  return flow;
}

export async function clearAuthFlow(): Promise<void> {
  cache = null;
  try {
    await flowStorage.remove();
  } catch {
    /* ignore */
  }
}

/** Gửi (hoặc gửi lại) mã OTP */
export async function requestOtp(phone: string, intent: AuthIntent): Promise<AuthFlow> {
  const res = await api('POST /v1/public/customer/auth/otp/request', {
    body: { phone, purpose: intent === 'reset' ? 'reset_passcode' : 'login' },
  });
  return saveAuthFlow({
    phone,
    intent,
    challengeId: res.challengeId,
    resendAfter: res.resendAfter,
    debugCode: __DEV__ && res.debugCode ? res.debugCode : null,
    verificationToken: null,
    verificationExpiresAt: null,
  });
}

/** Xác minh mã → lưu verificationToken cho bước sau */
export async function verifyOtp(flow: AuthFlow, code: string): Promise<AuthFlow & { verificationToken: string }> {
  const res = await api('POST /v1/public/customer/auth/otp/verify', { body: { challengeId: flow.challengeId, code } });
  const next = { ...flow, verificationToken: res.verificationToken, verificationExpiresAt: res.expiresAt };
  await saveAuthFlow(next);
  return next;
}

/** verificationToken còn dùng được (chưa hết hạn) */
export function hasValidVerification(flow: AuthFlow | null): flow is AuthFlow & { verificationToken: string } {
  if (!flow?.verificationToken) return false;
  const exp = flow.verificationExpiresAt ? Date.parse(flow.verificationExpiresAt) : NaN;
  return !Number.isFinite(exp) || exp > Date.now();
}

/** Số giây còn phải chờ trước khi gửi lại mã */
export function secondsUntilResend(flow: AuthFlow | null): number {
  if (!flow) return 0;
  const t = Date.parse(flow.resendAfter);
  return Number.isFinite(t) ? Math.max(0, Math.ceil((t - Date.now()) / 1000)) : 0;
}
