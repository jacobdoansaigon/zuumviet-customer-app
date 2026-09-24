// PhotoActionSheet — action sheet chọn ảnh (Figma Chỉnh sửa hồ sơ): nhóm trắng bo góc
// "Chụp ảnh" / "Chọn ảnh từ thư viện" (tím 15) + nút riêng "Huỷ bỏ" đỏ. Dùng expo-image-picker.
import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';

interface PhotoActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (uri: string) => void;
  onError?: (message: string) => void;
}

export const PhotoActionSheet: React.FC<PhotoActionSheetProps> = ({ visible, onClose, onPicked, onError }) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const pick = async (source: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    try {
      if (source === 'camera') {
        if (Platform.OS === 'web') {
          onError?.('Trình duyệt không hỗ trợ chụp ảnh, hãy chọn ảnh từ thư viện');
          return;
        }
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          onError?.('Bạn chưa cấp quyền camera');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          onError?.('Bạn chưa cấp quyền truy cập ảnh');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      const result =
        source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets?.[0]?.uri) {
        onPicked(result.assets[0].uri);
      }
    } catch {
      onError?.('Có lỗi xảy ra trong quá trình');
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.base) }]}>
          <View style={styles.group}>
            <Pressable onPress={() => pick('camera')} style={({ pressed }) => [styles.item, pressed && styles.pressed]} disabled={busy}>
              <AppText size={15} weight="semiBold" color={Colors.primary} align="center">
                Chụp ảnh
              </AppText>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => pick('library')} style={({ pressed }) => [styles.item, pressed && styles.pressed]} disabled={busy}>
              <AppText size={15} weight="semiBold" color={Colors.primary} align="center">
                Chọn ảnh từ thư viện
              </AppText>
            </Pressable>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.group, styles.item, styles.cancel, pressed && styles.pressed]}>
            <AppText size={15} weight="bold" color={Colors.error} align="center">
              Huỷ bỏ
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay },
  sheet: { paddingHorizontal: Spacing.sm },
  group: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  item: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: Colors.primaryBg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  cancel: { marginTop: Spacing.sm },
});

export default PhotoActionSheet;
