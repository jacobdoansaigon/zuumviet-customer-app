// app/booking/receiver.tsx — GH 1.4.1 "Thông tin người nhận" (param index)
// Giao hàng: địa chỉ, họ tên/SĐT, COD (khi dịch vụ cho thu hộ, tối đa theo catalog), ghi chú, mức cân nặng (catalog),
// tuỳ chọn xem hàng (ghi chú điểm) → "Xác Nhận"
// Vận tải: không có tuỳ chọn xem hàng; "Cần người bốc xếp" ghi chú cho tài xế (API chưa có phụ phí riêng)
// Dọn nhà: KHÔNG phải giao hàng — tầng/thang máy nhà mới, đóng gói, tháo lắp, đồ đặc biệt: gửi kèm ghi chú đơn.
// Chở khách: chỉ địa chỉ điểm đến + bản đồ tràn khung (chạm để đổi) → "Xác Nhận"; tên/SĐT lấy của người đặt
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppText, Chip, Icon, Icons, Radio, Screen, SwitchRow, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { SERVICE_GROUPS, VIEW_OPTIONS, MOVING_BULKY_ITEMS, type ViewOptionId } from '@/constants/booking';
import {
  useBooking,
  ensureReceiver,
  updateReceiver,
  setOptions,
  isValidPhoneVn,
  formatThousands,
  formatVnd,
  getSelectedService,
  isReceiverComplete,
} from '@/services/bookingStore';
import { AddressBlock, AddressMapPreview, FlatFooter, FloorAccessPicker, PackageSizePicker, ZaloPasteSheet, type MapStop } from '@/components/booking';

export default function ReceiverScreen() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const index = Math.max(0, Number(indexParam ?? 0) || 0);
  const state = useBooking();
  const receiver = state.receivers[index];
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const svc = getSelectedService(state);
  const isDelivery = group.kind === 'delivery';
  const isTransport = state.service === 'transport';
  const isRental = state.service === 'rental';
  const allowCod = !!svc?.rules.allowCod;
  const codMax = svc?.rules.codMaxAmount ?? 0;
  const tiers = svc?.weightTiers ?? [];

  useEffect(() => {
    ensureReceiver(index);
  }, [index]);

  const [name, setName] = useState(receiver?.name ?? '');
  const [phone, setPhone] = useState(receiver?.phone ?? '');
  const [cod, setCod] = useState(receiver?.cod ? String(receiver.cod) : '');
  const [note, setNote] = useState(receiver?.note ?? '');
  const [tierId, setTierId] = useState<string | null>(receiver?.weightTierId ?? null);
  const [view, setView] = useState<ViewOptionId>(receiver?.viewOption ?? 'view');
  const [loadingHelp, setLoadingHelp] = useState(receiver?.needsLoadingHelp ?? false);
  const [floorTo, setFloorTo] = useState(state.options.movingFloorTo);
  const [elevatorTo, setElevatorTo] = useState(state.options.movingElevatorTo);
  const [packing, setPacking] = useState(state.options.movingPacking);
  const [disassembly, setDisassembly] = useState(state.options.movingDisassembly);
  const [bulkyItems, setBulkyItems] = useState<string[]>(state.options.movingBulkyItems);
  const [zaloPaste, setZaloPaste] = useState(false);

  const toggleBulkyItem = (id: string) => setBulkyItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const place = receiver?.place ?? null;
  const codValue = allowCod ? Number(cod.replace(/\D/g, '')) || 0 : 0;
  const otherCod = state.receivers.reduce((sum, r, i) => (i !== index && isReceiverComplete(r, state) ? sum + r.cod : sum), 0);
  const codError = allowCod && codMax > 0 && codValue + otherCod > codMax ? `Tổng thu hộ tối đa ${formatVnd(codMax)} cho mỗi đơn` : null;
  const phoneError = isDelivery && phone.trim() && !isValidPhoneVn(phone) ? 'Số điện thoại không hợp lệ' : null;
  const valid = !!place && !codError && (!isDelivery || (name.trim().length >= 2 && isValidPhoneVn(phone)));

  const openPicker = (q?: string) =>
    router.push({ pathname: '/booking/location', params: { target: 'receiver', index: String(index), back: '1', ...(q ? { q } : {}) } });

  // "Dán từ Zalo": chỉ ghi đè trường nào thực sự tách được; địa chỉ phải chọn lại từ gợi ý (cần toạ độ thật)
  const applyZaloPaste = (r: { name: string; phone: string; address: string; note: string }) => {
    if (r.name) setName(r.name);
    if (r.phone) setPhone(r.phone);
    if (r.note) setNote((n) => n || r.note);
    if (r.address) openPicker(r.address);
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
      cod: codValue,
      note: note.trim(),
      weightTierId: tierId ?? tiers[0]?.id ?? null,
      viewOption: view,
      needsLoadingHelp: loadingHelp,
    });
    if (isRental) setOptions({ movingFloorTo: floorTo, movingElevatorTo: elevatorTo, movingPacking: packing, movingDisassembly: disassembly, movingBulkyItems: bulkyItems });
    if (router.canGoBack()) router.back();
    else router.replace('/booking');
  };

  const zaloRow = (
    <Pressable onPress={() => setZaloPaste(true)} style={styles.zaloRow}>
      <Icon name={Icons.paste} size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
      <AppText size={14} weight="bold" color={Colors.primary}>
        Dán từ Zalo/Messenger — tự điền tên, SĐT, địa chỉ
      </AppText>
    </Pressable>
  );

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
          <AddressBlock address={place?.address} placeholder={labels.receiverPlaceholder} markerType="dropoff" onChange={() => openPicker()} />
          {zaloRow}

          <TextField
            label="Họ và tên người liên hệ"
            required
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên người liên hệ tại nhà mới"
            autoCapitalize="words"
            containerStyle={styles.field}
          />
          <TextField
            label="Số điện thoại"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder="Số điện thoại liên hệ"
            keyboardType="phone-pad"
            error={phoneError ?? undefined}
            containerStyle={styles.field}
          />

          <FloorAccessPicker label="Nhà/căn hộ mới" floor={floorTo} elevator={elevatorTo} onFloorChange={setFloorTo} onElevatorChange={setElevatorTo} />

          <View style={styles.divider} />
          <SwitchRow icon={Icons.box} label="Cần đóng gói đồ đạc" sublabel="Thùng carton, bọc đồ dễ vỡ — gửi kèm yêu cầu" value={packing} onValueChange={setPacking} />
          <SwitchRow icon={Icons.hardHat} label="Cần tháo lắp nội thất" sublabel="Giường, tủ, máy lạnh... — gửi kèm yêu cầu" value={disassembly} onValueChange={setDisassembly} />

          <AppText weight="bold" size={14} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Đồ đặc biệt cần lưu ý (nếu có)
          </AppText>
          <View style={styles.chipsWrap}>
            {MOVING_BULKY_ITEMS.map((item) => (
              <Chip key={item.id} label={item.label} active={bulkyItems.includes(item.id)} onPress={() => toggleBulkyItem(item.id)} style={styles.chip} />
            ))}
          </View>
          <AppText size={12} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
            Các yêu cầu trên được gửi kèm ghi chú đơn để đội chuyển nhà chuẩn bị — giá báo ở bước xác nhận chưa gồm chi phí phát sinh.
          </AppText>

          <TextField label="Ghi chú thêm" value={note} onChangeText={setNote} placeholder="Vd: đồ dễ vỡ, cần đến sớm buổi sáng..." containerStyle={styles.field} />
        </View>
      ) : isDelivery ? (
        <View style={styles.body}>
          <AddressBlock address={place?.address} placeholder={labels.receiverPlaceholder} markerType="dropoff" onChange={() => openPicker()} />
          {zaloRow}

          {isTransport ? (
            <>
              <SwitchRow icon={Icons.box} label="Cần người bốc xếp" sublabel="Gửi kèm yêu cầu cho tài xế" value={loadingHelp} onValueChange={setLoadingHelp} />
              <View style={styles.divider} />
            </>
          ) : null}

          <TextField
            label="Họ và tên người nhận"
            required
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên người nhận"
            autoCapitalize="words"
            containerStyle={styles.field}
          />
          <TextField
            label="Số điện thoại"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder="Số điện thoại người nhận"
            keyboardType="phone-pad"
            error={phoneError ?? undefined}
            containerStyle={styles.field}
          />
          {allowCod ? (
            <TextField
              label="COD"
              value={formatThousands(cod)}
              onChangeText={(t) => setCod(t.replace(/\D/g, ''))}
              placeholder="Nhập số tiền"
              suffix="đ"
              keyboardType="number-pad"
              error={codError ?? undefined}
              helper={codError ? undefined : 'Tài xế sẽ trả tiền hàng trước và thu lại số tiền đó từ người nhận'}
              containerStyle={styles.field}
            />
          ) : null}
          <TextField label="Ghi chú sản phẩm" value={note} onChangeText={setNote} placeholder="Ghi chú sản phẩm" containerStyle={styles.field} />

          {tiers.length ? (
            <View style={{ marginTop: Spacing.lg }}>
              <AppText weight="bold" size={14} style={{ marginBottom: Spacing.sm }}>
                {isTransport ? 'Khối lượng hàng ước tính' : 'Cân nặng gói hàng'}
              </AppText>
              <PackageSizePicker tiers={tiers} value={tierId} onChange={setTierId} />
            </View>
          ) : null}

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
          onChange={() => openPicker()}
        />
      )}

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
