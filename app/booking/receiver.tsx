// app/booking/receiver.tsx — GH 1.4.1 "Thông tin người nhận" (param index)
// Giao hàng: địa chỉ, Giao hàng tận tay, họ tên/SĐT/COD/ghi chú, kích cỡ gói hàng (4 ô), tuỳ chọn xem hàng → "Xác Nhận"
// Chở khách / tận nơi: chỉ địa chỉ điểm đến + bản đồ (chạm để đổi địa chỉ) → "Xác Nhận"; tên/SĐT lấy của người đặt
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Icon, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { SERVICE_GROUPS, VIEW_OPTIONS, type PackageSizeId, type ViewOptionId } from '@/constants/mockBooking';
import { useBooking, ensureReceiver, updateReceiver, isValidPhoneVn, formatThousands } from '@/services/bookingStore';
import { AddressBlock, BookingMap, ContactPickerSheet, FlatFooter, PackageSizePicker, type MapStop } from '@/components/booking';

export default function ReceiverScreen() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const receiver = state.receivers[index];
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  // Chở khách: chỉ cần điểm đến; tên/SĐT không bắt buộc (mặc định lấy của người đi)
  const isDelivery = group.kind === 'delivery';

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
  const valid = !!place && (!isDelivery || (name.trim().length >= 2 && isValidPhoneVn(phone)));

  const openPicker = () => router.push({ pathname: '/booking/location', params: { target: 'receiver', index: String(index), back: '1' } });

  // Bản đồ xem trước (chở khách): điểm đón + điểm đến
  const mapStops = useMemo<MapStop[]>(() => {
    const list: MapStop[] = [];
    const p = state.sender.place;
    if (p) list.push({ id: 'pickup', lat: p.lat, lng: p.lng, type: 'pickup', label: labels.mapPickupLabel });
    if (place) list.push({ id: 'drop', lat: place.lat, lng: place.lng, type: 'dropoff', label: labels.mapDropLabel });
    return list;
  }, [state.sender.place, place, labels]);

  const confirm = () => {
    updateReceiver(index, {
      name: name.trim() || (isDelivery ? '' : state.sender.name),
      phone: phone.trim() || (isDelivery ? '' : state.sender.phone),
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
      header={<AppHeader variant="dark" title={labels.receiverScreenTitle} left="arrow" />}
      scroll
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Xác Nhận" disabled={!valid} onPress={confirm} />}
    >
      <View style={styles.body}>
        <AddressBlock address={place?.address} placeholder={labels.receiverPlaceholder} markerType="dropoff" onChange={openPicker} />

        {isDelivery ? (
          <>
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
          </>
        ) : (
          /* Chở khách: bản đồ xem trước, chạm để đổi điểm đến */
          <Pressable onPress={openPicker} style={styles.mapWrap} accessibilityRole="button" accessibilityLabel="Đổi điểm đến trên bản đồ">
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <BookingMap stops={mapStops} showRoute={mapStops.length > 1} bottomPadding={0} />
            </View>
            <View style={styles.mapHint}>
              <Icon name={Icons.locationFilled} size={16} color={Colors.primary} />
              <AppText size={13} weight="semiBold" color={Colors.primary} style={{ marginLeft: 6 }}>
                Chạm để đổi {labels.mapDropLabel.toLowerCase()}
              </AppText>
            </View>
          </Pressable>
        )}
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
  mapWrap: {
    height: 320,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.mapBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  mapHint: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.full,
    paddingVertical: 10,
  },
});
