// app/booking/location.tsx — GH 1.3.1 "Lựa chọn địa điểm" (người gửi) / GH 1.4 "Thêm điểm gửi hàng" (người nhận)
// Params: target=sender|receiver, index (người nhận), back=1 (quay lại màn trước thay vì mở màn thông tin người nhận),
// q (chữ điền sẵn — vd địa chỉ tách từ "Dán từ Zalo").
// Gợi ý từ API places (autocomplete → chọn → lấy toạ độ thật), vị trí đã lưu (API), vị trí hiện tại (GPS → đảo địa chỉ).
// Xe đường dài (điểm đến): gợi ý mặc định là bến xe các tỉnh/thành đang có tuyến (API intercity/cities).
// Không còn "dùng địa chỉ đã nhập" với toạ độ tự chế — giá tính theo toạ độ nên địa điểm phải đến từ API/bản đồ.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, Icon, Icons, Screen, StopMarker, fontStyle, useBlurOnLeave } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Sizes, NO_WEB_OUTLINE } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/booking';
import { useBooking, setSenderPlace, setReceiverPlace, updateReceiver, type Place } from '@/services/bookingStore';
import { autocompletePlaces, newPlacesSession, placeDetail, reversePlace, type PlaceSuggestion } from '@/services/places';
import { loadSavedAddresses, useSavedAddresses, SAVED_KIND_LABEL, type SavedAddress } from '@/services/addresses';
import { destinationCities, ensureIntercityCities, useIntercityCities, type IntercityCity } from '@/services/intercity';
import { errorMessage } from '@/services/zuum';
import { ZaloPasteSheet, useCurrentLocation } from '@/components/booking';

type Row =
  | { kind: 'suggestion'; key: string; item: PlaceSuggestion }
  | { kind: 'saved'; key: string; item: SavedAddress }
  | { kind: 'city'; key: string; item: IntercityCity };

const fmtKm = (m: number | null) => (m == null ? '' : m >= 1000 ? `${(m / 1000).toFixed(1)}km - ` : `${Math.round(m)}m - `);

export default function LocationScreen() {
  const { target, index: indexParam, back, q } = useLocalSearchParams<{ target?: string; index?: string; back?: string; q?: string }>();
  const isReceiver = target === 'receiver';
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isIntercityDest = isReceiver && state.service === 'intercity';
  const saved = useSavedAddresses();
  const cities = useIntercityCities();
  const gps = useCurrentLocation();
  const session = useMemo(newPlacesSession, []);

  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [zaloPaste, setZaloPaste] = useState(false);
  const reqSeq = useRef(0);
  const searchRef = useRef<TextInput>(null);
  useBlurOnLeave(searchRef);
  const near = state.sender.place ?? (gps ? { lat: gps.latitude, lng: gps.longitude } : null);

  useEffect(() => {
    void loadSavedAddresses().catch(() => undefined);
    if (isIntercityDest) void ensureIntercityCities().catch(() => undefined);
  }, [isIntercityDest]);

  // Gõ tìm: chờ 300ms rồi gọi autocomplete (bỏ kết quả của lần gõ cũ)
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setError(null);
      return;
    }
    const seq = ++reqSeq.current;
    setSearching(true);
    const t = setTimeout(() => {
      autocompletePlaces(text, isIntercityDest ? null : near, session)
        .then((items) => {
          if (seq !== reqSeq.current) return;
          setSuggestions(items);
          setError(null);
        })
        .catch((e) => {
          if (seq !== reqSeq.current) return;
          setSuggestions([]);
          setError(errorMessage(e, 'Không tìm được địa điểm'));
        })
        .finally(() => {
          if (seq === reqSeq.current) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isIntercityDest, session]);

  const finish = (place: Place, contact?: { name: string | null; phone: string | null }) => {
    if (isReceiver) {
      setReceiverPlace(index, place);
      const r = state.receivers[index];
      if (contact && group.kind === 'delivery' && r && !r.name && !r.phone && contact.name && contact.phone) {
        updateReceiver(index, { name: contact.name, phone: contact.phone });
      }
      // Chở khách: điểm đến không cần tên/SĐT → quay thẳng về màn đặt
      if (back === '1' || group.kind !== 'delivery') router.back();
      else router.replace({ pathname: '/booking/receiver', params: { index: String(index) } });
    } else {
      setSenderPlace(place);
      router.back();
    }
  };

  const chooseSuggestion = async (s: PlaceSuggestion) => {
    if (resolving) return;
    setResolving(s.placeId);
    try {
      const d = await placeDetail(s.placeId, session);
      finish({ title: d.name ?? s.title, address: d.address, lat: d.lat, lng: d.lng, placeId: d.placeId, source: 'search' });
    } catch (e) {
      setError(errorMessage(e, 'Không lấy được vị trí của địa điểm này'));
    } finally {
      setResolving(null);
    }
  };

  const chooseSaved = (a: SavedAddress) =>
    finish({ title: a.label, address: a.address, lat: a.lat, lng: a.lng, savedAddressId: a.id, source: 'saved' }, { name: a.contactName, phone: a.contactPhone });

  const chooseCity = (c: IntercityCity) =>
    finish({ title: c.name, address: `${c.stationName}, ${c.stationAddress}`, lat: c.stationLat, lng: c.stationLng, source: 'search' });

  const chooseCurrent = async () => {
    if (!gps || resolving) return;
    setResolving('gps');
    try {
      const p = await reversePlace(gps.latitude, gps.longitude);
      finish({ title: p.name ?? 'Vị trí hiện tại', address: p.address, lat: p.lat, lng: p.lng, placeId: p.placeId, source: 'gps' });
    } catch (e) {
      setError(errorMessage(e, 'Không xác định được địa chỉ vị trí hiện tại'));
    } finally {
      setResolving(null);
    }
  };

  const typing = query.trim().length >= 2;
  const rows: Row[] = typing
    ? suggestions.map((item) => ({ kind: 'suggestion', key: item.placeId, item }))
    : isIntercityDest
      ? destinationCities(cities).map((item) => ({ kind: 'city', key: item.id, item }))
      : (saved ?? []).map((item) => ({ kind: 'saved', key: item.id, item }));

  const quickSaved = (saved ?? []).filter((a) => a.kind === 'home' || a.kind === 'work');
  const openMapPicker = () => router.push({ pathname: '/booking/pick-on-map', params: { target, index: String(index), back } });

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
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder={isReceiver ? labels.receiverLocationPlaceholder : labels.senderLocationPlaceholder}
            placeholderTextColor={Colors.placeholder}
            style={[styles.input, fontStyle('bold')]}
            autoFocus
            returnKeyType="search"
          />
          {searching ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
          {query && !searching ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
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
            {quickSaved.map((a) => (
              <Chip key={a.id} label={a.label || SAVED_KIND_LABEL[a.kind]} icon={a.kind === 'home' ? Icons.homeAddr : Icons.office} onPress={() => chooseSaved(a)} size="sm" style={styles.chip} />
            ))}
            <Chip label="Thêm địa điểm" icon={Icons.bookmark} onPress={() => router.push('/profile/saved-locations/add')} size="sm" style={styles.chip} />
          </View>
        )}

        {error ? (
          <AppText size={13} color={Colors.error} style={{ marginTop: Spacing.xs }}>
            {error}
          </AppText>
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.kind}-${r.key}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        ListHeaderComponent={
          typing ? null : (
            <>
              {gps && !isIntercityDest ? (
                <Pressable onPress={() => void chooseCurrent()} style={styles.row}>
                  <Icon name={Icons.location} size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" size={16}>
                      Vị trí hiện tại
                    </AppText>
                    <AppText size={13} color={Colors.textSecondary}>
                      Dùng vị trí GPS của bạn
                    </AppText>
                  </View>
                  {resolving === 'gps' ? <ActivityIndicator size="small" color={Colors.primary} /> : <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />}
                </Pressable>
              ) : null}
              {rows.length ? (
                <AppText size={12} weight="semiBold" color={Colors.textSecondary} style={styles.listLabel}>
                  {isIntercityDest ? 'Tỉnh/thành đang có tuyến' : 'Vị trí đã lưu'}
                </AppText>
              ) : null}
            </>
          )
        }
        ListEmptyComponent={
          typing && !searching && !error ? (
            <AppText size={15} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing['2xl'], paddingHorizontal: Spacing.xl }}>
              Không tìm thấy địa điểm phù hợp — thử gõ khác đi hoặc chọn trên bản đồ
            </AppText>
          ) : null
        }
        renderItem={({ item: row }) => {
          if (row.kind === 'suggestion') {
            const s = row.item;
            return (
              <Pressable onPress={() => void chooseSuggestion(s)} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={16} numberOfLines={1}>
                    {s.title}
                  </AppText>
                  <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
                    {fmtKm(s.distanceMeters)}
                    {s.subtitle ?? ''}
                  </AppText>
                </View>
                {resolving === s.placeId ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
              </Pressable>
            );
          }
          if (row.kind === 'city') {
            const c = row.item;
            return (
              <Pressable onPress={() => chooseCity(c)} style={styles.row}>
                <Icon name="mci:bus-stop" size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} />
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size={16} numberOfLines={1}>
                    {c.name}
                  </AppText>
                  <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
                    {c.stationName} · {c.stationAddress}
                  </AppText>
                </View>
              </Pressable>
            );
          }
          const a = row.item;
          return (
            <Pressable onPress={() => chooseSaved(a)} style={styles.row}>
              <Icon name={a.kind === 'home' ? Icons.homeAddr : a.kind === 'work' ? Icons.office : Icons.bookmarkFilled} size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} />
              <View style={{ flex: 1 }}>
                <AppText weight="bold" size={16} numberOfLines={1}>
                  {a.label}
                </AppText>
                <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
                  {a.address}
                </AppText>
              </View>
            </Pressable>
          );
        }}
      />
      <ZaloPasteSheet visible={zaloPaste} onClose={() => setZaloPaste(false)} includeContact={false} onApply={(r) => r.address && setQuery(r.address)} />
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
  listLabel: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
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
