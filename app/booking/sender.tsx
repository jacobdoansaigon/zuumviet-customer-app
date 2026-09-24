// app/booking/sender.tsx — GH 1.3 "Thông tin người gửi": địa chỉ + "Thay đổi địa chỉ", họ tên (danh bạ), SĐT → "Xác Nhận"
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Icons, Screen, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useBooking, setSenderInfo, isValidPhoneVn } from '@/services/bookingStore';
import { AddressBlock, ContactPickerSheet, FlatFooter } from '@/components/booking';

export default function SenderScreen() {
  const state = useBooking();
  const [name, setName] = useState(state.sender.name);
  const [phone, setPhone] = useState(state.sender.phone);
  const [contacts, setContacts] = useState(false);
  const place = state.sender.place;
  const valid = name.trim().length >= 2 && isValidPhoneVn(phone) && !!place;

  const confirm = () => {
    setSenderInfo({ name: name.trim(), phone: phone.trim() });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title="Thông tin người gửi" left="arrow" />}
      scroll
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Xác Nhận" disabled={!valid} onPress={confirm} />}
    >
      <View style={styles.body}>
        <AddressBlock
          address={place?.address}
          placeholder="Nhập điểm gửi hàng"
          onChange={() => router.push({ pathname: '/booking/location', params: { target: 'sender' } })}
        />
        <TextField
          label="Họ và tên người nhận"
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
          placeholder="Số điện thoại người gửi"
          keyboardType="phone-pad"
          containerStyle={{ marginTop: Spacing.base }}
        />
      </View>
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
