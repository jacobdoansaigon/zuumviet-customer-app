// useVnToday — ngày hôm nay theo giờ Việt Nam ("2026-10-09"), tự đổi khi qua nửa đêm (VN), khi màn được focus lại và
// khi app trở lại foreground — để các dải ngày "Hôm nay / Ngày mai…" không đứng yên từ lúc mở màn.
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { VN_OFFSET_MS, vnDateKey } from '@/services/vnTime';

const DAY_MS = 86_400_000;

export function useVnToday(): string {
  const [today, setToday] = useState(() => vnDateKey(Date.now()));
  const sync = useCallback(() => setToday(vnDateKey(Date.now())), []);

  useFocusEffect(sync);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  // hẹn đúng nửa đêm giờ VN (+1 giây)
  useEffect(() => {
    const now = Date.now();
    const nextMidnight = Math.floor((now + VN_OFFSET_MS) / DAY_MS + 1) * DAY_MS - VN_OFFSET_MS;
    const t = setTimeout(sync, nextMidnight - now + 1000);
    return () => clearTimeout(t);
  }, [today, sync]);

  return today;
}
