// Toast — thông báo nổi teal (thành công) / đỏ (lỗi) theo Figma
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons } from './Icon';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  /** đặt ở trên (banner) hay dưới (default) */
  position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({ message, tone = 'success', visible, onHide, duration = 2800, style, position = 'bottom' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onHide?.());
    }, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;
  const bg = tone === 'success' ? Colors.success : tone === 'error' ? Colors.error : Colors.primary;
  const icon = tone === 'success' ? Icons.check : tone === 'error' ? Icons.alert : Icons.info;
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, position === 'top' ? styles.top : styles.bottom, { opacity }, style]}>
      <View style={[styles.toast, { backgroundColor: bg }]}>
        <Icon name={icon} size={18} color={Colors.white} />
        <AppText size={14} weight="medium" color={Colors.white} style={styles.msg}>
          {message}
        </AppText>
      </View>
    </Animated.View>
  );
};

/** Banner tĩnh (không tự ẩn) — vd "Bạn có 3 đơn hàng đang giao" */
export const Banner: React.FC<{ message: string; tone?: ToastTone; icon?: React.ComponentProps<typeof Icon>['name']; style?: StyleProp<ViewStyle> }> = ({
  message,
  tone = 'success',
  icon,
  style,
}) => {
  const bg = tone === 'success' ? Colors.success : tone === 'error' ? Colors.error : Colors.primary;
  return (
    <View style={[styles.toast, { backgroundColor: bg }, style]}>
      <Icon name={icon ?? (tone === 'error' ? Icons.alert : Icons.inbox)} size={20} color={Colors.white} />
      <AppText size={15} weight="semiBold" color={Colors.white} style={styles.msg}>
        {message}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Spacing.screen, right: Spacing.screen, zIndex: 50 },
  bottom: { bottom: 90 },
  top: { top: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  msg: { marginLeft: Spacing.sm, flex: 1 },
});

export default Toast;
