// useRealtime — hook realtime cho màn hình + vòng đời kết nối cho root layout.
//   useRealtime('order.updated', (p) => …)   — handler luôn là bản mới nhất (không cần useCallback)
//   useRealtimeRefetch(load)                  — gọi lại `load` mỗi lần socket (re)connect (sự kiện có thể đã lỡ)
//   useRealtimeConnection()                   — root: mở khi đã đăng nhập, đóng khi đăng xuất / hết phiên
import { useEffect, useRef } from 'react';
import { connectRealtime, disconnectRealtime, onRealtime, type RealtimeEvent, type RealtimeHandler } from '@/services/realtime';
import { hasSession, onSessionChange } from '@/services/zuum';

export function useRealtime<E extends RealtimeEvent>(event: E, handler: RealtimeHandler<E>, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    return onRealtime(event, (payload) => ref.current(payload));
  }, [event, enabled]);
}

/** Tải lại dữ liệu mỗi khi kết nối realtime được thiết lập lại */
export function useRealtimeRefetch(load: () => void, enabled = true) {
  useRealtime('ready', () => load(), enabled);
}

export function useRealtimeConnection() {
  useEffect(() => {
    let alive = true;
    void hasSession().then((ok) => {
      if (alive && ok) connectRealtime();
    });
    const off = onSessionChange((event) => {
      if (event === 'login') connectRealtime();
      else disconnectRealtime();
    });
    return () => {
      alive = false;
      off();
      disconnectRealtime();
    };
  }, []);
}
