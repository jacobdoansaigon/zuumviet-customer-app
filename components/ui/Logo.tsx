// Logo — biểu tượng ZuumViet (pin định vị chứa chữ Z) + wordmark. Vẽ bằng View để không cần asset.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { AppText } from './Text';

interface LogoProps {
  size?: number;
  /** 'purple' = logo tím trên nền sáng; 'white' = logo trắng trên nền tím */
  tone?: 'purple' | 'white';
  showWordmark?: boolean;
  wordmark?: string;
}

export const LogoMark: React.FC<{ size?: number; tone?: 'purple' | 'white' }> = ({ size = 72, tone = 'purple' }) => {
  const fill = tone === 'purple' ? Colors.primary : Colors.white;
  const inner = tone === 'purple' ? Colors.white : Colors.primary;
  return (
    <View style={{ width: size, height: size * 1.2, alignItems: 'center' }}>
      <View style={[styles.head, { width: size, height: size, borderRadius: size / 2, backgroundColor: fill }]}>
        <View style={[styles.innerCircle, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36, backgroundColor: inner }]}>
          <AppText weight="black" size={size * 0.46} color={fill} style={{ lineHeight: size * 0.52, fontStyle: 'italic' }}>
            Z
          </AppText>
        </View>
        <View style={[styles.spark, { top: size * 0.16, right: size * 0.16, width: size * 0.12, height: size * 0.12, backgroundColor: inner }]} />
      </View>
      <View
        style={[
          styles.tail,
          {
            width: size * 0.5,
            height: size * 0.5,
            backgroundColor: fill,
            marginTop: -size * 0.32,
            borderBottomRightRadius: size * 0.1,
          },
        ]}
      />
    </View>
  );
};

export const Logo: React.FC<LogoProps> = ({ size = 72, tone = 'purple', showWordmark = true, wordmark = 'zuumviet' }) => {
  const color = tone === 'purple' ? Colors.primary : Colors.white;
  return (
    <View style={styles.wrap}>
      <LogoMark size={size} tone={tone} />
      {showWordmark ? (
        <AppText weight="extraBold" size={size * 0.4} color={color} style={{ marginTop: 2, letterSpacing: -0.5 }}>
          {wordmark}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  head: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  innerCircle: { alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute', transform: [{ rotate: '45deg' }], borderRadius: 2 },
  tail: { transform: [{ rotate: '45deg' }], zIndex: 1 },
});

export default Logo;
