// app/booking/promo.tsx — 1.6 "Nhập mã ưu đãi": ô nhập (icon vé) + danh sách mã khách dùng được (GET /v1/customer/coupons).
// Áp mã = báo giá lại với couponCode — server kiểm tra (hết hạn, đơn tối thiểu, dịch vụ áp dụng…) và trả số tiền giảm;
// sai thì hiện đúng lý do server trả, giữ nguyên mã cũ.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Button, Icon, Icons, Screen, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useBooking, applyCoupon, removeCoupon, formatVnd } from '@/services/bookingStore';
import { api, errorMessage, type ZuumResponse } from '@/services/zuum';

type Coupon = ZuumResponse<'GET /v1/customer/coupons'>[number];

function couponTitle(c: Coupon): string {
  if (c.type === 'percent') return `Giảm ${c.value}%${c.maxDiscount ? ` tối đa ${formatVnd(c.maxDiscount)}` : ''}`;
  return `Giảm ${formatVnd(c.value)}`;
}

function couponSub(c: Coupon): string {
  const parts: string[] = [];
  if (c.description) parts.push(c.description);
  if (c.minOrderValue > 0) parts.push(`Đơn từ ${formatVnd(c.minOrderValue)}`);
  if (c.endsAt) {
    const d = new Date(c.endsAt);
    parts.push(`HSD ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
  }
  return parts.join(' · ');
}

export default function PromoScreen() {
  const state = useBooking();
  const applied = state.options.couponCode;
  const [code, setCode] = useState('');
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api('GET /v1/customer/coupons')
      .then(setCoupons)
      .catch((e) => setLoadError(errorMessage(e, 'Không tải được danh sách mã')));
  }, []);

  const q = code.trim().toUpperCase();
  const list = useMemo(
    () => (coupons ?? []).filter((c) => !q || c.code.includes(q) || c.name.toUpperCase().includes(q)),
    [coupons, q],
  );
  const appliesHere = (c: Coupon) => c.services.length === 0 || c.services.some((s) => s.id === state.optionId);

  const apply = async (value: string) => {
    if (!value || applying) return;
    setApplying(value);
    setError(null);
    try {
      await applyCoupon(value);
      router.back();
    } catch (e) {
      setError(errorMessage(e, 'Mã giảm giá không áp dụng được'));
    } finally {
      setApplying(null);
    }
  };

  return (
    <Screen header={<AppHeader variant="dark" title="Nhập mã ưu đãi" left="arrow" />} scroll padded>
      <TextField
        iconLeft={Icons.ticket}
        value={code}
        onChangeText={(t) => {
          setCode(t);
          if (error) setError(null);
        }}
        placeholder="Nhập mã ưu đãi"
        autoCapitalize="characters"
        autoCorrect={false}
        bold
        returnKeyType="done"
        onSubmitEditing={() => void apply(q)}
        error={error ?? undefined}
      />
      {q.length >= 3 ? (
        <Button title={`Áp dụng mã ${q}`} onPress={() => void apply(q)} loading={applying === q} style={{ marginTop: Spacing.md }} />
      ) : null}

      {applied ? (
        <View style={styles.applied}>
          <Icon name={Icons.checkCircle} size={18} color={Colors.success} />
          <AppText size={13} style={{ flex: 1, marginLeft: Spacing.sm }}>
            Đang áp dụng mã {applied}
          </AppText>
          <Pressable onPress={removeCoupon} hitSlop={8}>
            <AppText size={13} weight="semiBold" color={Colors.primary}>
              Bỏ mã
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {coupons === null && !loadError ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['2xl'] }} />
      ) : loadError ? (
        <AppText size={14} color={Colors.error} align="center" style={{ marginTop: Spacing['2xl'] }}>
          {loadError}
        </AppText>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <AppText size={17} color={Colors.textSecondary} align="center" style={{ lineHeight: 26 }}>
            {coupons?.length ? 'Không có mã nào khớp. Bạn vẫn có thể nhập mã và bấm Áp dụng.' : 'Hiện chưa có mã ưu đãi dành cho bạn. Có mã từ chương trình khuyến mãi? Nhập mã ở ô trên.'}
          </AppText>
        </View>
      ) : (
        <View style={{ marginTop: Spacing.lg }}>
          <AppText size={13} color={Colors.textSecondary}>
            {list.length} mã khuyến mãi dành cho bạn
          </AppText>
          {list.map((c) => {
            const usable = appliesHere(c);
            return (
              <Pressable key={c.code} onPress={() => usable && void apply(c.code)} disabled={!usable} style={[styles.row, !usable && { opacity: 0.5 }]}>
                <View style={styles.ticket}>
                  <Icon name={Icons.ticket} size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <AppText weight="bold" size={15}>
                    {c.code} · {couponTitle(c)}
                  </AppText>
                  <AppText size={12} color={Colors.textSecondary}>
                    {c.name}
                    {couponSub(c) ? ` · ${couponSub(c)}` : ''}
                  </AppText>
                  <AppText size={11} weight="semiBold" color={usable ? Colors.primary : Colors.textMuted} style={{ marginTop: 2 }}>
                    {usable ? 'Sử dụng ngay' : `Chỉ áp dụng cho ${c.services.map((s) => s.name).join(', ')}`}
                  </AppText>
                </View>
                {applying === c.code ? <ActivityIndicator size="small" color={Colors.primary} /> : <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  applied: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successBg,
  },
  empty: { paddingTop: Spacing['4xl'], paddingHorizontal: Spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  ticket: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
});
