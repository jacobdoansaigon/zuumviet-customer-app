// services/authNav.ts — vào app sau khi đăng nhập / đăng ký / đặt lại passcode: bỏ hết các màn auth khỏi lịch sử
// (nút quay lại không đưa về màn OTP / đăng ký nữa). Web: tải lại trang để router bắt đầu sạch.
import { Keyboard } from 'react-native';
import { router, type Href } from 'expo-router';

export function enterApp(path: '/home' | '/account?toast=passcode') {
  // đóng bàn phím khi ô passcode / OTP còn trên màn hình — các màn auth bị gỡ ngay, Android giữ bàn phím che trang chủ
  Keyboard.dismiss();
  try {
    if (typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
      window.location.assign(path);
      return;
    }
  } catch {
    /* fall through */
  }
  if (router.canDismiss()) router.dismissAll();
  router.replace(path as Href);
}
