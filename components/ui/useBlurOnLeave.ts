// Rời màn hình (sang màn khác / quay lại / thay màn) khi ô nhập của màn đó đang được gõ → bỏ focus ô đó để bàn phím đóng.
// Không làm thì Android giữ bàn phím mở sau khi ô nhập đã bị gỡ (che nửa dưới màn hình mới, Keyboard.dismiss() cũng
// không đóng được vì không còn ô nào focus). Chỉ đụng tới ô của chính màn đang rời — ô tự focus ở màn mới không bị ảnh hưởng.
// (expo-router 56+ không cho import @react-navigation — dùng useIsFocused của expo-router.)
import { useEffect, type RefObject } from 'react';
import type { TextInput } from 'react-native';
import { useIsFocused } from 'expo-router';

export function useBlurOnLeave(ref: RefObject<TextInput | null>) {
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused && ref.current?.isFocused()) ref.current.blur();
  }, [focused, ref]);
}
