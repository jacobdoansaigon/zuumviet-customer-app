// MomoMark — biểu tượng ví MoMo vẽ bằng View (không dùng asset thương hiệu)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';

export const MomoMark: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.25 }]}>
    <AppText weight="black" size={size * 0.5} color="#FFFFFF" style={{ lineHeight: size * 0.6 }}>
      M
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  box: { backgroundColor: '#A50064', alignItems: 'center', justifyContent: 'center' },
});

export default MomoMark;
