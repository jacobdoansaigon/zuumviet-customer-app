// app/booking/confirm.tsx — GH 1.6 / VT 1.6 "Xác nhận giao hàng": tuỳ chọn theo luật của dịch vụ (catalog):
// quay về điểm đón (allowReturnToPickup), dịch vụ cộng thêm (addons), tiền tip, hẹn giờ (allowScheduling, tối thiểu
// minScheduleLeadMinutes, tối đa maxScheduleDays), ghi chú; footer Mã giảm giá | Tiền mặt/Ví, giá, "Xác nhận" → tạo đơn.
// Giá ở footer là giá server báo (POST /v1/customer/quotes) — trong lúc chờ chỉ hiện ước tính "~" và KHÔNG cho xác nhận.
// Chỉ tạo đơn với đúng giá đang hiện: báo giá tự làm mới trước khi hết hạn; phải báo giá lại mà giá khác → hiện giá mới,
// khách bấm xác nhận lần nữa. Trả tiền mặt mà còn nợ phí huỷ đơn trước → báo trước khoản tài xế sẽ thu thêm.
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, BottomSheet, Checkbox, ErrorSheet, Icon, Icons, Screen, Stepper, fontStyle, useBlurOnLeave } from '@/components/ui';
import { Colors, Spacing, NO_WEB_OUTLINE } from '@/constants/theme';
import { SERVICE_GROUPS, TIP_STEP } from '@/constants/booking';
import {
  useBooking,
  setOptions,
  effectivePrice,
  refreshQuote,
  removeCoupon,
  formatVnd,
  formatScheduleLabel,
  submitBooking,
  getSelectedService,
  maxStopsOf,
  completeReceivers,
} from '@/services/bookingStore';
import { errorMessage, isApiError } from '@/services/zuum';
import { vnDateKey, vnDateTime } from '@/services/vnTime';
import { FlatFooter, OptionRow, PaymentSheet } from '@/components/booking';
import { useWalletSummary } from '@/hooks/useWalletBalance';

type ScheduleChoice = { label: string; minutes?: number; tomorrowAt?: number };

const SCHEDULE_CHOICES: ScheduleChoice[] = [
  { label: 'Bây giờ' },
  { label: 'Sau 30 phút', minutes: 30 },
  { label: 'Sau 1 giờ', minutes: 60 },
  { label: 'Sau 2 giờ', minutes: 120 },
  { label: 'Sau 4 giờ', minutes: 240 },
  { label: 'Ngày mai, 08h00', tomorrowAt: 8 },
  { label: 'Ngày mai, 14h00', tomorrowAt: 14 },
];

/** Thời điểm hẹn của 1 lựa chọn (cộng 2 phút để còn đủ "báo trước tối thiểu" lúc server báo giá); "ngày mai" theo giờ VN */
function choiceTs(c: ScheduleChoice): number | null {
  if (c.minutes) return Date.now() + (c.minutes + 2) * 60_000;
  if (c.tomorrowAt != null) {
    const tomorrow = vnDateKey(Date.now() + 24 * 3600_000);
    return vnDateTime(tomorrow, `${String(c.tomorrowAt).padStart(2, '0')}:00`);
  }
  return null;
}

const COUPON_ERROR = /^coupon\./;

export default function ConfirmScreen() {
  const state = useBooking();
  const opt = state.options;
  const svc = getSelectedService(state);
  const price = effectivePrice(state);
  const quote = state.quote;
  const noteRef = useRef<TextInput>(null);
  useBlurOnLeave(noteRef);
  const [timeSheet, setTimeSheet] = useState(false);
  const [paySheet, setPaySheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const wallet = useWalletSummary();

  // Báo giá còn hạn mà khách vẫn ở màn này → tự báo giá lại 25 giây trước khi hết hạn (giá hiện luôn còn dùng được)
  const expiresAt = quote.status === 'ready' ? quote.quote?.expiresAt : undefined;
  useEffect(() => {
    if (!expiresAt) return;
    const ms = Math.max(0, Date.parse(expiresAt) - 25_000 - Date.now());
    const t = setTimeout(() => void refreshQuote(true), ms);
    return () => clearTimeout(t);
  }, [expiresAt]);

  // Báo giá lại mỗi khi bản nháp đổi (refreshQuote tự bỏ qua nếu đã có giá còn hạn cho đúng bản nháp), chờ 400ms gom thao tác
  useEffect(() => {
    const t = setTimeout(() => {
      void refreshQuote();
    }, 400);
    return () => clearTimeout(t);
  }, [state.options, state.receivers, state.optionId, state.service, state.sender.place]);

  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const isIntercity = state.service === 'intercity';
  const maxStops = maxStopsOf(state);
  const stopsCount = maxStops === 0 ? 0 : Math.max(1, completeReceivers(state).length);
  const rules = svc?.rules;
  const lead = rules?.minScheduleLeadMinutes ?? 0;
  const maxDays = rules?.maxScheduleDays ?? 0;
  const choices = SCHEDULE_CHOICES.filter((c) => {
    if (!c.minutes && c.tomorrowAt == null) return true;
    const ts = choiceTs(c)!;
    const minutes = (ts - Date.now()) / 60_000;
    return minutes >= lead && minutes <= maxDays * 24 * 60;
  });
  const quoteData = price.quote;
  const couponError = quote.status === 'error' && !!quote.errorCode && COUPON_ERROR.test(quote.errorCode);

  const pickTime = (c: ScheduleChoice) => {
    setOptions({ scheduledAt: choiceTs(c) });
    setTimeSheet(false);
  };

  const toggleAddon = (id: string) =>
    setOptions({ addonIds: opt.addonIds.includes(id) ? opt.addonIds.filter((x) => x !== id) : [...opt.addonIds, id] });

  // chỉ xác nhận khi giá đang hiện là giá server báo, còn hạn, cho đúng bản nháp này
  const canSubmit = !!svc && price.fromServer && quote.status === 'ready' && !submitting;
  const debt = opt.paymentMethod === 'cash' ? (wallet?.debt ?? 0) : 0;

  const onConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await submitBooking(price.total);
      router.replace({ pathname: '/booking/tracking', params: { orderId: order.id, from: 'booking' } });
    } catch (e) {
      setError(
        isApiError(e, 'quote.price_changed')
          ? { title: 'Giá đã thay đổi', message: errorMessage(e) }
          : { title: 'Không tạo được đơn', message: errorMessage(e, 'Không tạo được đơn hàng. Vui lòng thử lại.') },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const couponLabel = quoteData?.coupon
    ? `${quoteData.coupon.code} · -${formatVnd(quoteData.coupon.discount)}`
    : opt.couponCode
      ? `Mã ${opt.couponCode}`
      : 'Mã giảm giá';

  const footer = (
    <View style={styles.footer}>
      <View style={styles.payRow}>
        <Pressable style={styles.payHalf} onPress={() => router.push('/booking/promo')}>
          <Icon name={Icons.ticket} size={22} color={Colors.primary} />
          <AppText size={14} weight="medium" color={opt.couponCode ? Colors.primary : Colors.text} style={{ marginLeft: Spacing.sm }} numberOfLines={1}>
            {couponLabel}
          </AppText>
        </Pressable>
        <View style={styles.vDivider} />
        <Pressable style={styles.payHalf} onPress={() => setPaySheet(true)}>
          <Icon name={opt.paymentMethod === 'wallet' ? Icons.wallet : Icons.cash} size={22} color={Colors.primary} />
          <AppText size={14} weight="medium" style={{ marginLeft: Spacing.sm }}>
            {opt.paymentMethod === 'wallet' ? 'Ví ZuumViet' : 'Tiền mặt'}
          </AppText>
        </Pressable>
      </View>
      <View style={styles.priceRow}>
        <View>
          {price.original > price.total ? (
            <AppText size={14} color={Colors.textSecondary} style={{ textDecorationLine: 'line-through' }}>
              {formatVnd(price.original, { space: true })}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText weight="bold" size={28} color={Colors.primary}>
              {price.fromServer ? '' : '~'}
              {formatVnd(price.total, { space: true })}
            </AppText>
            {quote.status === 'loading' ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: Spacing.sm }} /> : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText size={12} color={Colors.textSecondary}>
            {price.distanceKm ? `${price.distanceKm.toFixed(1)}km · ` : ''}
            {stopsCount === 0 ? `${labels.provider} đến tận nơi` : `${stopsCount} ${labels.stopUnit}`}
          </AppText>
          <AppText size={11} color={quote.status === 'error' ? Colors.error : Colors.textMuted} numberOfLines={3} style={{ maxWidth: 220, textAlign: 'right' }}>
            {quote.status === 'error' ? quote.error : price.fromServer ? 'Giá ZuumViet báo' : 'Giá ước tính'}
          </AppText>
          {couponError ? (
            <Pressable onPress={removeCoupon} hitSlop={6}>
              <AppText size={12} weight="semiBold" color={Colors.primary}>
                Bỏ mã giảm giá
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
      {debt > 0 ? (
        <View style={styles.debtRow}>
          <Icon name={Icons.info} size={16} color={Colors.error} />
          <AppText size={12} color={Colors.text} style={{ flex: 1, marginLeft: Spacing.xs }}>
            Bạn còn nợ phí huỷ đơn trước {formatVnd(debt)} — tài xế sẽ thu thêm khoản này khi bạn trả tiền mặt.
          </AppText>
        </View>
      ) : null}
      {quote.status === 'error' && !couponError ? (
        <FlatFooter title="Lấy lại giá" onPress={() => void refreshQuote(true)} />
      ) : (
        <FlatFooter
          title={canSubmit || submitting ? 'Xác nhận' : quote.status === 'error' ? 'Chưa có giá' : 'Đang lấy giá…'}
          loading={submitting}
          disabled={!canSubmit}
          onPress={onConfirm}
        />
      )}
    </View>
  );

  return (
    <Screen header={<AppHeader variant="dark" title={labels.confirmTitle} left="arrow" />} scroll edges={['left', 'right']} footer={footer} footerPadded={false}>
      {rules?.allowReturnToPickup ? (
        <OptionRow
          icon={Icons.refresh}
          label={group.kind === 'delivery' ? 'Quay lại điểm lấy hàng' : 'Khứ hồi (quay về điểm đón)'}
          sub="Cước chiều về tính vào giá báo"
          right={<Checkbox checked={opt.returnToPickup} onPress={() => setOptions({ returnToPickup: !opt.returnToPickup })} />}
        />
      ) : null}
      {svc?.addons.map((a) => (
        <OptionRow
          key={a.id}
          icon={Icons.plusCircle}
          label={a.name}
          sub={[`+${formatVnd(a.price)}`, a.description ?? ''].filter(Boolean).join(' · ')}
          right={<Checkbox checked={opt.addonIds.includes(a.id)} onPress={() => toggleAddon(a.id)} />}
        />
      ))}
      <OptionRow
        icon={Icons.cash}
        label="Tiền tip"
        sub={`${formatVnd(TIP_STEP)} / lần${opt.tip ? ` · ${formatVnd(opt.tip * TIP_STEP)}` : ''}`}
        right={<Stepper value={opt.tip} onChange={(v) => setOptions({ tip: v })} max={20} />}
      />
      {rules?.allowScheduling ? (
        <OptionRow
          icon={Icons.calendar}
          label={isIntercity ? 'Ngày giờ đi' : 'Thời gian lựa chọn'}
          value={formatScheduleLabel(opt.scheduledAt)}
          chevron={!isIntercity}
          onPress={isIntercity ? undefined : () => setTimeSheet(true)}
        />
      ) : null}
      {svc?.pricing.basis === 'time_block' ? (
        <OptionRow
          icon={Icons.clock}
          label="Thời gian làm việc"
          value={`${opt.laborBlocks} block × ${Math.round(svc.pricing.blockMinutes / 6) / 10} giờ`}
        />
      ) : null}
      <View style={styles.noteRow}>
        <View style={{ width: 34 }}>
          <Icon name={Icons.note} size={22} color={Colors.primary} />
        </View>
        <TextInput
          ref={noteRef}
          value={opt.note}
          onChangeText={(t) => setOptions({ note: t })}
          placeholder="Ghi chú"
          placeholderTextColor={Colors.placeholder}
          style={[styles.noteInput, fontStyle('medium')]}
          multiline
          maxLength={500}
        />
      </View>

      {quoteData ? (
        <View style={styles.breakdown}>
          <AppText weight="bold" size={14} style={{ marginBottom: Spacing.xs }}>
            Chi tiết giá
          </AppText>
          {quoteData.price.lines.map((l, i) => (
            <View key={`${l.code}-${i}`} style={styles.lineRow}>
              <AppText size={13} color={Colors.textSecondary} style={{ flex: 1 }}>
                {l.label}
              </AppText>
              <AppText size={13} color={l.amount < 0 ? Colors.success : Colors.text}>
                {formatVnd(l.amount)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <BottomSheet visible={timeSheet} onClose={() => setTimeSheet(false)} title="Thời gian lựa chọn" showClose showHandle={false} contentStyle={{ paddingHorizontal: 0 }}>
        {choices.map((c) => {
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
        {lead > 0 ? (
          <AppText size={12} color={Colors.textMuted} style={{ paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm }}>
            Hẹn giờ trước tối thiểu {lead} phút, tối đa {maxDays} ngày
          </AppText>
        ) : null}
      </BottomSheet>

      <PaymentSheet
        visible={paySheet}
        value={opt.paymentMethod}
        amount={price.total}
        onClose={() => setPaySheet(false)}
        onSelect={(m) => setOptions({ paymentMethod: m })}
      />
      <ErrorSheet visible={!!error} title={error?.title} message={error?.message ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md },
  noteInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 0, minHeight: 44, textAlignVertical: 'top', ...NO_WEB_OUTLINE },
  breakdown: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  lineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  debtRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.screen, paddingBottom: Spacing.sm },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.white },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  payHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
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
