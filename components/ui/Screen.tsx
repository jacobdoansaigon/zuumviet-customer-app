// Screen — khung màn hình: SafeArea + nền + (tuỳ chọn) header, footer bám đáy
import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

interface ScreenProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  /** SafeArea cạnh nào (mặc định chỉ bottom vì header đã xử lý top) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  footerPadded?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  header,
  footer,
  scroll = false,
  padded = false,
  background = Colors.white,
  contentStyle,
  keyboardAvoiding = true,
  edges,
  footerPadded = true,
}) => {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[padded && styles.padded, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );

  const Wrapper = keyboardAvoiding ? KeyboardAvoidingView : View;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges ?? (header ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right'])}>
      {header}
      <Wrapper style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? (
          <View style={[footerPadded && styles.footer, !footerPadded && { paddingBottom: 0 }]}>{footer}</View>
        ) : null}
      </Wrapper>
      {/* đệm đáy cho footer flat khi có home indicator */}
      {footer && !footerPadded && insets.bottom > 0 ? <View style={{ height: 0 }} /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  padded: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.base },
  footer: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.md, backgroundColor: 'transparent' },
});

export default Screen;
