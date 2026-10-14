// services/wallet.ts — Ví khách: ví chính (số dư / khả dụng / nợ phí huỷ — GET /v1/customer/wallet) + Ví thưởng
// (`bonus`: thưởng cộng đồng cộng vào mỗi sáng thứ Hai — lịch sử GET /wallet/bonus, chuyển sang ví chính
// POST /wallet/bonus/transfer kèm Idempotency-Key mới cho mỗi lần bấm). Lịch sử bút toán ví chính (GET /wallet/entries,
// phân trang), nạp tiền qua cổng thanh toán (POST /wallet/topups → mở paymentUrl → theo dõi GET /wallet/topups/:id + sự
// kiện realtime wallet.updated). Khách không rút tiền.
import { createStore } from '@/services/store';
import { onRealtime } from '@/services/realtime';
import { api, apiWithHeaders, onSessionChange, type ZuumResponse } from '@/services/zuum';

export type WalletSummary = ZuumResponse<'GET /v1/customer/wallet'>;
export type WalletEntry = ZuumResponse<'GET /v1/customer/wallet/entries'>['items'][number];
export type WalletEntryType = WalletEntry['type'];
export type BonusWallet = ZuumResponse<'GET /v1/customer/wallet/bonus'>;
export type BonusTransfer = ZuumResponse<'POST /v1/customer/wallet/bonus/transfer'>;
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
  affiliate_accrual: 'Thưởng cộng đồng',
  affiliate_payout: 'Thưởng cộng đồng',
  affiliate_forfeit: 'Điều chỉnh thưởng cộng đồng',
  intercity_hold: 'Giữ tiền vé xe',
  intercity_refund: 'Hoàn tiền vé xe',
  intercity_settle: 'Thanh toán vé xe',
  pass_purchase: 'Mua gói ngày',
  bonus_transfer: 'Chuyển ví thưởng',
};

/** Tiêu đề một dòng lịch sử: chuyển ví thưởng theo chiều tiền; thưởng tuần kèm số tuần (mô tả của API "… Tuần 42/2026 …") */
export function entryTitle(e: Pick<WalletEntry, 'type' | 'amount' | 'description'>): string {
  if (e.type === 'bonus_transfer') return e.amount < 0 ? 'Chuyển sang ví chính' : 'Nhận từ Ví thưởng';
  if (e.type === 'affiliate_payout') {
    const week = /Tuần (\d{1,2})\/(\d{4})/i.exec(e.description);
    return week ? `Thưởng cộng đồng tuần ${week[1]}/${week[2]}` : ENTRY_TYPE_LABEL.affiliate_payout;
  }
  return ENTRY_TYPE_LABEL[e.type];
}

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

// bút toán đã tải (API không có GET 1 bút toán — màn chi tiết đọc lại từ đây); id bút toán của Ví thưởng
const entryCache = new Map<string, WalletEntry>();
const bonusEntryIds = new Set<string>();

export async function listWalletEntries(page = 1, pageSize = 20) {
  const res = await api('GET /v1/customer/wallet/entries', { query: { page, pageSize } });
  res.items.forEach((e) => entryCache.set(e.id, e));
  return res;
}

export function getCachedEntry(id: string): WalletEntry | null {
  return entryCache.get(id) ?? null;
}

/** Bút toán thuộc Ví thưởng (đã tải ở màn Lịch sử Ví thưởng) */
export function isBonusEntry(id: string): boolean {
  return bonusEntryIds.has(id);
}

// ---------------------------------------------------------------- Ví thưởng
/** Số dư + lịch sử Ví thưởng (trang 1 cập nhật luôn số dư `bonus` trong store ví) */
export async function loadBonusWallet(page = 1, pageSize = 20): Promise<BonusWallet> {
  const res = await api('GET /v1/customer/wallet/bonus', { query: { page, pageSize } });
  res.entries.items.forEach((e) => {
    entryCache.set(e.id, e);
    bonusEntryIds.add(e.id);
  });
  if (page === 1) store.set((cur) => (cur && cur.bonus !== res.balance ? { ...cur, bonus: res.balance } : cur));
  return res;
}

/** Khoá idempotency cho MỘT lần bấm (server bỏ qua khoá < 8 ký tự) */
function newIdempotencyKey(): string {
  const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `bonus-${Date.now().toString(36)}-${rand}`;
}

/**
 * Chuyển TOÀN BỘ Ví thưởng sang ví chính (amount null = chuyển hết). Mỗi lần gọi một Idempotency-Key mới — client tự
 * thử lại (làm mới token) vẫn dùng cùng khoá nên không chuyển 2 lần. Cập nhật store ví từ kết quả, tải lại số dư, rồi đọc
 * đúng số đã chuyển từ lịch sử Ví thưởng (theo transactionId; không thấy thì dùng `expected` — số đang hiện khi bấm).
 * Lỗi: `bonus.empty` (ví thưởng trống), `bonus.insufficient`.
 */
export async function transferBonusToMain(expected: number): Promise<BonusTransfer & { amount: number }> {
  const res = await apiWithHeaders('POST /v1/customer/wallet/bonus/transfer', { 'Idempotency-Key': newIdempotencyKey() }, { body: { amount: null } });
  const w = res.wallet;
  if ('available' in w) store.set((cur) => (cur ? { ...cur, ...w } : cur));
  const [, history] = await Promise.all([refreshWallet().catch(() => null), loadBonusWallet(1, 10).catch(() => null)]);
  const entry = history?.entries.items.find((e) => e.transactionId === res.transactionId);
  return { ...res, amount: entry ? Math.abs(entry.amount) : expected };
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
    bonusEntryIds.clear();
    paymentUrls.clear();
  }
});
