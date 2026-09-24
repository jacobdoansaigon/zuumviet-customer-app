// app/booking/location.tsx — GH 1.3.1 "Lựa chọn địa điểm" (người gửi) / GH 1.4 "Thêm điểm gửi hàng" (người nhận)
// Params: target=sender|receiver, index (người nhận), back=1 (quay lại màn trước thay vì mở màn thông tin người nhận)
import React, { useMemo, useState } from 'react';
import { View, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, Icon, Icons, Screen, StopMarker, fontStyle } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Sizes } from '@/constants/theme';
import { SAMPLE_PLACES, SAVED_LOCATIONS, HCM_CENTER, type SamplePlace } from '@/constants/mockBooking';
import { useBooking, setSenderPlace, setReceiverPlace, placeFromSample, haversineKm, type Place } from '@/services/bookingStore';

type Result = SamplePlace & { km: number };

export default function LocationScreen() {
  const { target, index: indexParam, back } = useLocalSearchParams<{ target?: string; index?: string; back?: string }>();
  const isReceiver = target === 'receiver';
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const current = isReceiver ? state.receivers[index]?.place : state.sender.place;
  const [query, setQuery] = useState(current && current.source !== 'default' ? current.address : '');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>(() => Object.fromEntries(SAMPLE_PLACES.filter((p) => p.saved).map((p) => [p.id, true])));
  const origin = state.sender.place ?? HCM_CENTER;

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const list = !dirty || !q ? SAMPLE_PLACES : SAMPLE_PLACES.filter((p) => `${p.title} ${p.address}`.toLowerCase().includes(q));
    return list.map((p) => ({ ...p, km: haversineKm(origin, p) })).sort((a, b) => a.km - b.km);
  }, [query, dirty, origin]);

  const finish = (place: Place) => {
    if (isReceiver) {
      setReceiverPlace(index, place);
      if (back === '1') router.back();
      else router.replace({ pathname: '/booking/receiver', params: { index: String(index) } });
    } else {
      setSenderPlace(place);
      router.back();
    }
  };

  const choose = (p: SamplePlace, source: Place['source'] = 'search') => finish(placeFromSample(p, source));

  // Địa chỉ tự nhập (chưa có geocoding): toạ độ lệch nhẹ quanh điểm gửi để vẫn vẽ được lộ trình
  const chooseTyped = () => {
    const q = query.trim();
    if (!q) return;
    choose({ id: `typed-${Date.now()}`, title: q, address: q, lat: origin.lat + 0.012, lng: origin.lng + 0.008 });
  };

  const showTyped = dirty && query.trim().length > 3 && !results.some((r) => r.address.toLowerCase() === query.trim().toLowerCase());

  return (
    <Screen header={<AppHeader variant="dark" title={isReceiver ? 'Thêm điểm gửi hàng' : 'Lựa chọn địa điểm'} left="close" />} keyboardAvoiding={false}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <StopMarker type="pickup" size={16} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setDirty(true);
            }}
            placeholder={isReceiver ? 'Nhập địa chỉ người nhận' : 'Nhập địa chỉ lấy hàng'}
            placeholderTextColor={Colors.placeholder}
            style={[styles.input, fontStyle('bold')]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={chooseTyped}
          />
          {query ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setDirty(true);
              }}
              hitSlop={8}
            >
              <Icon name={Icons.closeCircle} size={18} color={Colors.gray400} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.chips}>
          {SAVED_LOCATIONS.map((s) => (
            <Chip key={s.key} label={s.label} icon={s.icon} onPress={() => choose(s.place, 'saved')} size="sm" style={styles.chip} />
          ))}
          <Chip label="Thêm địa điểm" icon={Icons.bookmark} onPress={() => router.push('/profile/saved-locations/add')} size="sm" style={styles.chip} />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        ListHeaderComponent={
          showTyped ? (
            <Pressable onPress={chooseTyped} style={styles.row}>
              <Icon name={Icons.location} size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} />
              <View style={{ flex: 1 }}>
                <AppText weight="bold" size={16} numberOfLines={1}>
                  {query.trim()}
                </AppText>
                <AppText size={13} color={Colors.textSecondary}>
                  Dùng địa chỉ đã nhập
                </AppText>
              </View>
              <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <AppText size={15} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing['2xl'] }}>
            Không tìm thấy địa điểm phù hợp
          </AppText>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={16} numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
                {item.km.toFixed(2)}km - {item.address}
              </AppText>
            </View>
            <Pressable onPress={() => setSaved((s) => ({ ...s, [item.id]: !s[item.id] }))} hitSlop={10} accessibilityLabel="Lưu địa điểm">
              <Icon name={saved[item.id] ? Icons.bookmarkFilled : Icons.bookmark} size={22} color={saved[item.id] ? Colors.primary : Colors.gray400} />
            </Pressable>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Sizes.input,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, fontSize: 16, color: Colors.text, marginLeft: Spacing.sm, paddingVertical: 0, height: Sizes.input - 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md },
  chip: { marginRight: Spacing.sm, marginBottom: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
});
