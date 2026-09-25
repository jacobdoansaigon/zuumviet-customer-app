// PhotoAttachRow — Gọi thợ: đính kèm tối đa `max` ảnh hiện trạng sự cố (chụp hoặc chọn từ thư viện).
// Ảnh chỉ lưu uri cục bộ trên máy khách — BE chưa có API upload ảnh nên chưa gửi được ảnh thật lên
// server, xem ghi chú ở services/bookingStore.ts (handymanNote). Không ép crop vuông như ảnh đại diện.
import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { PhotoActionSheet } from '@/components/profile';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

const THUMB = 76;

export const PhotoAttachRow: React.FC<Props> = ({ photos, onChange, max = 3 }) => {
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (uri: string) => onChange([...photos, uri]);
  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <View>
      <View style={styles.row}>
        {photos.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
            <Pressable onPress={() => remove(i)} style={styles.removeBtn} hitSlop={8} accessibilityLabel="Xoá ảnh">
              <Icon name={Icons.closeCircle} size={18} color={Colors.white} />
            </Pressable>
          </View>
        ))}
        {photos.length < max ? (
          <Pressable onPress={() => setSheet(true)} style={styles.addTile}>
            <Icon name={Icons.camera} size={22} color={Colors.primary} />
            <AppText size={11} color={Colors.primary} style={{ marginTop: 4 }}>
              Thêm ảnh
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText size={12} color={Colors.error} style={{ marginTop: Spacing.xs }}>
          {error}
        </AppText>
      ) : null}
      <PhotoActionSheet visible={sheet} onClose={() => setSheet(false)} onPicked={add} onError={setError} allowsEditing={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  thumbWrap: { width: THUMB, height: THUMB, marginRight: Spacing.sm, marginBottom: Spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
});

export default PhotoAttachRow;
