// app/booking/confirm.tsx — GH 1.6 / VT 1.6 "Xác nhận giao hàng": tuỳ chọn (quay lại điểm giao, gửi tận tay, tip),
// thời gian, tài xế chỉ định, ghi chú; footer Mã giảm giá | Tiền mặt, giá, "Xác nhận" → tạo đơn → theo dõi
import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, BottomSheet, Checkbox, ErrorSheet, Icon, Icons, Screen, Stepper, fontStyle } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { EXTRA_PRICES } from '@/constants/mockBooking';
import { useBooking, setOptions, computePrice, formatVnd, formatScheduleLabel, submitBooking, promoLabel } from '@/services/bookingStore';
import { DriverPickerSheet, FlatFooter, OptionRow, PaymentSheet } from '@/components/booking';

const SCHEDULE_CHOICES: { label: string; minutes?: number; tomorrowAt?: number }[] = [
  { label: 'Bây giờ' },
  { label: 'Sau 30 phút', minutes: 30 },
  { label: 'Sau 1 giờ', minutes: 60 },
  { label: 'Sau 2 giờ', minutes: 120 },
  { label: 'Ngày mai, 08h00', tomorrowAt: 8 },
];

export default function ConfirmScreen() {
  const state = useBooking();
  const opt = state.options;
  const price = computePrice(state);
  const [timeSheet, setTimeSheet] = useState(false);
  const [driverSheet, setDriverSheet] = useState(false);
  const [paySheet, setPaySheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopsCount = Math.max(1, state.receivers.length);

  const pickTime = (c: (typeof SCHEDULE_CHOICES)[number]) => {
    let ts: number | null = null;
    if (c.minutes) ts = Date.now() + c.minutes * 60_000;
    else if (c.tomorrowAt) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(c.tomorrowAt, 0, 0, 0);
      ts = d.getTime();
    }
    setOptions({ scheduledAt: ts });
    setTimeSheet(false);
  };

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitBooking();
      router.replace({ pathname: '/booking/tracking', params: { orderId: res.orderId, from: 'booking' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tạo được đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footer}>
      <View style={styles.payRow}>
        <Pressable style={styles.payHalf} onPress={() => router.push('/booking/promo')}>
          <Icon name={Icons.ticket} size={22} color={Colors.primary} />
          <AppText size={14} weight="medium" color={opt.promo ? Colors.primary : Colors.text} style={{ marginLeft: Spacing.sm }}>
            {promoLabel(opt.promo) ?? 'Mã giảm giá'}
          </AppText>
        </Pressable>
        <View style={styles.vDivider} />
        <Pressable style={styles.payHalf} onPress={() => setPaySheet(true)}>
          <Icon name={opt.paymentMethod === 'wallet' ? Icons.wallet : Icons.cash} size={22} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {opt.paymentMethod === 'wallet' ? 'Tài khoản' : 'Tiền mặt'}
          </AppText>
        </Pressable>
      </View>
      <View style={styles.priceRow}>
        <View>
          {price.discount > 0 ? (
            <AppText size={14} color={Colors.textSecondary} style={{ textDecorationLine: 'line-through' }}>
              {formatVnd(price.subtotal, { space: true })}
            </AppText>
          ) : null}
          <AppText weight="bold" size={28} color={Colors.primary}>
            {formatVnd(price.total, { space: true })}
          </AppText>
        </View>
        <AppText size={12} color={Colors.textSecondary}>
          {price.distanceKm ? `${price.distanceKm.toFixed(1)}km · ` : ''}
          {stopsCount} điểm giao
        </AppText>
      </View>
      <FlatFooter title="Xác nhận" loading={submitting} onPress={onConfirm} />
    </View>
  );

  return (
    <Screen header={<AppHeader variant="dark" title="Xác nhận giao hàng" left="arrow" />} scroll edges={['left', 'right']} footer={footer} footerPadded={false}>
      <OptionRow
        icon={Icons.refresh}
        label="Quay lại điểm giao hàng"
        sub={formatVnd(EXTRA_PRICES.returnToPickup)}
        right={<Checkbox checked={opt.returnToPickup} onPress={() => setOptions({ returnToPickup: !opt.returnToPickup })} />}
      />
      <OptionRow
        icon={Icons.handHold}
        label="Gửi tận tay khách hàng"
        sub="đ35.000 / lần"
        right={<Stepper value={opt.handToCustomer} onChange={(v) => setOptions({ handToCustomer: v })} max={stopsCount} />}
      />
      <OptionRow icon={Icons.cash} label="Tiền tip" sub="đ 5,000 / lần" right={<Stepper value={opt.tip} onChange={(v) => setOptions({ tip: v })} max={20} />} />
      <OptionRow icon={Icons.calendar} label="Thời gian lựa chọn" value={formatScheduleLabel(opt.scheduledAt)} chevron onPress={() => setTimeSheet(true)} />
      <OptionRow
        icon="mci:account-outline"
        label="Tài xế chỉ định"
        sub={opt.assignedDrivers.length ? `${opt.assignedDrivers.length} tài xế` : undefined}
        value="Lựa chọn"
        chevron
        onPress={() => setDriverSheet(true)}
      />
      <View style={styles.noteRow}>
        <View style={{ width: 34 }}>
          <Icon name={Icons.note} size={22} color={Colors.primary} />
        </View>
        <TextInput
          value={opt.note}
          onChangeText={(t) => setOptions({ note: t })}
          placeholder="Ghi chú"
          placeholderTextColor={Colors.placeholder}
          style={[styles.noteInput, fontStyle('medium')]}
          multiline
        />
      </View>

      <BottomSheet visible={timeSheet} onClose={() => setTimeSheet(false)} title="Thời gian lựa chọn" showClose showHandle={false} contentStyle={{ paddingHorizontal: 0 }}>
        {SCHEDULE_CHOICES.map((c) => {
          const on = c.label === 'Bây giờ' ? !opt.scheduledAt : false;
          return (
            <Pressable key={c.label} onPress={() => pickTime(c)} style={[styles.timeRow, on && { backgroundColor: Colors.primaryBg }]}>
              <Icon name={c.label === 'Bây giờ' ? Icons.flash : Icons.clock} size={20} color={Colors.primary} style={{ marginRight: Spacing.md }} />
              <AppText size={15} weight={on ? 'bold' : 'medium'} style={{ flex: 1 }}>
                {c.label}
              </AppText>
              {on ? <Icon name={Icons.checkCircle} size={20} color={Colors.primary} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>

      <DriverPickerSheet
        visible={driverSheet}
        selected={opt.assignedDrivers}
        onClose={() => setDriverSheet(false)}
        onConfirm={(ids) => {
          setOptions({ assignedDrivers: ids });
          setDriverSheet(false);
        }}
      />
      <PaymentSheet visible={paySheet} value={opt.paymentMethod} onClose={() => setPaySheet(false)} onSelect={(m) => setOptions({ paymentMethod: m })} />
      <ErrorSheet visible={!!error} title="Không tạo được đơn" message={error ?? ''} actionLabel="Thử lại" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md },
  noteInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 0, minHeight: 44, textAlignVertical: 'top' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.white },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  payHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  vDivider: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: Colors.gray300 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.md,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: Spacing.screen },
});
