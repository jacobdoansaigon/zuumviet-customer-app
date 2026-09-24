// Dialog — hộp thoại giữa màn (Figma: "Siêu Tốc — Thông tin dịch vụ", "Xác nhận trả hàng", "Tài khoản Thưởng")
// ErrorSheet — sheet lỗi đáy màn (Figma: "Lỗi đăng nhập")
import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Button, type ButtonVariant } from './Button';
import { BottomSheet } from './BottomSheet';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

interface DialogProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  actions?: DialogAction[];
  /** xếp nút ngang (2 nút) hay dọc */
  actionsRow?: boolean;
  dismissable?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({ visible, onClose, title, message, children, actions = [], actionsRow = true, dismissable = true }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.center}>
      <Pressable style={styles.backdrop} onPress={dismissable ? onClose : undefined} />
      <View style={styles.box}>
        {title ? (
          <AppText weight="bold" size={20} align="center" style={styles.title}>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText size={16} align="center" color={Colors.text} style={styles.msg}>
            {message}
          </AppText>
        ) : null}
        {children}
        {actions.length ? (
          <View style={[styles.actions, actionsRow && styles.actionsRow]}>
            {actions.map((a, i) => (
              <Button key={i} title={a.label} onPress={a.onPress} variant={a.variant ?? 'primary'} style={actionsRow ? { flex: 1 } : undefined} size="md" />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  </Modal>
);

interface ErrorSheetProps {
  visible: boolean;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export const ErrorSheet: React.FC<ErrorSheetProps> = ({ visible, title = 'Lỗi đăng nhập', message, actionLabel = 'Thử lại', onAction, onClose }) => (
  <BottomSheet visible={visible} onClose={onClose} showHandle={false} contentStyle={styles.errContent}>
    <AppText weight="bold" size={20} align="center" style={{ marginTop: Spacing.lg }}>
      {title}
    </AppText>
    <AppText size={15} color={Colors.gray700} align="center" style={{ marginTop: Spacing.md, lineHeight: 22 }}>
      {message}
    </AppText>
    <Button title={actionLabel} onPress={onAction ?? onClose} style={{ marginTop: Spacing.xl }} />
  </BottomSheet>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: { marginBottom: Spacing.sm },
  msg: { lineHeight: 24 },
  actions: { marginTop: Spacing.xl, gap: Spacing.md },
  actionsRow: { flexDirection: 'row' },
  errContent: { paddingBottom: Spacing.xl },
});

export default Dialog;
