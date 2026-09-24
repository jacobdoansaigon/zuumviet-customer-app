// Tiền thưởng — Figma Hệ thống 1.2.1: header + icon grid (ước tính) + info; "Mục tiêu" bold 18;
// thanh mục tiêu (Chi tiêu → Mục tiêu 5.000.000); "Đánh giá của tài xế" 2.0 ★ vs 4.7 ★ Mục tiêu;
// "Hoàn thành mục tiêu để nhận thưởng Tháng 10" + "5.100.000đ" bold 32 tím; card ghi chú lavender.
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Dialog, Icon, Icons } from '@/components/ui';
import { GoalBar } from '@/components/community';
import { MOCK_COMMUNITY, formatVnd } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(value) ? Icons.star : Icons.starOutline} size={size} color={Colors.secondary} />
      ))}
    </View>
  );
}

export default function CommunityRewardsScreen() {
  useStatusBarStyle('dark');
  const r = MOCK_COMMUNITY.rewards;
  const [explain, setExplain] = useState(false);

  return (
    <Screen
      header={
        <AppHeader
          title="Tiền thưởng"
          variant="light"
          left="back"
          right={[
            { icon: 'ion:calculator-outline', onPress: () => router.push('/community/estimate'), label: 'Ước tính tiền thưởng' },
            { icon: Icons.infoOutline, onPress: () => setExplain(true), label: 'Giải thích' },
          ]}
        />
      }
      scroll
    >
      <View style={styles.body}>
        <AppText weight="bold" size={18} color={Colors.text} align="center">
          Mục tiêu
        </AppText>
        <GoalBar current={r.spent} target={r.target} />

        <AppText weight="bold" size={18} color={Colors.text} style={styles.sectionTitle}>
          Đánh giá của tài xế
        </AppText>
        <View style={styles.ratingRow}>
          <View>
            <AppText weight="bold" size={20} color={Colors.text}>
              {r.ratingCurrent.toFixed(1)}
            </AppText>
            <Stars value={r.ratingCurrent} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText weight="bold" size={16} color={Colors.primary}>
                {r.ratingTarget.toFixed(1)}
              </AppText>
              <Icon name={Icons.star} size={16} color={Colors.secondary} style={{ marginLeft: 4 }} />
            </View>
            <AppText size={13} color={Colors.textSecondary}>
              Mục tiêu
            </AppText>
          </View>
        </View>

        <View style={styles.bonusBlock}>
          <AppText size={16} color={Colors.text} align="center">
            Hoàn thành mục tiêu để nhận thưởng {r.month}
          </AppText>
          <AppText weight="bold" size={32} color={Colors.primary} align="center" style={{ lineHeight: 40, marginTop: Spacing.xs }}>
            {formatVnd(r.bonus)}đ
          </AppText>
        </View>

        <View style={styles.note}>
          <Icon name={Icons.infoOutline} size={20} color={Colors.primary} />
          <AppText size={14} color={Colors.text} style={{ flex: 1, marginLeft: Spacing.sm, lineHeight: 20 }}>
            Mỗi chuyến xe của thành viên cấp dưới trong cộng đồng, sẽ mang lại tiền thưởng cho bạn.
          </AppText>
        </View>

        <Pressable onPress={() => setExplain(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: Spacing.lg }}>
          <AppText size={14} weight="bold" color={Colors.primary}>
            Giải thích tại đây
          </AppText>
        </Pressable>
      </View>

      <Dialog
        visible={explain}
        onClose={() => setExplain(false)}
        title="Cách tính tiền thưởng"
        message={`Khi tổng doanh thu chuyến xe của các thành viên cấp dưới trong tháng đạt mục tiêu ${formatVnd(
          r.target
        )}đ và điểm đánh giá trung bình đạt ${r.ratingTarget}★, bạn nhận thưởng ${formatVnd(r.bonus)}đ vào Tài khoản thưởng.`}
        actions={[{ label: 'Đồng ý', onPress: () => setExplain(false) }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
  sectionTitle: { marginTop: Spacing['2xl'] },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  bonusBlock: { marginTop: Spacing['2xl'], alignItems: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
  },
});
