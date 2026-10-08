// services/wallet.ts — Ví khách (một ví duy nhất): số dư / khả dụng / nợ phí huỷ (GET /v1/customer/wallet), lịch sử
// bút toán (GET /wallet/entries, phân trang), nạp tiền qua cổng thanh toán (POST /wallet/topups → mở paymentUrl →
// theo dõi GET /wallet/topups/:id + sự kiện realtime wallet.updated). Không có rút tiền / ví thưởng cho khách.
import { createStore } from '@/services/store';
import { onRealtime } from '@/services/realtime';
import { api, onSessionChange, type ZuumResponse } from '@/services/zuum';

export type WalletSummary = ZuumResponse<'GET /v1/customer/wallet'>;
export type WalletEntry = ZuumResponse<'GET /v1/customer/wallet/entries'>['items'][number];
export type WalletEntryType = WalletEntry['type'];
export type Topup = ZuumResponse<'POST /v1/customer/wallet/topups'>;
export type TopupProvider = Topup['provider'];

/** Giới hạn của server (packages/shared TOPUP_MIN / TOPUP_MAX) */
export const TOPUP_LIMITS = { min: 10_000, max: 50_000_000 } as const;

/** Chip số tiền gợi ý (Figma Nạp tiền) */
export const AMOUNT_PRESETS = [50000, 100000, 200000, 500000, 1000000];

export const ENTRY_TYPE_LABEL: Record<WalletEntryType, string> = {
  topup: 'Nạp tiền',
  order_hold: 'Giữ tiền đơn hàng',
  order_settle: 'Thanh toán đơn hàng',
  order_refund: 'Hoàn tiền đơn hàng',
  cancel_fee: 'Phí huỷ đơn',
  withdrawal_request: 'Yêu cầu rút tiền',
  withdrawal_paid: 'Rút tiền',
  withdrawal_rejected: 'Hoàn yêu cầu rút tiền',
  adjustment: 'Điều chỉnh',
  affiliate_accrual: 'Thưởng giới thiệu (tạm tính)',
  affiliate_payout: 'Thưởng giới thiệu',
  affiliate_forfeit: 'Thu hồi thưởng giới thiệu',
  intercity_hold: 'Giữ tiền vé xe',
  intercity_refund: 'Hoàn tiền vé xe',
  intercity_settle: 'Thanh toán vé xe',
};

export const PROVIDER_LABEL: Record<TopupProvider, string> = { vnpay: 'VNPay', mock: 'Cổng thử nghiệm' };

const store = createStore<WalletSummary | null>(null);
let inflight: Promise<WalletSummary> | null = null;

export function useWallet(): WalletSummary | null {
  return store.use();
}

/** Tải lại số dư (gộp các lần gọi trùng lúc) */
export function refreshWallet(): Promise<WalletSummary> {
  if (!inflight) {
    inflight = api('GET /v1/customer/wallet')
      .then((w) => {
        store.set(w);
        return w;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// bút toán đã tải (API không có GET 1 bút toán — màn chi tiết đọc lại từ đây)
const entryCache = new Map<string, WalletEntry>();

export async function listWalletEntries(page = 1, pageSize = 20) {
  const res = await api('GET /v1/customer/wallet/entries', { query: { page, pageSize } });
  res.items.forEach((e) => entryCache.set(e.id, e));
  return res;
}

export function getCachedEntry(id: string): WalletEntry | null {
  return entryCache.get(id) ?? null;
}

// link thanh toán chỉ trả về lúc tạo lần nạp (GET topups/:id trả paymentUrl null) → giữ lại để "mở lại trang thanh toán"
const paymentUrls = new Map<string, string>();

export async function createTopup(amount: number, provider: TopupProvider): Promise<Topup> {
  const t = await api('POST /v1/customer/wallet/topups', { body: { amount, provider } });
  if (t.paymentUrl) paymentUrls.set(t.id, t.paymentUrl);
  return t;
}

export function getTopup(id: string): Promise<Topup> {
  return api('GET /v1/customer/wallet/topups/:id', { params: { id } });
}

export function paymentUrlOf(topupId: string): string | null {
  return paymentUrls.get(topupId) ?? null;
}

// số dư đổi (nạp, giữ/hoàn tiền đơn…) → tải lại; đăng xuất → xoá
onRealtime('wallet.updated', () => {
  void refreshWallet().catch(() => undefined);
});
onSessionChange((event) => {
  if (event !== 'login') {
    store.set(null);
    entryCache.clear();
    paymentUrls.clear();
  }
});
