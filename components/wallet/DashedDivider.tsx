// DashedDivider — đường kẻ đứt (render được cả Android: dùng viền đủ 4 cạnh + overflow hidden)
import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

export const DashedDivider: React.FC<{ color?: string; style?: StyleProp<ViewStyle> }> = ({ color = Colors.gray300, style }) => (
  <View style={[styles.wrap, style]}>
    <View style={[styles.line, { borderColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  wrap: { height: 1, overflow: 'hidden' },
  line: { height: 2, borderWidth: 1, borderStyle: 'dashed', borderRadius: 1 },
});

export default DashedDivider;
