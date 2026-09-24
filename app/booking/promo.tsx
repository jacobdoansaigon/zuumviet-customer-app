// app/booking/promo.tsx — 1.6 "Nhập mã ưu đãi": ô nhập (icon vé), trạng thái trống, kết quả "Mã MUAXUAN2020 / ... / Sử dụng ngay"
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, AppText, Icon, Icons, Screen, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PROMO_CODES, type PromoDef } from '@/constants/mockBooking';
import { useBooking, setOptions } from '@/services/bookingStore';

export default function PromoScreen() {
  const state = useBooking();
  const applied = state.options.promo;
  const [code, setCode] = useState('');
  const q = code.trim().toUpperCase();
  const found = q ? PROMO_CODES.filter((p) => p.code.includes(q)) : [];

  const apply = (p: PromoDef) => {
    setOptions({ promo: p });
    router.back();
  };

  return (
    <Screen header={<AppHeader variant="dark" title="Nhập mã ưu đãi" left="arrow" />} scroll padded>
      <TextField iconLeft={Icons.ticket} value={code} onChangeText={setCode} placeholder="Nhập mã ưu đãi" autoCapitalize="characters" autoCorrect={false} bold />

      {applied ? (
        <View style={styles.applied}>
          <Icon name={Icons.checkCircle} size={18} color={Colors.success} />
          <AppText size={13} style={{ flex: 1, marginLeft: Spacing.sm }}>
            Đang áp dụng mã {applied.code}
          </AppText>
          <Pressable onPress={() => setOptions({ promo: null })} hitSlop={8}>
            <AppText size={13} weight="semiBold" color={Colors.primary}>
              Bỏ mã
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {found.length === 0 ? (
        <View style={styles.empty}>
          <AppText size={17} color={Colors.textSecondary} align="center" style={{ lineHeight: 26 }}>
            Chúng tôi không tìm thấy mã ưu đãi nào. Hay thử nhập mã ưu đãi
          </AppText>
        </View>
      ) : (
        <View style={{ marginTop: Spacing.lg }}>
          <AppText size={13} color={Colors.textSecondary}>
            Tìm thấy {found.length} mã khuyến mãi
          </AppText>
          {found.map((p) => (
            <Pressable key={p.code} onPress={() => apply(p)} style={styles.row}>
              <View style={styles.ticket}>
                <Icon name={Icons.ticket} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <AppText weight="bold" size={15}>
                  {p.title}
                </AppText>
                <AppText size={12} color={Colors.textSecondary}>
                  {p.description}
                </AppText>
                <AppText size={11} weight="semiBold" color={Colors.primary} style={{ marginTop: 2 }}>
                  Sử dụng ngay
                </AppText>
              </View>
              <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} />
            </Pressable>
          ))}
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
