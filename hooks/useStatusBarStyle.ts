// useStatusBarStyle — đặt màu chữ status bar theo header của màn hình đang focus
// ('light' cho header tím, 'dark' cho header lavender / nền trắng). Dùng useFocusEffect để
// đổi đúng khi chuyển tab (các tab không unmount). No-op trên web.
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle, type StatusBarStyle } from 'expo-status-bar';

export function useStatusBarStyle(style: StatusBarStyle) {
  useFocusEffect(
    useCallback(() => {
      try {
        setStatusBarStyle(style, true);
      } catch {
        /* web / môi trường không hỗ trợ */
      }
    }, [style])
  );
}
