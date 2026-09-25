// app/booking/location.tsx — GH 1.3.1 "Lựa chọn địa điểm" (người gửi) / GH 1.4 "Thêm điểm gửi hàng" (người nhận)
// Params: target=sender|receiver, index (người nhận), back=1 (quay lại màn trước thay vì mở màn thông tin người nhận)
// Xe đường dài: dùng ĐÚNG 1 giao diện nhập địa chỉ như Đặt xe / Giao hàng (ô tìm kiếm, gợi ý theo khoảng
// cách, "Dùng địa chỉ đã nhập" khi không khớp) — chỉ khác nguồn gợi ý mặc định là các tỉnh/thành đang có
// tuyến xe ghép & vé xe (constants/mockIntercity.ts) thay vì các địa điểm đã lưu trong TP.HCM.
// "Dán từ Zalo" luôn nằm sát dưới ô nhập địa chỉ (không đặt ở footer) — "Chọn trên bản đồ" ở footer.
import React, { useMemo, useState } from 'react';
import { View, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, Icon, Icons, Screen, StopMarker, fontStyle } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Sizes, NO_WEB_OUTLINE } from '@/constants/theme';
import { SAMPLE_PLACES, SAVED_LOCATIONS, HCM_CENTER, SERVICE_GROUPS, INTERCITY_CITIES, type SamplePlace, type IntercityCity } from '@/constants/mockBooking';
import { useBooking, setSenderPlace, setReceiverPlace, placeFromSample, haversineKm, type Place } from '@/services/bookingStore';
import { ZaloPasteSheet } from '@/components/booking';

type Result = SamplePlace & { km: number };

const cityAsPlace = (c: IntercityCity): SamplePlace => ({
  id: c.id,
  title: c.name,
  address: `${c.station.name}, ${c.station.address}`,
  lat: c.station.lat,
  lng: c.station.lng,
});

export default function LocationScreen() {
  const { target, index: indexParam, back } = useLocalSearchParams<{ target?: string; index?: string; back?: string }>();
  const isReceiver = target === 'receiver';
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isIntercityDest = isReceiver && state.service === 'intercity';
  const current = isReceiver ? state.receivers[index]?.place : state.sender.place;
  const [query, setQuery] = useState(current && current.source !== 'default' ? current.address : '');
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>(() => Object.fromEntries(SAMPLE_PLACES.filter((p) => p.saved).map((p) => [p.id, true])));
  const [zaloPaste, setZaloPaste] = useState(false);
  const origin = state.sender.place ?? HCM_CENTER;

  // Xe đường dài: gợi ý mặc định là các tỉnh/thành đang có tuyến (thay cho "Vị trí đã lưu" trong TP.HCM) —
  // nhưng cùng 1 kiểu tìm kiếm/lọc/hiển thị như Đặt xe & Giao hàng bên dưới.
  const pool = useMemo<SamplePlace[]>(() => (isIntercityDest ? INTERCITY_CITIES.map(cityAsPlace) : SAMPLE_PLACES), [isIntercityDest]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const list = !dirty || !q ? pool : pool.filter((p) => `${p.title} ${p.address}`.toLowerCase().includes(q));
    return list.map((p) => ({ ...p, km: haversineKm(origin, p) })).sort((a, b) => a.km - b.km);
  }, [query, dirty, origin, pool]);

  const finish = (place: Place) => {
    if (isReceiver) {
      setReceiverPlace(index, place);
      // Chở khách: điểm đến không cần tên/SĐT → quay thẳng về màn đặt
      if (back === '1' || group.kind !== 'delivery') router.back();
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

  const openMapPicker = () => router.push({ pathname: '/booking/pick-on-map', params: { target, index: String(index), back } });

  // "Dán từ Zalo": chỉ cần địa chỉ ở màn này (tên/SĐT được điền ở màn Thông tin người gửi/nhận) — chọn xong đi thẳng
  const applyZaloPaste = (r: { address: string }) => {
    if (!r.address) return;
    choose({ id: `zalo-${Date.now()}`, title: r.address, address: r.address, lat: origin.lat + 0.012, lng: origin.lng + 0.008 });
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title={isReceiver ? labels.receiverLocationTitle : labels.senderLocationTitle} left="close" />}
      keyboardAvoiding={false}
      footer={
        <Pressable onPress={openMapPicker} style={styles.mapFooterRow}>
          <Icon name={Icons.map} size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} />
          <AppText size={16} weight="bold" color={Colors.primary} style={{ flex: 1 }}>
            Chọn trên bản đồ
          </AppText>
          <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
        </Pressable>
      }
    >
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <StopMarker type={isReceiver ? 'dropoff' : 'pickup'} size={16} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setDirty(true);
            }}
            placeholder={isReceiver ? labels.receiverLocationPlaceholder : labels.senderLocationPlaceholder}
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

        {/* Luôn nằm sát dưới khung nhập địa chỉ, không phụ thuộc danh sách gợi ý dài/ngắn */}
        <Pressable onPress={() => setZaloPaste(true)} style={styles.zaloRow}>
          <Icon name={Icons.paste} size={20} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
          <AppText size={15} weight="bold" color={Colors.primary} style={{ flex: 1 }}>
            Dán từ Zalo/Messenger
          </AppText>
          <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
        </Pressable>

        {isIntercityDest ? null : (
          <View style={styles.chips}>
            {SAVED_LOCATIONS.map((s) => (
              <Chip key={s.key} label={s.label} icon={s.icon} onPress={() => choose(s.place, 'saved')} size="sm" style={styles.chip} />
            ))}
            <Chip label="Thêm địa điểm" icon={Icons.bookmark} onPress={() => router.push('/profile/saved-locations/add')} size="sm" style={styles.chip} />
          </View>
        )}
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
      <ZaloPasteSheet visible={zaloPaste} onClose={() => setZaloPaste(false)} includeContact={false} onApply={applyZaloPaste} />
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
  input: { flex: 1, fontSize: 16, color: Colors.text, marginLeft: Spacing.sm, paddingVertical: 0, height: Sizes.input - 3, ...NO_WEB_OUTLINE },
  zaloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
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
  mapFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
