// services/authFlow.ts — trạng thái luồng OTP (đăng nhập / đăng ký / quên passcode) giữa các màn auth.
// Lưu AsyncStorage để web tải lại trang (mất query) vẫn đi tiếp được. Không chứa token đăng nhập.
//   gửi OTP → { challengeId, resendAfter, debugCode? } → xác minh → verificationToken (dùng 1 lần, ~10 phút)
//   → đăng nhập OTP | đăng ký (needRegister) | đặt lại passcode (purpose reset_passcode).
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const KEY = '@zv/customer/authFlow';
let cache: AuthFlow | null = null;

export async function getAuthFlow(): Promise<AuthFlow | null> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
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
    await AsyncStorage.setItem(KEY, JSON.stringify(flow));
  } catch {
    /* ignore */
  }
  return flow;
}

export async function clearAuthFlow(): Promise<void> {
  cache = null;
  try {
    await AsyncStorage.removeItem(KEY);
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
