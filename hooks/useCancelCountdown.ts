// useFreeCancelCountdown — đếm ngược thời gian huỷ miễn phí theo cancelFreeUntil của đơn (GET /v1/customer/orders/:id).
// Hết mốc → gọi onPassed 1 lần (màn gọi tải lại đơn để lấy cancelFeeIfNow mới). Không có mốc / đã qua → null.
import { useEffect, useRef, useState } from 'react';

/** Số mili-giây còn được huỷ miễn phí; null = không có mốc hoặc đã qua */
export function useFreeCancelCountdown(until: string | null | undefined, onPassed: () => void): number | null {
  const [now, setNow] = useState(() => Date.now());
  const passed = useRef(onPassed);
  passed.current = onPassed;

  useEffect(() => {
    if (!until) return;
    const end = Date.parse(until);
    setNow(Date.now());
    if (!(end > Date.now())) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= end) {
        clearInterval(t);
        passed.current();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [until]);

  if (!until) return null;
  const left = Date.parse(until) - now;
  return left > 0 ? left : null;
}

/** 95_000 → "01:35" */
export function mmss(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Đã qua mốc huỷ miễn phí nhưng đơn trong tay vẫn báo phí 0 (đọc trước mốc) → phí đang chờ cập nhật. Máy chủ chỉ trả
 * cancelFreeUntil khi đơn có phí huỷ, nên qua mốc thì chắc chắn sẽ có phí.
 */
export function cancelFeePending(order: { cancelFreeUntil: string | null; cancelFeeIfNow?: number }, freeLeftMs: number | null): boolean {
  return !!order.cancelFreeUntil && freeLeftMs == null && !(order.cancelFeeIfNow ?? 0);
}
