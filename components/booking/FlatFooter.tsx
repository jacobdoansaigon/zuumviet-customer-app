// FlatFooter — nút "flat" bám đáy màn, tự đệm safe-area cùng màu nút (không lộ viền trắng trên máy có home indicator)
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Button, type ButtonVariant } from '@/components/ui';

interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
}

export const FlatFooter: React.FC<Props> = ({ title, onPress, disabled, loading, variant = 'primary' }) => {
  const insets = useSafeAreaInsets();
  const bg = disabled || loading ? Colors.buttonDisabledBg : variant === 'danger' ? Colors.error : variant === 'teal' ? Colors.success : Colors.primary;
  return (
    <View style={{ backgroundColor: bg, paddingBottom: insets.bottom }}>
      <Button flat title={title} onPress={onPress} disabled={disabled} loading={loading} variant={variant} />
    </View>
  );
};

export default FlatFooter;
