// BottomSheet — sheet trắng bo góc trên 16, có tay kéo (handle), nền mờ (Figma: dialog lỗi, chọn hình thức thanh toán...)
import React from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons } from './Icon';

interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  showHandle?: boolean;
  showClose?: boolean;
  dismissable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  maxHeightRatio?: number;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  showHandle = true,
  showClose = false,
  dismissable = true,
  contentStyle,
  scroll = false,
  maxHeightRatio = 0.9,
}) => {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismissable ? onClose : undefined} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.base), maxHeight: `${Math.round(maxHeightRatio * 100)}%` as unknown as number }]}>
          {showHandle ? <View style={styles.handle} /> : null}
          {title || showClose ? (
            <View style={styles.titleRow}>
              <AppText weight="bold" size={17} style={{ flex: 1 }}>
                {title}
              </AppText>
              {showClose ? (
                <Pressable onPress={onClose} hitSlop={10}>
                  <Icon name={Icons.close} size={22} color={Colors.text} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Body style={[styles.content, contentStyle]}>{children}</Body>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray300, marginBottom: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  content: { paddingHorizontal: Spacing.screen },
});

export default BottomSheet;
