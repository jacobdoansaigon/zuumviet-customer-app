// Đăng ký tài xế — Step 3: Upload giấy tờ
// Design: Figma [Driver] Sign In + Sign Up > 2.2 Giấy tờ CMND / 2.3 Giấy tờ - Bằng lái

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';

type DocType = {
  key: string;
  title: string;
  desc: string;
  icon: string;
  required: boolean;
  sides?: ('front' | 'back')[];
};

const DOCUMENTS: DocType[] = [
  {
    key: 'cmnd',
    title: 'CMND / CCCD',
    desc: 'Chụp cả 2 mặt, rõ nét',
    icon: '🪪',
    required: true,
    sides: ['front', 'back'],
  },
  {
    key: 'license',
    title: 'Bằng lái xe',
    desc: 'Phải còn hiệu lực, phù hợp với loại xe',
    icon: '📋',
    required: true,
    sides: ['front', 'back'],
  },
  {
    key: 'vehicle_reg',
    title: 'Đăng ký xe',
    desc: 'Giấy đăng ký phương tiện',
    icon: '📄',
    required: true,
  },
  {
    key: 'insurance',
    title: 'Bảo hiểm xe',
    desc: 'Bảo hiểm bắt buộc còn hạn',
    icon: '🛡️',
    required: false,
  },
];

type UploadedImages = Record<string, string>; // key → uri

export default function RegisterStep3() {
  const params = useLocalSearchParams();
  const [images, setImages] = useState<UploadedImages>({});

  const pickImage = async (key: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Hãy cấp quyền truy cập thư viện ảnh trong Cài đặt.');
      return;
    }

    Alert.alert('Chọn ảnh', `Chụp ảnh hoặc chọn từ thư viện`, [
      {
        text: '📷 Chụp ảnh',
        onPress: () => takePhoto(key),
      },
      {
        text: '🖼️ Thư viện',
        onPress: () => pickFromLibrary(key),
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };

  const takePhoto = async (key: string) => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const pickFromLibrary = async (key: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  // Check required docs are uploaded
  const isValid = DOCUMENTS.filter((d) => d.required).every((doc) => {
    if (doc.sides) {
      return doc.sides.every((side) => images[`${doc.key}_${side}`]);
    }
    return images[doc.key];
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepIndicator total={4} current={3} />

      <Text style={styles.title}>Upload giấy tờ</Text>
      <Text style={styles.subtitle}>
        Ảnh phải rõ nét, đủ ánh sáng, không bị che khuất
      </Text>

      {DOCUMENTS.map((doc) => (
        <View key={doc.key} style={styles.docSection}>
          <View style={styles.docHeader}>
            <Text style={styles.docIcon}>{doc.icon}</Text>
            <View>
              <Text style={styles.docTitle}>
                {doc.title}
                {doc.required && <Text style={styles.required}> *</Text>}
              </Text>
              <Text style={styles.docDesc}>{doc.desc}</Text>
            </View>
          </View>

          {doc.sides ? (
            <View style={styles.sidesRow}>
              {doc.sides.map((side) => {
                const key = `${doc.key}_${side}`;
                const uri = images[key];
                return (
                  <ImageUploadBox
                    key={side}
                    label={side === 'front' ? 'Mặt trước' : 'Mặt sau'}
                    uri={uri}
                    onPress={() => pickImage(key)}
                  />
                );
              })}
            </View>
          ) : (
            <ImageUploadBox
              label="Chọn ảnh"
              uri={images[doc.key]}
              onPress={() => pickImage(doc.key)}
              fullWidth
            />
          )}
        </View>
      ))}

      <Button
        title="Tiếp theo →"
        onPress={() =>
          router.push({
            pathname: '/(auth)/register/step4',
            params: { ...params },
          })
        }
        disabled={!isValid}
        variant={isValid ? 'primary' : 'secondary'}
      />
    </ScrollView>
  );
}

function ImageUploadBox({
  label, uri, onPress, fullWidth,
}: {
  label: string; uri?: string; onPress: () => void; fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.uploadBox, fullWidth && styles.uploadBoxFull]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.uploadedImage} />
          <View style={styles.uploadedOverlay}>
            <Text style={styles.uploadedCheck}>✓</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  required: { color: Colors.error },

  docSection: {
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  docIcon: { fontSize: 24 },
  docTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  docDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sidesRow: { flexDirection: 'row', gap: Spacing.sm },

  uploadBox: {
    flex: 1,
    height: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
    gap: Spacing.xs,
  },
  uploadBoxFull: { flex: undefined, width: '100%' },
  uploadIcon: { fontSize: 28 },
  uploadLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadedOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedCheck: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },
});
