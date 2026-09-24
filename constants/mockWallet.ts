// Mock Ví / Tài khoản — chưa có backend, dùng cho services/wallet.ts (Figma: Tài khoản - Ví)
import type { WalletBalances, WalletTransaction } from '@/services/wallet';

/** Số dư khởi tạo. Figma hiển thị "đ24.000" cho Tài khoản chính; tài khoản thưởng để >0 cho demo Rút tiền. */
export const MOCK_BALANCES: WalletBalances = {
  main: 24000,
  reward: 120000,
};

const d = (y: number, m: number, day: number, h: number, min: number) => new Date(y, m - 1, day, h, min).getTime();

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-200411-000197466',
    type: 'withdraw',
    title: 'Rút tiền (từ Momo)',
    description: 'Rút tiền về tài khoản đăng ký',
    amount: -50000,
    status: 'success',
    createdAt: d(2020, 4, 11, 16, 45),
    code: '200411-000197466',
    source: 'Tài khoản ZuumViet',
    fee: 'Miễn phí',
    bank: { name: 'Momo', account: '0721000537860', holder: 'Nguyễn Văn A' },
  },
  {
    id: 'tx-200411-000197201',
    type: 'withdraw',
    title: 'Rút tiền (từ Momo)',
    description: 'Rút tiền về tài khoản đăng ký',
    amount: -60000,
    status: 'failed',
    failReason: 'Sai tài khoản momo',
    createdAt: d(2020, 4, 11, 14, 10),
    code: '200411-000197201',
    source: 'Tài khoản ZuumViet',
    fee: 'Miễn phí',
    bank: { name: 'Momo', account: '0721000537999', holder: 'Nguyễn Văn A' },
  },
  {
    id: 'tx-200411-000196870',
    type: 'trip',
    title: 'Chuyến đi 716-207-6712',
    description: 'Thanh toán chuyến đi',
    amount: -60000,
    status: 'success',
    createdAt: d(2020, 4, 11, 12, 30),
    code: '200411-000196870',
    source: 'Tài khoản chính',
    fee: 'Miễn phí',
  },
  {
    id: 'tx-200411-000196002',
    type: 'topup',
    title: 'Nạp tiền (từ Momo)',
    description: 'Nạp tiền vào tài khoản chính',
    amount: 50000,
    status: 'success',
    createdAt: d(2020, 4, 11, 9, 12),
    code: '200411-000196002',
    source: 'Ví MoMo',
    fee: 'Miễn phí',
    bank: { name: 'Momo', account: '0721000537860', holder: 'Nguyễn Văn A' },
  },
  {
    id: 'tx-200410-000195110',
    type: 'reward_transfer',
    title: 'Chuyển tiền thưởng về tài khoản',
    description: 'Chuyển từ tài khoản thưởng sang tài khoản chính',
    amount: 30000,
    status: 'success',
    createdAt: d(2020, 4, 10, 15, 0),
    code: '200410-000195110',
    source: 'Tài khoản thưởng',
    fee: 'Miễn phí',
  },
  {
    id: 'tx-200401-000190004',
    type: 'reward',
    title: 'Tiền thưởng cộng đồng tháng 3',
    description: 'Thưởng doanh thu cộng đồng',
    amount: 100000,
    status: 'success',
    createdAt: d(2020, 4, 1, 8, 0),
    code: '200401-000190004',
    source: 'ZuumViet',
    fee: 'Miễn phí',
  },
];
