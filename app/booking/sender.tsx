// app/booking/sender.tsx — GH 1.3 "Thông tin người gửi" (giao hàng / gọi thợ): địa chỉ + họ tên (danh bạ), SĐT → "Xác Nhận"
// Chở khách (Xe máy / Xe hơi / Xe đường dài / Gọi tài xế): chỉ địa chỉ + bản đồ tràn khung (chạm để đổi) → "Xác Nhận";
// tên/SĐT lấy sẵn từ hồ sơ đăng nhập (hydrateSender), không cần hỏi lại.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Icons, Screen, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { SERVICE_GROUPS } from '@/constants/mockBooking';
import { useBooking, setSenderInfo, isValidPhoneVn } from '@/services/bookingStore';
import { AddressBlock, AddressMapPreview, ContactPickerSheet, FlatFooter, type MapStop } from '@/components/booking';

export default function SenderScreen() {
  const state = useBooking();
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isRide = group.kind === 'ride';
  const [name, setName] = useState(state.sender.name);
  const [phone, setPhone] = useState(state.sender.phone);
  const [contacts, setContacts] = useState(false);
  const place = state.sender.place;
  const valid = isRide ? !!place : name.trim().length >= 2 && isValidPhoneVn(phone) && !!place;

  const openPicker = () => router.push({ pathname: '/booking/location', params: { target: 'sender' } });

  const mapStops = useMemo<MapStop[]>(() => {
    if (!place) return [];
    return [{ id: 'pickup', lat: place.lat, lng: place.lng, type: 'pickup', label: labels.mapPickupLabel }];
  }, [place, labels]);

  const confirm = () => {
    if (!isRide) setSenderInfo({ name: name.trim(), phone: phone.trim() });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
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
          onChange={openPicker}
        />
      ) : (
        <View style={styles.body}>
          <AddressBlock address={place?.address} placeholder={labels.senderLocationPlaceholder} onChange={openPicker} />
          <TextField
            label={labels.senderNameLabel}
            required
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên"
            autoCapitalize="words"
            iconRight={Icons.contacts}
            onIconRightPress={() => setContacts(true)}
            containerStyle={{ marginTop: Spacing.lg }}
          />
          <TextField
            label="Số điện thoại"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder={labels.senderPhonePlaceholder}
            keyboardType="phone-pad"
            containerStyle={{ marginTop: Spacing.base }}
          />
        </View>
      )}
      <ContactPickerSheet
        visible={contacts}
        onClose={() => setContacts(false)}
        onPick={(c) => {
          setName(c.name);
          setPhone(c.phone);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen },
});
