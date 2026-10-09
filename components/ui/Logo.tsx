// Logo — logo ZuumViet chính thức (ghim định vị chứa chữ Z + ngôi sao, lấy từ trang quản trị cũ) + wordmark.
// Ảnh gốc: assets/logo.png (tím #602C81) và assets/logo-white.png (trắng, dùng trên nền tím).
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { AppText } from './Text';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../assets/logo.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO_WHITE = require('../../assets/logo-white.png');
/** cao / rộng của logo gốc (1212 × 1004 px) */
const RATIO = 1212 / 1004;

interface LogoProps {
  size?: number;
  /** 'purple' = logo tím trên nền sáng; 'white' = logo trắng trên nền tím */
  tone?: 'purple' | 'white';
  showWordmark?: boolean;
  wordmark?: string;
}

/** Riêng biểu tượng: rộng `size`, cao ≈ 1,2 × size */
export const LogoMark: React.FC<{ size?: number; tone?: 'purple' | 'white' }> = ({ size = 72, tone = 'purple' }) => (
  <Image
    source={tone === 'white' ? LOGO_WHITE : LOGO}
    style={{ width: size, height: size * RATIO }}
    resizeMode="contain"
    accessibilityLabel="ZuumViet"
  />
);

export const Logo: React.FC<LogoProps> = ({ size = 72, tone = 'purple', showWordmark = true, wordmark = 'zuumviet' }) => {
  const color = tone === 'purple' ? Colors.primary : Colors.white;
  return (
    <View style={styles.wrap}>
      <LogoMark size={size} tone={tone} />
      {showWordmark ? (
        <AppText weight="extraBold" size={size * 0.4} color={color} style={{ marginTop: 4, letterSpacing: -0.5 }}>
          {wordmark}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

export default Logo;
