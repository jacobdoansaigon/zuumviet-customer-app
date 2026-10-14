// Thưởng cộng đồng — header sáng + quay lại; tổng thưởng đã nhận (`earnings.paid`) và lần nhận gần nhất
// (`earnings.lastPayout`) từ GET /v1/customer/affiliate; câu trung tính "cộng vào Ví thưởng mỗi sáng thứ Hai" + lối tắt
// tới Ví thưởng; danh sách thưởng đã nhận theo tuần (GET /affiliate/earnings, phân trang: nhãn tuần + số tiền + ngày nhận);
// các cấp thành viên (chỉ ngưỡng số thành viên). KHÔNG hiển thị tỷ lệ thưởng, điều kiện nhận, thưởng tạm tính / ước tính.
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Icon, Icons, Button } from '@/components/ui';
import { COMMUNITY_REWARD_NOTE, isMember, listEarnings, loadAffiliate, useAffiliate, type AffiliateEarning } from '@/services/affiliate';
import { formatVnd } from '@/services/bookingStore';
import { formatDate } from '@/components/wallet/walletUtils';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const PAGE_SIZE = 20;

const paidOn = (iso: string | null) => (iso ? `Nhận ngày ${formatDate(Date.parse(iso))}` : 'Đã cộng vào Ví thưởng');

export default function CommunityRewardsScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const [items, setItems] = useState<AffiliateEarning[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await loadAffiliate();
      const res = await listEarnings(1, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setPage(1);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được thưởng cộng đồng'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const more = async () => {
    if (loadingMore || !items || items.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await listEarnings(page + 1, PAGE_SIZE);
      setItems([...items, ...res.items.filter((e) => !items.some((i) => i.period === e.period))]);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const member = isMember(aff) ? aff : null;
  const last = member?.earnings.lastPayout ?? null;

  return (
    <Screen header={<AppHeader title="Thưởng cộng đồng" variant="light" left="back" />} scroll>
      {!member ? (
        <View style={styles.center}>
          {error ? (
            <AppText size={14} color={Colors.error} align="center">
              {error}
            </AppText>
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.totalBlock}>
            <AppText size={16} color={Colors.text} align="center">
              Tổng thưởng đã nhận
            </AppText>
            <AppText weight="bold" size={32} color={Colors.primary} align="center" style={{ lineHeight: 40, marginTop: Spacing.xs }}>
              {formatVnd(member.earnings.paid)}
            </AppText>
          </View>

          {last ? (
            <View style={styles.lastBox}>
              <View style={{ flex: 1 }}>
                <AppText size={12} color={Colors.textSecondary}>
                  Lần nhận gần nhất
                </AppText>
                <AppText size={14} weight="semiBold" style={{ marginTop: 2 }}>
                  {last.label}
                </AppText>
                <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                  {paidOn(last.paidAt)}
                </AppText>
              </View>
              <AppText size={16} weight="bold" color={Colors.green}>
                +{formatVnd(last.amount)}
              </AppText>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/wallet/bonus')} style={({ pressed }) => [styles.note, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Icon name="mci:gift-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <AppText size={14} color={Colors.text} style={{ lineHeight: 20 }}>
                {COMMUNITY_REWARD_NOTE}
              </AppText>
              <AppText size={13} weight="semiBold" color={Colors.primary} style={{ marginTop: 2 }}>
                Xem Ví thưởng
              </AppText>
            </View>
            <Icon name={Icons.chevronRight} size={18} color={Colors.primary} />
          </Pressable>

          <AppText weight="bold" size={18} color={Colors.text} style={styles.sectionTitle}>
            Thưởng theo tuần
          </AppText>
          {items === null ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
          ) : items.length === 0 ? (
            <AppText size={14} color={Colors.textSecondary} style={{ marginTop: Spacing.sm, lineHeight: 20 }}>
              Chưa có khoản thưởng nào — mời thêm thành viên tham gia cộng đồng của bạn.
            </AppText>
          ) : (
            <>
              {items.map((e) => (
                <View key={e.period} style={styles.earnRow}>
                  <View style={{ flex: 1 }}>
                    <AppText size={14} weight="semiBold">
                      {e.label}
                    </AppText>
                    <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                      {paidOn(e.paidAt)}
                    </AppText>
                  </View>
                  <AppText size={15} weight="bold" color={Colors.primary}>
                    +{formatVnd(e.amount)}
                  </AppText>
                </View>
              ))}
              {items.length < total ? <Button title="Xem thêm" variant="ghost" loading={loadingMore} onPress={() => void more()} style={{ marginTop: Spacing.sm }} /> : null}
            </>
          )}

          <AppText weight="bold" size={18} color={Colors.text} style={styles.sectionTitle}>
            Các cấp thành viên
          </AppText>
          {member.policy.levels.map((l) => (
            <View key={l.key} style={styles.levelRow}>
              <AppText size={14} weight={l.key === member.level.key ? 'bold' : 'regular'} color={l.key === member.level.key ? Colors.primary : Colors.text} style={{ flex: 1 }}>
                {l.name}
                {l.key === member.level.key ? ' (hiện tại)' : ''}
              </AppText>
              <AppText size={13} color={Colors.textSecondary}>
                {l.minF1 || l.minF2 || l.minF3 ? [l.minF1 ? `F1 ≥ ${l.minF1}` : '', l.minF2 ? `F2 ≥ ${l.minF2}` : '', l.minF3 ? `F3 ≥ ${l.minF3}` : ''].filter(Boolean).join(' · ') : 'Mặc định'}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingTop: Spacing['3xl'], alignItems: 'center', paddingHorizontal: Spacing.screen },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
  sectionTitle: { marginTop: Spacing['2xl'], marginBottom: Spacing.xs },
  totalBlock: { alignItems: 'center' },
  lastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
  },
  earnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  levelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
});
