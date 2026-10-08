// Ước tính tiền thưởng — Figma Ước tính 1.1/1.2: header X + info; ô nhập tổng giá trị đơn hoàn tất trong tháng của
// thành viên F1 / F2 / F3 + "đ"; kết quả = từng phần × tỉ lệ hoa hồng của chính sách đang áp (GET /v1/customer/affiliate
// policy.commissionBps); nút đáy "Xong". Chỉ mang tính tham khảo (chưa trừ điều kiện nhận thưởng).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, TextField, Dialog, Icons } from '@/components/ui';
import { bpsLabel, isMember, loadAffiliate, useAffiliate } from '@/services/affiliate';
import { formatVnd } from '@/services/bookingStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function digitsOnly(s: string) {
  return s.replace(/\D/g, '').slice(0, 12);
}

function withCommas(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const TIERS = [0, 1, 2] as const;

export default function CommunityEstimateScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const [raw, setRaw] = useState<[string, string, string]>(['', '', '']);
  const [info, setInfo] = useState(false);

  useEffect(() => {
    if (!aff) void loadAffiliate().catch(() => undefined);
  }, [aff]);

  const bps = isMember(aff) ? aff.policy.commissionBps : [];
  const bonus = TIERS.reduce<number>((sum, i) => sum + Math.floor((Number(raw[i] || 0) * (bps[i] ?? 0)) / 10_000), 0);

  return (
    <Screen
      header={<AppHeader title="Ước tính tiền thưởng" variant="light" left="close" right={{ icon: Icons.infoOutline, onPress: () => setInfo(true), label: 'Thông tin' }} />}
      footer={<Button title="Xong" flat onPress={() => router.back()} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <AppText size={14} color={Colors.textSecondary} style={{ lineHeight: 21 }}>
          Nhập tổng giá trị đơn hoàn tất trong tháng của các thành viên theo từng tầng
        </AppText>
        {TIERS.map((i) => (
          <TextField
            key={i}
            label={`Thành viên F${i + 1}${bps[i] != null ? ` (thưởng ${bpsLabel(bps[i]!)})` : ''}`}
            value={withCommas(raw[i])}
            onChangeText={(t) => setRaw((cur) => cur.map((v, j) => (j === i ? digitsOnly(t) : v)) as [string, string, string])}
            placeholder="5,000,000"
            keyboardType="number-pad"
            suffix="đ"
            bold
            containerStyle={{ marginTop: Spacing.lg }}
          />
        ))}

        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.desc}>
          Tiền thưởng tạm tính của bạn sẽ là
        </AppText>

        <View style={styles.result}>
          <AppText weight="bold" size={32} color={Colors.primary} align="center" style={{ lineHeight: 40 }}>
            {formatVnd(bonus)}
          </AppText>
        </View>
      </View>

      <Dialog
        visible={info}
        onClose={() => setInfo(false)}
        title="Ước tính tiền thưởng"
        message={`Thưởng = giá trị đơn của F1 × ${bpsLabel(bps[0] ?? 0)} + F2 × ${bpsLabel(bps[1] ?? 0)} + F3 × ${bpsLabel(bps[2] ?? 0)} theo chính sách đang áp. Kết quả chỉ mang tính tham khảo — thưởng chỉ được trả khi bạn đủ điều kiện nhận thưởng của tháng.`}
        actions={[{ label: 'Đồng ý', onPress: () => setInfo(false) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
  desc: { marginTop: Spacing.xl, lineHeight: 21 },
  result: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
});
