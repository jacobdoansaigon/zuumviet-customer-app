// Thêm vào địa điểm — Figma THÊM VÀO ĐỊA ĐIỂM: header tím; "Tên gợi nhớ" + ô xám "Ví dụ: Trường học / Gym";
// "Địa chỉ" + link "Thay đổi địa chỉ"; dòng chấm tím + "Nhập địa điểm bạn thêm" / địa chỉ bold;
// nút đáy "Lưu địa điểm" (xám → tím). id param → chế độ chỉnh sửa (+ "Xoá địa điểm").
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, NO_WEB_OUTLINE } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, TextField, StopMarker, Dialog, fontStyle, type IconName } from '@/components/ui';
import { savedLocationsStore, savedLocationActions } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

function iconForName(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes('nhà') || n.includes('home')) return 'ion:home-outline';
  if (n.includes('công ty') || n.includes('cty') || n.includes('văn phòng') || n.includes('office')) return 'ion:business-outline';
  if (n.includes('trường') || n.includes('school')) return 'ion:school-outline';
  if (n.includes('gym') || n.includes('thể')) return 'ion:barbell-outline';
  return 'ion:bookmark-outline';
}

export default function AddSavedLocationScreen() {
  useStatusBarStyle('light');
  const raw = useLocalSearchParams<{ id?: string; address?: string }>();
  const id = paramStr(raw.id);
  const existing = useMemo(() => (id ? savedLocationsStore.get().find((l) => l.id === id) : undefined), [id]);

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? paramStr(raw.address));
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Nhận địa chỉ trả về từ màn chọn địa điểm (nếu có param)
  useEffect(() => {
    const a = paramStr(raw.address);
    if (a) setAddress(a);
  }, [raw.address]);

  const canSave = name.trim().length >= 2 && address.trim().length >= 5;

  const handleSave = () => {
    if (!canSave) return;
    savedLocationActions.add({
      id: existing?.id,
      name: name.trim(),
      address: address.trim(),
      icon: existing?.icon ?? iconForName(name),
    });
    router.back();
  };

  return (
    <Screen
      header={<AppHeader title={existing ? 'Chỉnh sửa địa điểm' : 'Thêm vào địa điểm'} variant="dark" left="back" />}
      footer={<Button title="Lưu địa điểm" flat onPress={handleSave} disabled={!canSave} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <TextField label="Tên gợi nhớ" value={name} onChangeText={setName} placeholder="Ví dụ: Trường học / Gym" autoCapitalize="words" />

        <View style={styles.addressHeader}>
          <AppText size={13} weight="medium" color={Colors.text}>
            Địa chỉ
          </AppText>
          <Pressable
            onPress={() => router.push({ pathname: '/booking/location', params: { returnTo: '/profile/saved-locations/add', id } })}
            hitSlop={8}
          >
            <AppText size={13} weight="semiBold" color={Colors.primary}>
              Thay đổi địa chỉ
            </AppText>
          </Pressable>
        </View>

        <View style={styles.addressRow}>
          <StopMarker type="pickup" size={16} />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa điểm bạn thêm"
            placeholderTextColor={Colors.placeholder}
            multiline
            style={[styles.addressInput, fontStyle('bold')]}
          />
        </View>

        {existing ? (
          <Button title="Xoá địa điểm" variant="ghost" onPress={() => setConfirmDelete(true)} textStyle={{ color: Colors.error }} style={styles.deleteBtn} />
        ) : null}
      </View>

      <Dialog
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xoá địa điểm này?"
        message={existing ? `"${existing.name}" sẽ bị xoá khỏi danh sách vị trí đã lưu.` : undefined}
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setConfirmDelete(false) },
          {
            label: 'Xoá',
            variant: 'danger',
            onPress: () => {
              if (existing) savedLocationActions.remove(existing.id);
              setConfirmDelete(false);
              router.back();
            },
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: BorderRadius.xs,
  },
  addressInput: { flex: 1, marginLeft: Spacing.md, fontSize: 16, color: Colors.text, paddingVertical: 0, minHeight: 24, lineHeight: 22, ...NO_WEB_OUTLINE },
  deleteBtn: { marginTop: Spacing['2xl'] },
});
