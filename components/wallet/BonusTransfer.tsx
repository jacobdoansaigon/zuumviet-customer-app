// useBonusTransfer — luồng "Chuyển sang ví chính" của Ví thưởng: hộp xác nhận hiện số tiền → POST /wallet/bonus/transfer
// (Idempotency-Key mới cho mỗi lần bấm — services/wallet.ts) → hộp kết quả (đã chuyển bao nhiêu, số dư ví chính mới)
// hoặc lỗi (`bonus.empty` / `bonus.insufficient` → tải lại số dư). Một Dialog duy nhất đổi nội dung theo bước (không
// chồng Modal). Dùng ở màn Ví và Lịch sử Ví thưởng.
import React, { useState } from 'react';
import { Dialog, type DialogAction } from '@/components/ui';
import { COMMUNITY_REWARD_NOTE } from '@/services/affiliate';
import { refreshWallet, transferBonusToMain, useWallet } from '@/services/wallet';
import { errorMessage, isApiError } from '@/services/zuum';
import { formatVnd } from './walletUtils';

type Step =
  | { step: 'idle' }
  | { step: 'empty' }
  | { step: 'confirm'; amount: number }
  | { step: 'sending'; amount: number }
  | { step: 'done'; amount: number; main: number }
  | { step: 'error'; title: string; message: string };

export function useBonusTransfer(onDone?: () => void) {
  const wallet = useWallet();
  const [state, setState] = useState<Step>({ step: 'idle' });
  const bonus = wallet?.bonus ?? 0;

  const start = () => setState(bonus > 0 ? { step: 'confirm', amount: bonus } : { step: 'empty' });
  const close = () => setState((s) => (s.step === 'sending' ? s : { step: 'idle' }));

  const send = async (amount: number) => {
    setState({ step: 'sending', amount });
    try {
      const res = await transferBonusToMain(amount);
      const main = 'available' in res.wallet ? res.wallet.available : res.wallet.balance;
      setState({ step: 'done', amount: res.amount, main });
      onDone?.();
    } catch (e) {
      const stale = isApiError(e, 'bonus.empty', 'bonus.insufficient');
      if (stale) void refreshWallet().catch(() => undefined);
      setState({
        step: 'error',
        title: isApiError(e, 'bonus.empty') ? 'Ví thưởng chưa có tiền' : 'Chưa chuyển được',
        message: errorMessage(e, 'Không chuyển được, vui lòng thử lại'),
      });
      if (stale) onDone?.();
    }
  };

  let title = '';
  let message = '';
  let actions: DialogAction[] = [];
  switch (state.step) {
    case 'empty':
      title = 'Ví thưởng chưa có tiền';
      message = COMMUNITY_REWARD_NOTE;
      actions = [{ label: 'Đã hiểu', onPress: close }];
      break;
    case 'confirm':
    case 'sending':
      title = 'Chuyển sang ví chính';
      message = `Chuyển toàn bộ đ${formatVnd(state.amount)} từ Ví thưởng sang ví chính? Số tiền này dùng được ngay để thanh toán chuyến đi, vé xe và dịch vụ trên ZuumViet.`;
      actions = [
        { label: 'Huỷ', variant: 'secondary', onPress: close },
        { label: state.step === 'sending' ? 'Đang chuyển…' : 'Chuyển', onPress: () => state.step === 'confirm' && void send(state.amount) },
      ];
      break;
    case 'done':
      title = 'Đã chuyển sang ví chính';
      message = `đ${formatVnd(state.amount)} đã được cộng vào ví chính.\nSố dư ví chính: đ${formatVnd(state.main)}`;
      actions = [{ label: 'Đồng ý', onPress: close }];
      break;
    case 'error':
      title = state.title;
      message = state.message;
      actions = [{ label: 'Đóng', onPress: close }];
      break;
  }

  const element = (
    <Dialog visible={state.step !== 'idle'} onClose={close} dismissable={state.step !== 'sending'} title={title} message={message} actions={actions} />
  );

  return { start, element, sending: state.step === 'sending' };
}
