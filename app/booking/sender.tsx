// app/booking/sender.tsx — GH 1.3 "Thông tin người gửi" (giao hàng / gọi thợ): địa chỉ + họ tên, SĐT → "Xác Nhận"
// Dọn nhà: thêm tầng/thang máy của nhà cũ (điểm đi) — gửi kèm ghi chú đơn cho đội chuyển nhà.
// Gọi thợ: mô tả sự cố/khẩn cấp hỏi ở bước chọn loại thợ (HandymanJobDialog), KHÔNG hỏi ở đây.
// Chở khách (Xe máy / Xe hơi / Xe đường dài / Tài xế lái thay): chỉ địa chỉ + bản đồ tràn khung (chạm để đổi) → "Xác Nhận";
// tên/SĐT lấy sẵn từ hồ sơ đăng nhập (hydrateSender), không cần hỏi lại.
// "Dán từ Zalo": điền tên/SĐT; địa chỉ tách được mở màn tìm địa điểm (điền sẵn chữ) để khách chọn đúng địa điểm thật.
import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Icon, Icons, Screen, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/booking';
import { useBooking, setSenderInfo, setOptions, isValidPhoneVn } from '@/services/bookingStore';
import { AddressBlock, AddressMapPreview, FlatFooter, FloorAccessPicker, ZaloPasteSheet, type MapStop } from '@/components/booking';

export default function SenderScreen() {
  const state = useBooking();
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isRide = group.kind === 'ride';
  const isRental = state.service === 'rental';
  const [name, setName] = useState(state.sender.name);
  const [phone, setPhone] = useState(state.sender.phone);
  const [floor, setFloor] = useState(state.options.movingFloorFrom);
  const [elevator, setElevator] = useState(state.options.movingElevatorFrom);
  const [zaloPaste, setZaloPaste] = useState(false);
  const place = state.sender.place;
  const valid = isRide ? !!place : name.trim().length >= 2 && isValidPhoneVn(phone) && !!place;

  const openPicker = (q?: string) => router.push({ pathname: '/booking/location', params: { target: 'sender', ...(q ? { q } : {}) } });

  const mapStops = useMemo<MapStop[]>(() => {
    if (!place) return [];
    return [{ id: 'pickup', lat: place.lat, lng: place.lng, type: 'pickup', label: labels.mapPickupLabel }];
  }, [place, labels]);

  const confirm = () => {
    if (!isRide) setSenderInfo({ name: name.trim(), phone: phone.trim() });
    if (isRental) setOptions({ movingFloorFrom: floor, movingElevatorFrom: elevator });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
  };

  // "Dán từ Zalo": chỉ ghi đè trường nào thực sự tách được; địa chỉ phải chọn lại từ gợi ý (cần toạ độ thật)
  const applyZaloPaste = (r: { name: string; phone: string; address: string; note: string }) => {
    if (r.name) setName(r.name);
    if (r.phone) setPhone(r.phone);
    if (r.address) openPicker(r.address);
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title={labels.senderScreenTitle} left="arrow" />}
      scroll={!isRide}
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Xác Nhận" disabled={!valid} onPress={confirm} />}
    >
      {isRide ? (
        <AddressMapPreview
          address={place?.address}
          placeholder={labels.senderLocationPlaceholder}
          markerType="pickup"
          stops={mapStops}
          showRoute={false}
          hintLabel={`Chạm để đổi ${labels.mapPickupLabel.toLowerCase()}`}
          onChange={() => openPicker()}
        />
      ) : (
        <View style={styles.body}>
          <AddressBlock address={place?.address} placeholder={labels.senderLocationPlaceholder} onChange={() => openPicker()} />

          <Pressable onPress={() => setZaloPaste(true)} style={styles.zaloRow}>
            <Icon name={Icons.paste} size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
            <AppText size={14} weight="bold" color={Colors.primary}>
              Dán từ Zalo/Messenger — tự điền tên, SĐT, địa chỉ
            </AppText>
          </Pressable>

          <TextField
            label={labels.senderNameLabel}
            required
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên"
            autoCapitalize="words"
            containerStyle={{ marginTop: Spacing.base }}
          />
          <TextField
            label="Số điện thoại"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder={labels.senderPhonePlaceholder}
            keyboardType="phone-pad"
            error={phone.trim() && !isValidPhoneVn(phone) ? 'Số điện thoại không hợp lệ' : undefined}
            containerStyle={{ marginTop: Spacing.base }}
          />

          {isRental ? <FloorAccessPicker label="Nhà/căn hộ cũ" floor={floor} elevator={elevator} onFloorChange={setFloor} onElevatorChange={setElevator} /> : null}
        </View>
      )}
      <ZaloPasteSheet visible={zaloPaste} onClose={() => setZaloPaste(false)} includeContact onApply={applyZaloPaste} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen },
  zaloRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
});
