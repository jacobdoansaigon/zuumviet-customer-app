// app/booking/receiver.tsx — GH 1.4.1 "Thông tin người nhận" (param index): địa chỉ, Giao hàng tận tay, họ tên/SĐT/COD/ghi chú,
// kích cỡ gói hàng (4 ô), tuỳ chọn xem hàng (radio) → "Xác Nhận"
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { VIEW_OPTIONS, type PackageSizeId, type ViewOptionId } from '@/constants/mockBooking';
import { useBooking, ensureReceiver, updateReceiver, isValidPhoneVn, formatThousands } from '@/services/bookingStore';
import { AddressBlock, ContactPickerSheet, FlatFooter, PackageSizePicker } from '@/components/booking';

export default function ReceiverScreen() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const receiver = state.receivers[index];

  useEffect(() => {
    ensureReceiver(index);
  }, [index]);

  const [name, setName] = useState(receiver?.name ?? '');
  const [phone, setPhone] = useState(receiver?.phone ?? '');
  const [cod, setCod] = useState(receiver?.cod ? String(receiver.cod) : '');
  const [note, setNote] = useState(receiver?.note ?? '');
  const [size, setSize] = useState<PackageSizeId>(receiver?.packageSize ?? 's');
  const [view, setView] = useState<ViewOptionId>(receiver?.viewOption ?? 'view');
  const [hand, setHand] = useState(receiver?.handDelivery ?? false);
  const [contacts, setContacts] = useState(false);

  const place = receiver?.place ?? null;
  const valid = name.trim().length >= 2 && isValidPhoneVn(phone) && !!place;

  const confirm = () => {
    updateReceiver(index, {
      name: name.trim(),
      phone: phone.trim(),
      cod: Number(cod.replace(/\D/g, '')) || 0,
      note: note.trim(),
      packageSize: size,
      viewOption: view,
      handDelivery: hand,
    });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title="Thông tin người nhận" left="arrow" />}
      scroll
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Xác Nhận" disabled={!valid} onPress={confirm} />}
    >
      <View style={styles.body}>
        <AddressBlock
          address={place?.address}
          placeholder="Nhập điểm gửi hàng"
          markerType="dropoff"
          onChange={() => router.push({ pathname: '/booking/location', params: { target: 'receiver', index: String(index), back: '1' } })}
        />
        <SwitchRow icon={Icons.handHold} label="Giao hàng tận tay" sublabel="đ10,000" value={hand} onValueChange={setHand} />
        <View style={styles.divider} />

        <TextField
          label="Họ và tên người nhận"
          required
          value={name}
          onChangeText={setName}
          placeholder="Họ và tên người nhận"
          autoCapitalize="words"
          iconRight={Icons.contacts}
          onIconRightPress={() => setContacts(true)}
          containerStyle={styles.field}
        />
        <TextField
          label="Số điện thoại"
          required
          value={phone}
          onChangeText={setPhone}
          placeholder="Số điện thoại người nhận"
          keyboardType="phone-pad"
          containerStyle={styles.field}
        />
        <TextField
          label="COD"
          value={formatThousands(cod)}
          onChangeText={(t) => setCod(t.replace(/\D/g, ''))}
          placeholder="Nhập số tiền"
          suffix="đ"
          keyboardType="number-pad"
          helper="Tài xế sẽ trả tiền hàng trước và thu lại số tiền đó từ người nhận"
          containerStyle={styles.field}
        />
        <TextField label="Ghi chú sản phẩm" value={note} onChangeText={setNote} placeholder="Ghi chú sản phẩm" containerStyle={styles.field} />

        <View style={{ marginTop: Spacing.lg }}>
          <PackageSizePicker value={size} onChange={setSize} />
        </View>

        <View style={styles.radios}>
          {VIEW_OPTIONS.map((o) => (
            <Radio key={o.id} selected={view === o.id} onPress={() => setView(o.id)} label={o.label} style={styles.radio} />
          ))}
        </View>
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
  body: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  field: { marginTop: Spacing.base },
  radios: { marginTop: Spacing.lg },
  radio: { paddingVertical: Spacing.md },
});
