// VehicleGallery — ảnh xe ở chi tiết chuyến: dải ảnh ngang (ngoại thất / nội thất), chạm để xem lớn (vuốt qua lại).
// Nguồn ảnh từ API (nhà xe tải lên; hiện là ảnh minh hoạ tạm) kèm dòng ghi nguồn khi có.
import React, { useState } from 'react';
import { View, ScrollView, Image, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';

export interface VehiclePhotoSet {
  exterior: string[];
  interior: string[];
  credit?: string | null;
}

const THUMB_W = 176;
const THUMB_H = 118;

export const VehicleGallery: React.FC<{ photos: VehiclePhotoSet }> = ({ photos }) => {
  const all = [...photos.exterior.map((uri) => ({ uri, label: 'Ngoại thất' })), ...photos.interior.map((uri) => ({ uri, label: 'Nội thất' }))];
  const [open, setOpen] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  if (!all.length) return null;
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {all.map((p, i) => (
          <Pressable
            key={`${p.uri}-${i}`}
            onPress={() => {
              setPage(i);
              setOpen(i);
            }}
            accessibilityLabel={`Ảnh ${p.label.toLowerCase()} ${i + 1}`}
          >
            <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.tag}>
              <AppText size={10} weight="semiBold" color={Colors.white}>
                {p.label}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {photos.credit ? (
        <AppText size={10} color={Colors.textMuted} style={{ marginTop: 4 }} numberOfLines={1}>
          {photos.credit}
        </AppText>
      ) : null}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.viewer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (open ?? 0) * width, y: 0 }}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {all.map((p, i) => (
              <View key={`full-${i}`} style={{ width, justifyContent: 'center' }}>
                <Image source={{ uri: p.uri }} style={{ width, height: width * 0.75 }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          <View style={styles.viewerBar}>
            <AppText size={13} color={Colors.white}>
              {all[page]?.label} · {page + 1}/{all.length}
            </AppText>
          </View>
          <Pressable style={styles.close} onPress={() => setOpen(null)} accessibilityLabel="Đóng">
            <Icon name={Icons.close} size={22} color={Colors.white} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  strip: { gap: Spacing.sm },
  thumb: { width: THUMB_W, height: THUMB_H, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
  tag: { position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' },
  viewerBar: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  close: { position: 'absolute', top: 48, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

export default VehicleGallery;
