// useAppFonts — load font Mulish (Figma: typeface Muli) cho toàn app
import {
  useFonts,
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
  Mulish_900Black,
} from '@expo-google-fonts/mulish';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_600SemiBold,
    Mulish_700Bold,
    Mulish_800ExtraBold,
    Mulish_900Black,
  });
  // Nếu lỗi tải font (offline...) vẫn cho app chạy với font hệ thống
  return loaded || !!error;
}
