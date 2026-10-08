// Thêm vào địa điểm — Figma THÊM VÀO ĐỊA ĐIỂM: header tím; loại (Nhà / Công ty / Khác) + "Tên gợi nhớ";
// "Địa chỉ": ô tìm địa điểm (API places — chọn gợi ý để có toạ độ thật) hoặc vị trí hiện tại; liên hệ tại địa chỉ
// (tuỳ chọn — điền sẵn người nhận khi giao hàng); nút đáy "Lưu địa điểm". id param → chỉnh sửa (+ "Xoá địa điểm").
// POST / PATCH / DELETE /v1/customer/addresses — mỗi loại Nhà / Công ty chỉ 1, tối đa 20 địa điểm.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, NO_WEB_OUTLINE } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, Chip, TextField, StopMarker, Dialog, ErrorSheet, Icon, Icons, fontStyle } from '@/components/ui';
import {
  createSavedAddress,
  deleteSavedAddress,
  loadSavedAddresses,
  updateSavedAddress,
  useSavedAddresses,
  SAVED_KIND_LABEL,
  type SavedAddressKind,
} from '@/services/addresses';
import { autocompletePlaces, newPlacesSession, placeDetail, reversePlace, type PlaceSuggestion } from '@/services/places';
import { isValidPhoneVn } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';
import { useCurrentLocation } from '@/components/booking';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  return v != null ? String(v) : '';
}

type Picked = { address: string; lat: number; lng: number };

const KINDS: SavedAddressKind[] = ['home', 'work', 'other'];

export default function AddSavedLocationScreen() {
  useStatusBarStyle('light');
  const raw = useLocalSearchParams<{ id?: string }>();
  const id = paramStr(raw.id);
  const list = useSavedAddresses();
  const existing = useMemo(() => (id ? (list ?? []).find((a) => a.id === id) : undefined), [id, list]);
  const gps = useCurrentLocation();
  const session = useMemo(newPlacesSession, []);

  const [kind, setKind] = useState<SavedAddressKind>('other');
  const [label, setLabel] = useState('');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const filledFor = useRef<string | null>(null);

  useEffect(() => {
    if (list === null) void loadSavedAddresses().catch(() => undefined);
  }, [list]);

  // Chế độ sửa: nạp dữ liệu đã lưu (1 lần)
  useEffect(() => {
    if (!existing || filledFor.current === existing.id) return;
    filledFor.current = existing.id;
    setKind(existing.kind);
    setLabel(existing.label);
    setPicked({ address: existing.address, lat: existing.lat, lng: existing.lng });
    setContactName(existing.contactName ?? '');
    setContactPhone(existing.contactPhone ?? '');
    setNote(existing.note ?? '');
  }, [existing]);

  // Tìm địa điểm (chờ 300ms sau khi gõ)
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const my = ++seq.current;
    setSearching(true);
    const t = setTimeout(() => {
      autocompletePlaces(text, gps ? { lat: gps.latitude, lng: gps.longitude } : null, session)
        .then((items) => my === seq.current && setSuggestions(items))
        .catch((e) => my === seq.current && setError(errorMessage(e, 'Không tìm được địa điểm')))
        .finally(() => my === seq.current && setSearching(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, session]);

  const choose = async (s: PlaceSuggestion) => {
    setResolving(true);
    try {
      const d = await placeDetail(s.placeId, session);
      setPicked({ address: d.address, lat: d.lat, lng: d.lng });
      if (!label.trim() && kind === 'other') setLabel(d.name ?? s.title);
      setQuery('');
      setSuggestions([]);
    } catch (e) {
      setError(errorMessage(e, 'Không lấy được vị trí của địa điểm này'));
    } finally {
      setResolving(false);
    }
  };

  const pickCurrent = async () => {
    if (!gps) return;
    setResolving(true);
    try {
      const p = await reversePlace(gps.latitude, gps.longitude);
      setPicked({ address: p.address, lat: p.lat, lng: p.lng });
    } catch (e) {
      setError(errorMessage(e, 'Không xác định được địa chỉ vị trí hiện tại'));
    } finally {
      setResolving(false);
    }
  };

  const takenKind = (k: SavedAddressKind) => k !== 'other' && (list ?? []).some((a) => a.kind === k && a.id !== existing?.id);
  const finalLabel = label.trim() || (kind !== 'other' ? SAVED_KIND_LABEL[kind] : '');
  const phoneOk = !contactPhone.trim() || isValidPhoneVn(contactPhone);
  const canSave = !!picked && finalLabel.length >= 1 && phoneOk && !saving && !takenKind(kind);

  const handleSave = async () => {
    if (!canSave || !picked) return;
    setSaving(true);
    const body = {
      kind,
      label: finalLabel,
      address: picked.address,
      lat: picked.lat,
      lng: picked.lng,
      note: note.trim() || null,
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
    };
    try {
      if (existing) await updateSavedAddress(existing.id, body);
      else await createSavedAddress(body);
      router.back();
    } catch (e) {
      setError(errorMessage(e, 'Không lưu được địa điểm'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setConfirmDelete(false);
    try {
      await deleteSavedAddress(existing.id);
      router.back();
    } catch (e) {
      setError(errorMessage(e, 'Không xoá được địa điểm'));
    }
  };

  return (
    <Screen
      header={<AppHeader title={existing ? 'Chỉnh sửa địa điểm' : 'Thêm vào địa điểm'} variant="dark" left="back" />}
      footer={<Button title="Lưu địa điểm" flat onPress={() => void handleSave()} disabled={!canSave} loading={saving} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <View style={styles.kinds}>
          {KINDS.map((k) => (
            <Chip
              key={k}
              label={SAVED_KIND_LABEL[k]}
              icon={k === 'home' ? Icons.homeAddr : k === 'work' ? Icons.office : Icons.bookmark}
              active={kind === k}
              onPress={takenKind(k) ? undefined : () => setKind(k)}
              style={[styles.kindChip, takenKind(k) && { opacity: 0.4 }]}
            />
          ))}
        </View>
        {takenKind('home') || takenKind('work') ? (
          <AppText size={12} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
            Mỗi loại Nhà / Công ty chỉ lưu được 1 địa điểm.
          </AppText>
        ) : null}

        <TextField
          label="Tên gợi nhớ"
          value={label}
          onChangeText={setLabel}
          placeholder={kind === 'other' ? 'Ví dụ: Trường học / Gym' : SAVED_KIND_LABEL[kind]}
          autoCapitalize="words"
          containerStyle={{ marginTop: Spacing.lg }}
        />

        <AppText size={13} weight="medium" color={Colors.text} style={{ marginTop: Spacing.xl }}>
          Địa chỉ
        </AppText>
        {picked ? (
          <View style={styles.addressRow}>
            <StopMarker type="pickup" size={16} />
            <AppText size={16} weight="bold" style={{ flex: 1, marginLeft: Spacing.md }}>
              {picked.address}
            </AppText>
            <Pressable onPress={() => setPicked(null)} hitSlop={8}>
              <AppText size={13} weight="semiBold" color={Colors.primary}>
                Đổi
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.addressRow}>
              <StopMarker type="pickup" size={16} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Nhập địa điểm bạn thêm"
                placeholderTextColor={Colors.placeholder}
                style={[styles.addressInput, fontStyle('bold')]}
              />
              {searching || resolving ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </View>
            {gps ? (
              <Pressable onPress={() => void pickCurrent()} style={styles.suggestion}>
                <Icon name={Icons.location} size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                <AppText size={14} weight="semiBold" color={Colors.primary}>
                  Dùng vị trí hiện tại
                </AppText>
              </Pressable>
            ) : null}
            {suggestions.map((s) => (
              <Pressable key={s.placeId} onPress={() => void choose(s)} style={styles.suggestion}>
                <View style={{ flex: 1 }}>
                  <AppText size={15} weight="bold" numberOfLines={1}>
                    {s.title}
                  </AppText>
                  {s.subtitle ? (
                    <AppText size={12} color={Colors.textSecondary} numberOfLines={1}>
                      {s.subtitle}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </>
        )}

        <AppText size={13} weight="medium" color={Colors.text} style={{ marginTop: Spacing.xl }}>
          Người liên hệ tại địa chỉ (không bắt buộc)
        </AppText>
        <TextField value={contactName} onChangeText={setContactName} placeholder="Họ và tên" autoCapitalize="words" containerStyle={{ marginTop: Spacing.sm }} />
        <TextField
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          error={phoneOk ? undefined : 'Số điện thoại không hợp lệ'}
          containerStyle={{ marginTop: Spacing.sm }}
        />
        <TextField label="Ghi chú" value={note} onChangeText={setNote} placeholder="Vd: cổng sau, tầng 3" containerStyle={{ marginTop: Spacing.lg }} />

        {existing ? (
          <Button title="Xoá địa điểm" variant="ghost" onPress={() => setConfirmDelete(true)} textStyle={{ color: Colors.error }} style={styles.deleteBtn} />
        ) : null}
      </View>

      <Dialog
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xoá địa điểm này?"
        message={existing ? `"${existing.label}" sẽ bị xoá khỏi danh sách vị trí đã lưu.` : undefined}
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setConfirmDelete(false) },
          { label: 'Xoá', variant: 'danger', onPress: () => void handleDelete() },
        ]}
      />
      <ErrorSheet visible={!!error} title="Có lỗi xảy ra" message={error ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  kinds: { flexDirection: 'row', gap: Spacing.sm },
  kindChip: { flex: 1, justifyContent: 'center' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: BorderRadius.xs,
  },
  addressInput: { flex: 1, marginLeft: Spacing.md, fontSize: 16, color: Colors.text, paddingVertical: 0, minHeight: 24, ...NO_WEB_OUTLINE },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  deleteBtn: { marginTop: Spacing['2xl'] },
});
