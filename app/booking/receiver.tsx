// app/booking/receiver.tsx — GH 1.4.1 "Thông tin người nhận" (param index)
// Giao hàng: địa chỉ, Giao hàng tận tay, họ tên/SĐT/COD/ghi chú, kích cỡ gói hàng (4 ô), tuỳ chọn xem hàng → "Xác Nhận"
// Vận tải: hàng lớn/nặng — không có Giao hàng tận tay, không có tuỳ chọn xem hàng; đổi kích cỡ gói hàng
// thành mức tải trọng (FREIGHT_WEIGHTS) và thêm tuỳ chọn "Cần người bốc xếp" (tính thêm phí)
// Dọn nhà: KHÔNG phải giao hàng/vận tải — không có COD, kích cỡ gói hàng hay xem hàng. Thay bằng tầng/thang
// máy nhà mới, tuỳ chọn đóng gói + tháo lắp nội thất, và danh sách đồ đặc biệt cần báo trước đội bốc xếp.
// Chở khách: chỉ địa chỉ điểm đến + bản đồ tràn khung (chạm để đổi) → "Xác Nhận"; tên/SĐT lấy của người đặt
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, Icon, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { SERVICE_GROUPS, VIEW_OPTIONS, HCM_CENTER, FREIGHT_WEIGHTS, MOVING_BULKY_ITEMS, EXTRA_PRICES, type PackageSizeId, type ViewOptionId } from '@/constants/mockBooking';
import { useBooking, ensureReceiver, updateReceiver, setReceiverPlace, setOptions, isValidPhoneVn, formatThousands } from '@/services/bookingStore';
import { AddressBlock, AddressMapPreview, ContactPickerSheet, FlatFooter, FloorAccessPicker, PackageSizePicker, ZaloPasteSheet, type MapStop } from '@/components/booking';

export default function ReceiverScreen() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const receiver = state.receivers[index];
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  // Chở khách: chỉ cần điểm đến; tên/SĐT không bắt buộc (mặc định lấy của người đi)
  const isDelivery = group.kind === 'delivery';
  // Vận tải: hàng lớn/nặng — không giao tận tay, không xem hàng, có thể cần thêm nhân công bốc xếp
  const isTransport = state.service === 'transport';
  // Dọn nhà: khác hẳn giao hàng/vận tải — xem comment đầu file
  const isRental = state.service === 'rental';

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
  const [loadingHelp, setLoadingHelp] = useState(receiver?.needsLoadingHelp ?? false);
  const [floorTo, setFloorTo] = useState(state.options.movingFloorTo);
  const [elevatorTo, setElevatorTo] = useState(state.options.movingElevatorTo);
  const [packing, setPacking] = useState(state.options.movingPacking);
  const [disassembly, setDisassembly] = useState(state.options.movingDisassembly);
  const [bulkyItems, setBulkyItems] = useState<string[]>(state.options.movingBulkyItems);
  const [contacts, setContacts] = useState(false);
  const [zaloPaste, setZaloPaste] = useState(false);

  const toggleBulkyItem = (id: string) => setBulkyItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const place = receiver?.place ?? null;
  const valid = !!place && (!isDelivery || (name.trim().length >= 2 && isValidPhoneVn(phone)));

  const openPicker = () => router.push({ pathname: '/booking/location', params: { target: 'receiver', index: String(index), back: '1' } });

  // "Dán từ Zalo": chỉ ghi đè trường nào thực sự tách được, giữ nguyên phần khách đã tự nhập
  const applyZaloPaste = (r: { name: string; phone: string; address: string; note: string }) => {
    if (r.name) setName(r.name);
    if (r.phone) setPhone(r.phone);
    if (r.note) setNote((n) => n || r.note);
    if (r.address) {
      const anchor = place ?? state.sender.place ?? HCM_CENTER;
      setReceiverPlace(index, { title: r.address, address: r.address, lat: anchor.lat + 0.006, lng: anchor.lng + 0.004, source: 'search' });
    }
  };

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
      needsLoadingHelp: loadingHelp,
    });
    if (isRental) setOptions({ movingFloorTo: floorTo, movingElevatorTo: elevatorTo, movingPacking: packing, movingDisassembly: disassembly, movingBulkyItems: bulkyItems });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
  };

  return (
    <Screen
      header={<AppHeader variant="dark" title={labels.receiverScreenTitle} left="arrow" />}
      scroll={isDelivery}
      edges={['left', 'right']}
      footerPadded={false}
      footer={<FlatFooter title="Xác Nhận" disabled={!valid} onPress={confirm} />}
    >
      {isRental ? (
        <View style={styles.body}>
          <AddressBlock address={place?.address} placeholder={labels.receiverPlaceholder} markerType="dropoff" onChange={openPicker} />

          <Pressable onPress={() => setZaloPaste(true)} style={styles.zaloRow}>
            <Icon name={Icons.paste} size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
            <AppText size={14} weight="bold" color={Colors.primary}>
              Dán từ Zalo/Messenger — tự điền tên, SĐT, địa chỉ
            </AppText>
          </Pressable>

          <TextField
            label="Họ và tên người liên hệ"
            required
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên người liên hệ tại nhà mới"
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
            placeholder="Số điện thoại liên hệ"
            keyboardType="phone-pad"
            containerStyle={styles.field}
          />

          <FloorAccessPicker label="Nhà/căn hộ mới" floor={floorTo} elevator={elevatorTo} onFloorChange={setFloorTo} onElevatorChange={setElevatorTo} />

          <View style={styles.divider} />
          <SwitchRow icon={Icons.box} label="Cần đóng gói đồ đạc" sublabel={`đ${EXTRA_PRICES.movingPacking.toLocaleString('vi-VN')} · thùng carton, bọc đồ dễ vỡ`} value={packing} onValueChange={setPacking} />
          <SwitchRow
            icon={Icons.hardHat}
            label="Cần tháo lắp nội thất"
            sublabel={`đ${EXTRA_PRICES.movingDisassembly.toLocaleString('vi-VN')} · giường, tủ, máy lạnh...`}
            value={disassembly}
            onValueChange={setDisassembly}
          />

          <AppText weight="bold" size={14} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Đồ đặc biệt cần lưu ý (nếu có)
          </AppText>
          <View style={styles.chipsWrap}>
            {MOVING_BULKY_ITEMS.map((item) => (
              <Chip key={item.id} label={item.label} active={bulkyItems.includes(item.id)} onPress={() => toggleBulkyItem(item.id)} style={styles.chip} />
            ))}
          </View>

          <TextField label="Ghi chú thêm" value={note} onChangeText={setNote} placeholder="Vd: đồ dễ vỡ, cần đến sớm buổi sáng..." containerStyle={styles.field} />
        </View>
      ) : isDelivery ? (
        <View style={styles.body}>
          <AddressBlock address={place?.address} placeholder={labels.receiverPlaceholder} markerType="dropoff" onChange={openPicker} />

          <Pressable onPress={() => setZaloPaste(true)} style={styles.zaloRow}>
            <Icon name={Icons.paste} size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
            <AppText size={14} weight="bold" color={Colors.primary}>
              Dán từ Zalo/Messenger — tự điền tên, SĐT, địa chỉ
            </AppText>
          </Pressable>

          {isTransport ? (
            <SwitchRow
              icon={Icons.box}
              label="Cần người bốc xếp"
              sublabel={`đ${EXTRA_PRICES.loadingHelp.toLocaleString('vi-VN')}`}
              value={loadingHelp}
              onValueChange={setLoadingHelp}
            />
          ) : (
            <SwitchRow icon={Icons.handHold} label="Giao hàng tận tay" sublabel="đ10,000" value={hand} onValueChange={setHand} />
          )}
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
            {isTransport && (
              <AppText weight="bold" size={14} style={{ marginBottom: Spacing.sm }}>
                Khối lượng hàng ước tính
              </AppText>
            )}
            <PackageSizePicker value={size} onChange={setSize} sizes={isTransport ? FREIGHT_WEIGHTS : undefined} />
          </View>

          {!isTransport && (
            <View style={styles.radios}>
              {VIEW_OPTIONS.map((o) => (
                <Radio key={o.id} selected={view === o.id} onPress={() => setView(o.id)} label={o.label} style={styles.radio} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <AddressMapPreview
          address={place?.address}
          placeholder={labels.receiverPlaceholder}
          markerType="dropoff"
          stops={mapStops}
          hintLabel={`Chạm để đổi ${labels.mapDropLabel.toLowerCase()}`}
          onChange={openPicker}
        />
      )}

      <ContactPickerSheet
        visible={contacts}
        onClose={() => setContacts(false)}
        onPick={(c) => {
          setName(c.name);
          setPhone(c.phone);
        }}
      />
      <ZaloPasteSheet visible={zaloPaste} onClose={() => setZaloPaste(false)} includeContact onApply={applyZaloPaste} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  field: { marginTop: Spacing.base },
  radios: { marginTop: Spacing.lg },
  radio: { paddingVertical: Spacing.md },
  zaloRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: Spacing.sm, marginBottom: Spacing.sm },
});
