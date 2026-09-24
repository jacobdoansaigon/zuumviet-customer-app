// RoundIconButton — nút tròn trắng 40px có shadow nổi trên bản đồ (back / close)
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { Icon, type IconName } from '@/components/ui';

interface Props {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const RoundIconButton: React.FC<Props> = ({ icon, onPress, size = 40, style, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.btn, { width: size, height: size, borderRadius: size / 2 }, pressed && { opacity: 0.85 }, style]}
  >
    <Icon name={icon} size={Math.round(size * 0.6)} color={Colors.primary} />
  </Pressable>
);

const styles = StyleSheet.create({
  btn: { backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
});

export default RoundIconButton;
