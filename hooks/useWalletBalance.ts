// useWalletBalance — số dư Tài khoản chính hiển thị trên Home / Hồ sơ, đồng bộ với màn Ví
// (services/wallet.ts phát sự kiện khi nạp/rút). Số dư mẫu chỉ khi app chưa cấu hình API; có API thì 0 trong lúc tải
// và giữ số thật gần nhất khi lỗi mạng (không bao giờ hiện số mẫu).
import { useEffect, useState } from 'react';
import { walletApi, subscribeWallet } from '@/services/wallet';
import { MOCK_WALLET } from '@/constants/mock';

const API_CONFIGURED = (process.env.EXPO_PUBLIC_API_URL ?? '') !== '';

export function useWalletBalance(): number {
  const [balance, setBalance] = useState<number>(API_CONFIGURED ? 0 : MOCK_WALLET.balance);

  useEffect(() => {
    let alive = true;
    const load = () => {
      walletApi
        .getBalances()
        .then((b) => {
          if (alive && typeof b?.main === 'number') setBalance(b.main);
        })
        .catch(() => {
          /* giữ giá trị hiện tại */
        });
    };
    load();
    const unsubscribe = subscribeWallet(load);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return balance;
}
