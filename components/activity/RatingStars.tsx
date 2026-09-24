// RatingStars — dãy sao vàng #F0B341 (Figma), có thể bấm để chọn
import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Palette } from '@/constants/theme';
import { Icon, Icons } from '@/components/ui';

interface RatingStarsProps {
  value: number;
  max?: number;
  size?: number;
  gap?: number;
  onChange?: (value: number) => void;
  color?: string;
  emptyColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  max = 5,
  size = 20,
  gap = 4,
  onChange,
  color = Colors.secondary,
  emptyColor = Palette.grey[100],
  style,
}) => (
  <View style={[styles.row, { gap }, style]} accessibilityRole={onChange ? 'adjustable' : undefined}>
    {Array.from({ length: max }, (_, i) => {
      const filled = i < Math.round(value);
      const star = <Icon name={Icons.star} size={size} color={filled ? color : emptyColor} />;
      if (!onChange) return <View key={i}>{star}</View>;
      return (
        <Pressable key={i} onPress={() => onChange(i + 1)} hitSlop={6} accessibilityLabel={`${i + 1} sao`}>
          {star}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default RatingStars;
