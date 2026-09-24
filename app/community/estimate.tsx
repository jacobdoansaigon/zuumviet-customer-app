// Ước tính tiền thưởng — Figma Ước tính 1.1/1.2: header X + info; "Nhập số tiền (*)" ô xám
// placeholder "5,000,000" + "đ"; lỗi đỏ "Vui lòng nhập số tiền lớn hơn 100,000 đ"; mô tả xám;
// box kết quả "đ5.100.000" bold 32 tím; nút đáy "Xong".
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, TextField, Dialog, Icons } from '@/components/ui';
import { MOCK_COMMUNITY, formatMoney } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function digitsOnly(s: string) {
  return s.replace(/\D/g, '').slice(0, 12);
}

function withCommas(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function CommunityEstimateScreen() {
  useStatusBarStyle('dark');
  const r = MOCK_COMMUNITY.rewards;
  const [raw, setRaw] = useState('');
  const [touched, setTouched] = useState(false);
  const [info, setInfo] = useState(false);

  const amount = Number(raw || 0);
  const tooSmall = touched && raw.length > 0 && amount <= r.minEstimate;
  const bonus = useMemo(() => (amount > r.minEstimate ? Math.round(amount * r.ratio) : 0), [amount, r.ratio, r.minEstimate]);

  return (
    <Screen
      header={
        <AppHeader
          title="Ước tính tiền thưởng"
          variant="light"
          left="close"
          right={{ icon: Icons.infoOutline, onPress: () => setInfo(true), label: 'Thông tin' }}
        />
      }
      footer={<Button title="Xong" flat onPress={() => router.back()} />}
      footerPadded={false}
      scroll
    >
      <View style={styles.body}>
        <TextField
          label="Nhập số tiền"
          required
          value={withCommas(raw)}
          onChangeText={(t) => {
            setRaw(digitsOnly(t));
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          placeholder="5,000,000"
          keyboardType="number-pad"
          suffix="đ"
          bold
          error={tooSmall ? 'Vui lòng nhập số tiền lớn hơn 100,000 đ' : undefined}
        />

        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.desc}>
          Nếu tất cả thành viên trong cộng đồng của bạn đạt được mục tiêu này thì tiền thưởng của bạn sẽ là
        </AppText>

        <View style={styles.result}>
          <AppText weight="bold" size={32} color={Colors.primary} align="center" style={{ lineHeight: 40 }}>
            {formatMoney(bonus)}
          </AppText>
        </View>
      </View>

      <Dialog
        visible={info}
        onClose={() => setInfo(false)}
        title="Ước tính tiền thưởng"
        message={`Tiền thưởng ước tính = doanh thu mục tiêu × ${(r.ratio * 100).toFixed(0)}%. Số tiền tối thiểu để ước tính là ${withCommas(
          String(r.minEstimate)
        )} đ. Kết quả chỉ mang tính tham khảo.`}
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
