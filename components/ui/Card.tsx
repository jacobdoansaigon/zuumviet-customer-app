// Card — khung trắng bo 12, shadow nhẹ (Figma UI Core > Card)
import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/theme';

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  shadow?: boolean;
  outlined?: boolean;
  tone?: 'white' | 'grey' | 'lavender';
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, padded = true, shadow = true, outlined, tone = 'white' }) => {
  const bg = tone === 'grey' ? Colors.surface : tone === 'lavender' ? Colors.primaryBg : Colors.white;
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: bg },
        padded && styles.padded,
        shadow && tone === 'white' && Shadow.sm,
        outlined && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.lg },
  padded: { padding: Spacing.base },
  outlined: { borderWidth: 1, borderColor: Colors.border },
});

export default Card;
