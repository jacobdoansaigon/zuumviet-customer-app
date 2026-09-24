// AppHeader — header theo Figma "Header Navigation":
//   variant "light": nền lavender #F9F6FA, chữ/icon tím (màn auth, tab)
//   variant "dark":  nền tím #59267C, chữ/icon trắng (màn đặt hàng, ví, trong cuốc)
import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Sizes } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons, type IconName } from './Icon';

export interface HeaderAction {
  icon: IconName;
  onPress?: () => void;
  badge?: number;
  label?: string;
}

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'light' | 'dark' | 'transparent';
  /** 'back' (chevron) | 'arrow' (←) | 'close' (×) | 'menu' | 'none' */
  left?: 'back' | 'arrow' | 'close' | 'menu' | 'none';
  onLeftPress?: () => void;
  right?: HeaderAction | HeaderAction[];
  /** text nhỏ bên phải (vd "1/5") */
  rightText?: string;
  /** node tự do bên phải (avatar...) */
  rightNode?: React.ReactNode;
  centerTitle?: boolean;
  withSafeArea?: boolean;
  bordered?: boolean;
  large?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  variant = 'light',
  left = 'back',
  onLeftPress,
  right,
  rightText,
  rightNode,
  centerTitle = true,
  withSafeArea = true,
  bordered = true,
  large = false,
}) => {
  const insets = useSafeAreaInsets();
  const dark = variant === 'dark';
  const tint = dark ? Colors.white : Colors.primary;
  const bg = variant === 'transparent' ? 'transparent' : dark ? Colors.headerDarkBg : Colors.headerBg;

  const handleLeft = () => {
    if (onLeftPress) return onLeftPress();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const leftIcon: IconName | null =
    left === 'back' ? Icons.back : left === 'arrow' ? Icons.arrowLeft : left === 'close' ? Icons.close : left === 'menu' ? Icons.menu : null;

  const actions = Array.isArray(right) ? right : right ? [right] : [];

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: bg, paddingTop: withSafeArea ? insets.top : 0 },
        bordered && !dark && variant !== 'transparent' && styles.bordered,
      ]}
    >
      <View style={[styles.bar, large && styles.barLarge]}>
        <View style={styles.side}>
          {leftIcon ? (
            <Pressable onPress={handleLeft} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Quay lại">
              <Icon name={leftIcon} size={left === 'back' ? 26 : 24} color={tint} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.center, !centerTitle && styles.centerLeft]}>
          {title ? (
            <AppText
              weight="bold"
              size={large ? 20 : 17}
              color={tint}
              numberOfLines={1}
              align={centerTitle ? 'center' : 'left'}
            >
              {title}
            </AppText>
          ) : null}
          {subtitle ? (
            <AppText size={12} color={dark ? 'rgba(255,255,255,0.85)' : Colors.textSecondary} numberOfLines={1} align={centerTitle ? 'center' : 'left'}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {rightNode}
          {rightText ? (
            <AppText weight="semiBold" size={15} color={tint}>
              {rightText}
            </AppText>
          ) : null}
          {actions.map((a, i) => (
            <Pressable key={i} onPress={a.onPress} hitSlop={10} style={styles.iconBtn} accessibilityLabel={a.label}>
              <Icon name={a.icon} size={22} color={tint} />
              {a.badge ? (
                <View style={styles.badge}>
                  <AppText size={10} weight="bold" color={Colors.white}>
                    {a.badge > 99 ? '99+' : a.badge}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  bordered: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  bar: {
    height: Sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  barLarge: { height: 64 },
  side: { minWidth: 56, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: Spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerLeft: { alignItems: 'flex-start' },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});

export default AppHeader;
