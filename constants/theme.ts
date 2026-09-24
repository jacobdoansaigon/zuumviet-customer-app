// ZuumViet Design System — trích từ Figma "ZuumViet Mobile App Design"
// (UI Core > Colors / Typography). Dùng chung cho app Customer & Driver.
//
// Brand:   PRIMARY #59267C  |  PRIMARY.100 (nền header nhạt) #F9F6FA
// Semantic: SUCCESS #6DBCB8 | WARNING #F0B341 | DANGER #D24847
// Font:    Muli (Google Fonts: Mulish)

export const Palette = {
  primary: {
    50: '#F8E9FF',
    100: '#DEC3F0',
    200: '#C69DE2',
    300: '#AF76D5',
    400: '#984FC8',
    500: '#7E37AF',
    600: '#622A89',
    700: '#461E63',
    800: '#2B113D',
    900: '#110419',
  },
  success: {
    50: '#E1FAF8',
    100: '#C4E9E7',
    200: '#A4D8D6',
    300: '#83C7C3',
    400: '#62B7B3',
    500: '#489D99',
    600: '#357A77',
    700: '#235855',
    800: '#0E3534',
    900: '#001414',
  },
  warning: {
    50: '#FFF6DC',
    100: '#FBE3B2',
    200: '#F7D086',
    300: '#F2BD58',
    400: '#EEAA2A',
    500: '#D59011',
    600: '#A5700A',
    700: '#775004',
    800: '#483000',
    900: '#1D0F00',
  },
  danger: {
    50: '#FFE7E7',
    100: '#F5C0C0',
    200: '#E89898',
    300: '#DD706F',
    400: '#D24847',
    500: '#B82E2D',
    600: '#902322',
    700: '#671818',
    800: '#400C0D',
    900: '#1D0101',
  },
  grey: {
    50: '#F2F2F2',
    100: '#D9D9D9',
    200: '#BFBFBF',
    300: '#A6A6A6',
    400: '#8C8C8C',
    500: '#737373',
    600: '#595959',
    700: '#404040',
    800: '#262626',
    900: '#0D0D0D',
  },
} as const;

export const Colors = {
  // Brand
  primary: '#59267C',
  primaryDark: Palette.primary[700],
  primaryLight: Palette.primary[500],
  primarySoft: Palette.primary[100],
  primaryBg: '#F9F6FA', // nền header / card nhạt (PRIMARY.100 trong Figma)
  primaryTint: '#F3EEF8', // nền option đang chọn

  // Semantic
  secondary: '#F0B341', // WARNING / accent vàng (icon thống kê, sao đánh giá, km)
  success: '#6DBCB8', // teal (nút gọi, toast thành công, banner)
  successDark: Palette.success[500],
  successBg: Palette.success[50],
  warning: '#F0B341',
  warningBg: Palette.warning[50],
  error: '#D24847',
  errorBg: Palette.danger[50],
  info: '#2196F3',
  green: '#2EBD59', // trạng thái giao dịch thành công

  white: '#FFFFFF',
  black: '#000000',
  dark: '#1E1E1E', // màn nhận cuốc (driver)

  // Greys (giữ tên cũ để tương thích code hiện tại)
  gray50: Palette.grey[50],
  gray100: '#F7F7F7',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: Palette.grey[200],
  gray500: Palette.grey[400],
  gray600: Palette.grey[500],
  gray700: Palette.grey[600],
  gray800: Palette.grey[700],
  gray900: '#1A1A1A',

  // Surfaces
  background: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceAlt: '#F2F2F2', // nền input, box passcode, tile chưa chọn
  card: '#FFFFFF',
  border: '#E6E6E6',
  divider: '#EEEEEE',
  overlay: 'rgba(0,0,0,0.5)',
  mapBg: '#F4F1F8',

  // Text
  text: '#1A1A1A', // Gray 100 trong Figma
  textSecondary: '#737373',
  textMuted: '#8C8C8C',
  textDisabled: '#BFBFBF',
  placeholder: '#A6A6A6',
  textOnPrimary: '#FFFFFF',

  // Navigation
  headerBg: '#F9F6FA',
  headerTint: '#59267C',
  headerDarkBg: '#59267C',
  tabActive: '#59267C',
  tabInactive: '#8C8C8C',
  tabBarBg: '#FFFFFF',

  // Button
  buttonDisabledBg: '#E3E3E3',
  buttonDisabledText: '#8C8C8C',
};

/** Tên font đã load qua @expo-google-fonts/mulish (fallback System khi chưa load). */
export const Fonts = {
  regular: 'Mulish_400Regular',
  medium: 'Mulish_500Medium',
  semiBold: 'Mulish_600SemiBold',
  bold: 'Mulish_700Bold',
  extraBold: 'Mulish_800ExtraBold',
  black: 'Mulish_900Black',
} as const;

export type FontWeightKey = keyof typeof Fonts;

export const Typography = {
  fontFamily: {
    regular: Fonts.regular,
    medium: Fonts.medium,
    semiBold: Fonts.semiBold,
    bold: Fonts.bold,
    extraBold: Fonts.extraBold,
  },
  // Figma: H900 32 · H800 28 · H700 24 · H600 20 · H500 18 · H400 16 · H300 14 · H200 12 · H100 10
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    display: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.7,
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  /** padding ngang chuẩn của màn hình trong Figma (414 → 16px) */
  screen: 16,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2B113D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2B113D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

/** Kích cỡ chuẩn theo Figma */
export const Sizes = {
  header: 56,
  button: 50,
  input: 48,
  codeBox: 48,
  tabBar: 64,
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 72,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
};

export default { Colors, Palette, Fonts, Typography, Spacing, BorderRadius, Shadow, Sizes };
