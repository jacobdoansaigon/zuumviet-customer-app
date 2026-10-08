// useWalletBalance — ví khách (GET /v1/customer/wallet) cho Home / Hồ sơ / thanh toán: tải khi màn mở, tự cập nhật
// khi có sự kiện realtime wallet.updated (services/wallet.ts). Lỗi mạng → giữ số đã biết (không bao giờ hiện số mẫu).
import { useEffect } from 'react';
import { refreshWallet, useWallet, type WalletSummary } from '@/services/wallet';

/** Ví hiện tại (null khi chưa tải) */
export function useWalletSummary(): WalletSummary | null {
  const wallet = useWallet();
  useEffect(() => {
    void refreshWallet().catch(() => undefined);
  }, []);
  return wallet;
}

/** Số dư khả dụng của ví (0 khi chưa tải hoặc đang nợ) */
export function useWalletBalance(): number {
  return useWalletSummary()?.available ?? 0;
}
