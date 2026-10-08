// services/realtime.ts — kết nối Socket.IO namespace /customer (một kết nối cho cả app).
// Bắt tay bằng access token (auth callback lấy token mới nhất mỗi lần kết nối lại). Server từ chối → `auth_error`
// rồi ngắt → làm mới token (single-flight, services/zuum.ts) và kết nối lại. Sự kiện chỉ là "gợi ý":
// màn hình luôn tải lại dữ liệu REST khi nhận sự kiện và mỗi lần (re)connect (`ready`).
import { AppState } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL, getAccessToken, refreshSession, type ZuumCustomerEvents } from '@/services/zuum';

export type RealtimeEvent = keyof ZuumCustomerEvents;
export type RealtimeHandler<E extends RealtimeEvent> = (payload: ZuumCustomerEvents[E]) => void;

type ListenEvents = { [E in RealtimeEvent]: (payload: ZuumCustomerEvents[E]) => void };
type CustomerSocket = Socket<ListenEvents, Record<string, never>>;
type Registry = { [E in RealtimeEvent]: Set<RealtimeHandler<E>> };

const registry: Registry = {
  'order.updated': new Set(),
  'partner.location': new Set(),
  'notification.new': new Set(),
  'wallet.updated': new Set(),
  ready: new Set(),
  auth_error: new Set(),
};

function dispatch<E extends RealtimeEvent>(event: E, payload: ZuumCustomerEvents[E]) {
  const set: Set<RealtimeHandler<E>> = registry[event];
  set.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      /* handler tự lo lỗi */
    }
  });
}

/** Nghe 1 sự kiện realtime (kể cả `ready` = vừa kết nối/kết nối lại). Trả hàm huỷ. */
export function onRealtime<E extends RealtimeEvent>(event: E, handler: RealtimeHandler<E>): () => void {
  const set: Set<RealtimeHandler<E>> = registry[event];
  set.add(handler);
  return () => {
    set.delete(handler);
  };
}

// ---------------------------------------------------------------- gợi ý từ push (khi socket chưa kịp kết nối)
const orderHintListeners = new Set<(orderId: string) => void>();

/** Push về đơn `orderId` tới lúc app đang mở → màn theo dõi tải lại ngay (socket có thể đang kết nối lại) */
export function emitOrderHint(orderId: string) {
  orderHintListeners.forEach((l) => l(orderId));
}

export function onOrderHint(listener: (orderId: string) => void): () => void {
  orderHintListeners.add(listener);
  return () => {
    orderHintListeners.delete(listener);
  };
}

// ---------------------------------------------------------------- kết nối
let socket: CustomerSocket | null = null;
let authRetries = 0;
let appStateSub: { remove: () => void } | null = null;

export function isRealtimeConnected(): boolean {
  return !!socket?.connected;
}

/** Mở kết nối (gọi khi đã đăng nhập; gọi lại nhiều lần không sao) */
export function connectRealtime() {
  if (socket || !API_BASE_URL) return;
  const s: CustomerSocket = io(`${API_BASE_URL}/customer`, {
    transports: ['websocket'],
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30_000,
    auth: (cb) => {
      getAccessToken()
        .then((token) => cb({ token: token ?? '' }))
        .catch(() => cb({ token: '' }));
    },
  });
  s.on('ready', (p) => {
    authRetries = 0;
    dispatch('ready', p);
  });
  s.on('auth_error', (p) => {
    dispatch('auth_error', p);
    // server ngắt ngay sau sự kiện này → làm mới token rồi tự kết nối lại (tối đa 2 lần liên tiếp)
    if (authRetries >= 2) return;
    authRetries += 1;
    refreshSession()
      .then((ok) => {
        if (ok && socket === s) s.connect();
      })
      .catch(() => {
        setTimeout(() => {
          if (socket === s && !s.connected) s.connect();
        }, 15_000);
      });
  });
  s.on('order.updated', (p) => dispatch('order.updated', p));
  s.on('partner.location', (p) => dispatch('partner.location', p));
  s.on('notification.new', (p) => dispatch('notification.new', p));
  s.on('wallet.updated', (p) => dispatch('wallet.updated', p));
  socket = s;

  // quay lại app sau khi nền: hệ điều hành có thể đã cắt kết nối
  appStateSub?.remove();
  appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && socket && !socket.connected) socket.connect();
  });
}

/** Đóng kết nối (đăng xuất / hết phiên) */
export function disconnectRealtime() {
  appStateSub?.remove();
  appStateSub = null;
  const s = socket;
  socket = null;
  authRetries = 0;
  if (s) {
    s.removeAllListeners();
    s.disconnect();
  }
}
