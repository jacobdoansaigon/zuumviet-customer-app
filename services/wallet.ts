// Wallet (Tài khoản) — MOCK API. Chưa có backend ví, mô phỏng số dư / lịch sử / nạp / rút
// với độ trễ nhỏ để UI có trạng thái loading. Dữ liệu giữ trong bộ nhớ (reset khi reload app).
import { MOCK_BALANCES, MOCK_TRANSACTIONS } from '@/constants/mockWallet';

export type WalletTransactionType = 'topup' | 'withdraw' | 'trip' | 'reward_transfer' | 'reward';
export type WalletTransactionStatus = 'success' | 'failed' | 'pending';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  /** tiêu đề dòng lịch sử: "Nạp tiền (từ Momo)" */
  title: string;
  /** mô tả ở màn chi tiết: "Rút tiền về tài khoản đăng ký" */
  description?: string;
  /** có dấu: + nạp/thưởng, - rút/chi */
  amount: number;
  status: WalletTransactionStatus;
  failReason?: string;
  createdAt: number;
  /** Mã giao dịch: "200411-000197466" */
  code: string;
  /** Nguồn tiền: "Tài khoản ZuumViet" */
  source: string;
  /** Phí giao dịch: "Miễn phí" */
  fee: string;
  bank?: { name: string; account: string; holder: string };
};

export type WalletBalances = { main: number; reward: number };

export type TopupSource = 'momo' | 'bank';
export type WithdrawDestination = 'momo' | 'main' | 'bank';

export type WalletOperationResult = {
  ok: boolean;
  message: string;
  transaction: WalletTransaction;
};

/** Giới hạn theo Figma: "Số tiền Nạp tối thiểu là 10.000đ - tối đa là 2.000.000đ" */
export const WALLET_LIMITS = { min: 10000, max: 2000000 } as const;

/** Chip số tiền gợi ý (Figma Nạp tiền) */
export const AMOUNT_PRESETS = [10000, 50000, 100000, 200000, 300000];

/** Nhập đúng số tiền này để demo màn "Trạng thái giao dịch" thất bại */
export const DEMO_FAIL_AMOUNT = 13000;

type Listener = () => void;

const state: { balances: WalletBalances; transactions: WalletTransaction[] } = {
  balances: { ...MOCK_BALANCES },
  transactions: [...MOCK_TRANSACTIONS],
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

/** Đăng ký nhận thay đổi số dư/lịch sử (trả về hàm huỷ) */
export function subscribeWallet(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

function nextCode(now: Date) {
  const yymmdd = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const seq = 197466 + state.transactions.length + Math.floor(Math.random() * 40);
  return `${yymmdd}-${pad(seq, 9)}`;
}

function pushTransaction(tx: WalletTransaction) {
  state.transactions = [tx, ...state.transactions];
  emit();
}

const SOURCE_LABEL: Record<TopupSource, string> = {
  momo: 'MoMo',
  bank: 'Chuyển khoản ngân hàng',
};

const DEST_LABEL: Record<WithdrawDestination, string> = {
  momo: 'MoMo',
  main: 'Tài khoản chính',
  bank: 'Chuyển khoản ngân hàng',
};

export const walletApi = {
  async getBalances(): Promise<WalletBalances> {
    await sleep(250);
    return { ...state.balances };
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    await sleep(350);
    return [...state.transactions].sort((a, b) => b.createdAt - a.createdAt);
  },

  async getTransaction(id: string): Promise<WalletTransaction | null> {
    await sleep(200);
    return state.transactions.find((t) => t.id === id) ?? null;
  },

  /** Nạp tiền vào Tài khoản chính */
  async topup(params: { amount: number; source: TopupSource }): Promise<WalletOperationResult> {
    await sleep(900);
    const now = new Date();
    const { amount, source } = params;
    const base: WalletTransaction = {
      id: `tx-${now.getTime()}`,
      type: 'topup',
      title: `Nạp tiền (từ ${SOURCE_LABEL[source]})`,
      description: 'Nạp tiền vào tài khoản chính',
      amount,
      status: 'success',
      createdAt: now.getTime(),
      code: nextCode(now),
      source: source === 'momo' ? 'Ví MoMo' : 'Ngân hàng',
      fee: 'Miễn phí',
      bank: source === 'momo' ? { name: 'Momo', account: '0721000537860', holder: 'Nguyễn Văn A' } : undefined,
    };

    let fail: string | null = null;
    if (source === 'bank') fail = 'Chuyển khoản ngân hàng sẽ hỗ trợ trong thời gian tới';
    else if (amount < WALLET_LIMITS.min || amount > WALLET_LIMITS.max) fail = 'Số tiền nạp không hợp lệ';
    else if (amount === DEMO_FAIL_AMOUNT) fail = 'Giao dịch bị từ chối bởi ví MoMo';

    if (fail) {
      const tx: WalletTransaction = { ...base, status: 'failed', failReason: fail };
      pushTransaction(tx);
      return { ok: false, message: fail, transaction: tx };
    }

    state.balances = { ...state.balances, main: state.balances.main + amount };
    pushTransaction(base);
    return {
      ok: true,
      message: 'Cám ơn bạn. Bạn đã nạp thành công từ ví MoMo. Chúc bạn có chuyến đi vui vẻ!',
      transaction: base,
    };
  },

  /** Rút tiền thưởng (về MoMo / Tài khoản chính) */
  async withdraw(params: { amount: number; destination: WithdrawDestination }): Promise<WalletOperationResult> {
    await sleep(900);
    const now = new Date();
    const { amount, destination } = params;
    const toMain = destination === 'main';
    const base: WalletTransaction = {
      id: `tx-${now.getTime()}`,
      type: toMain ? 'reward_transfer' : 'withdraw',
      title: toMain ? 'Chuyển tiền thưởng về tài khoản' : `Rút tiền (từ ${DEST_LABEL[destination]})`,
      description: toMain ? 'Chuyển từ tài khoản thưởng sang tài khoản chính' : 'Rút tiền về tài khoản đăng ký',
      amount: -amount,
      status: 'success',
      createdAt: now.getTime(),
      code: nextCode(now),
      source: 'Tài khoản thưởng',
      fee: 'Miễn phí',
      bank: destination === 'momo' ? { name: 'Momo', account: '0721000537860', holder: 'Nguyễn Văn A' } : undefined,
    };

    let fail: string | null = null;
    if (destination === 'bank') fail = 'Chuyển khoản ngân hàng sẽ hỗ trợ trong thời gian tới';
    else if (amount < WALLET_LIMITS.min) fail = 'Số tiền rút không hợp lệ';
    else if (amount > state.balances.reward) fail = 'Số dư tài khoản thưởng không đủ';
    else if (amount === DEMO_FAIL_AMOUNT) fail = 'Sai tài khoản momo';

    if (fail) {
      const tx: WalletTransaction = { ...base, status: 'failed', failReason: fail };
      pushTransaction(tx);
      return { ok: false, message: fail, transaction: tx };
    }

    state.balances = {
      main: toMain ? state.balances.main + amount : state.balances.main,
      reward: state.balances.reward - amount,
    };
    pushTransaction(base);
    return {
      ok: true,
      message: toMain
        ? 'Cám ơn bạn. Tiền thưởng đã được chuyển về tài khoản chính của bạn.'
        : 'Cám ơn bạn. Yêu cầu rút tiền thưởng về ví MoMo đã được xử lý thành công.',
      transaction: base,
    };
  },
};

export default walletApi;
