// useWalletBalance — số dư Tài khoản chính hiển thị trên Home / Hồ sơ, đồng bộ với màn Ví
// (services/wallet.ts phát sự kiện khi nạp/rút). Fallback MOCK_WALLET.balance trong lúc tải.
import { useEffect, useState } from 'react';
import { walletApi, subscribeWallet } from '@/services/wallet';
import { MOCK_WALLET } from '@/constants/mock';

export function useWalletBalance(): number {
  const [balance, setBalance] = useState<number>(MOCK_WALLET.balance);

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
