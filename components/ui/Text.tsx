// AppText — Text dùng font Mulish theo Figma, có prop weight/size/color
import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { Colors, Fonts, Typography, type FontWeightKey } from '@/constants/theme';

export type TextVariant =
  | 'h1' // 28 bold
  | 'h2' // 24 bold
  | 'h3' // 20 bold
  | 'h4' // 18 bold
  | 'title' // 16 bold
  | 'subtitle' // 16 semibold
  | 'body' // 16 regular
  | 'bodyMd' // 14 regular
  | 'bodySm' // 12 regular
  | 'caption' // 11 regular
  | 'label' // 14 semibold
  | 'button'; // 16 bold

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: FontWeightKey;
  color?: string;
  size?: number;
  align?: TextStyle['textAlign'];
  muted?: boolean;
  children?: React.ReactNode;
}

const VARIANTS: Record<TextVariant, { size: number; weight: FontWeightKey; lineHeight?: number }> = {
  h1: { size: 28, weight: 'bold', lineHeight: 34 },
  h2: { size: 24, weight: 'bold', lineHeight: 30 },
  h3: { size: 20, weight: 'bold', lineHeight: 26 },
  h4: { size: 18, weight: 'bold', lineHeight: 24 },
  title: { size: 16, weight: 'bold', lineHeight: 22 },
  subtitle: { size: 16, weight: 'semiBold', lineHeight: 22 },
  body: { size: 16, weight: 'regular', lineHeight: 23 },
  bodyMd: { size: 14, weight: 'regular', lineHeight: 20 },
  bodySm: { size: 12, weight: 'regular', lineHeight: 17 },
  caption: { size: 11, weight: 'regular', lineHeight: 15 },
  label: { size: 14, weight: 'semiBold', lineHeight: 20 },
  button: { size: 16, weight: 'bold', lineHeight: 22 },
};

export function fontStyle(weight: FontWeightKey = 'regular'): TextStyle {
  return { fontFamily: Fonts[weight], fontWeight: weightToNumeric(weight) };
}

function weightToNumeric(w: FontWeightKey): TextStyle['fontWeight'] {
  switch (w) {
    case 'medium':
      return '500';
    case 'semiBold':
      return '600';
    case 'bold':
      return '700';
    case 'extraBold':
      return '800';
    case 'black':
      return '900';
    default:
      return '400';
  }
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'bodyMd',
  weight,
  color,
  size,
  align,
  muted,
  style,
  children,
  ...rest
}) => {
  const v = VARIANTS[variant];
  const w = weight ?? v.weight;
  const fs = size ?? v.size;
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        fontStyle(w),
        {
          fontSize: fs,
          lineHeight: size ? Math.round(size * Typography.lineHeight.normal) : v.lineHeight,
          color: color ?? (muted ? Colors.textSecondary : Colors.text),
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: { color: Colors.text },
});

export default AppText;
