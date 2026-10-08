// Tiền thưởng — Figma Hệ thống 1.2.1: header + ước tính + info; tổng thưởng (tạm tính tháng này / chờ trả / đã nhận /
// không đủ điều kiện) từ GET /v1/customer/affiliate; chính sách đang áp (hoa hồng F1/F2/F3, điều kiện nhận, các cấp);
// lịch sử thưởng theo đơn (GET /affiliate/earnings, phân trang). Không còn "mục tiêu chi tiêu"/điểm đánh giá giả.
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, Dialog, Icon, Icons, Button } from '@/components/ui';
import { bpsLabel, EARNING_STATUS_LABEL, isMember, listEarnings, loadAffiliate, useAffiliate, type AffiliateEarning } from '@/services/affiliate';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const PAGE_SIZE = 20;

export default function CommunityRewardsScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const [explain, setExplain] = useState(false);
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
      setError(errorMessage(e, 'Không tải được tiền thưởng'));
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
      setItems([...items, ...res.items]);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const member = isMember(aff) ? aff : null;
  const policy = member?.policy;

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
          <View style={styles.bonusBlock}>
            <AppText size={16} color={Colors.text} align="center">
              Thưởng tạm tính tháng này
            </AppText>
            <AppText weight="bold" size={32} color={Colors.primary} align="center" style={{ lineHeight: 40, marginTop: Spacing.xs }}>
              {formatVnd(member.earnings.thisMonthPending)}
            </AppText>
          </View>

          <View style={styles.sumRow}>
            <Sum label="Chờ trả" value={member.earnings.pending} />
            <Sum label="Đã nhận" value={member.earnings.paid} />
            <Sum label="Không đủ ĐK" value={member.earnings.forfeited} />
          </View>

          {policy ? (
            <View style={styles.note}>
              <Icon name={Icons.infoOutline} size={20} color={Colors.primary} />
              <AppText size={14} color={Colors.text} style={{ flex: 1, marginLeft: Spacing.sm, lineHeight: 20 }}>
                Mỗi chuyến hoàn tất của thành viên trong cộng đồng mang lại thưởng cho bạn: F1 {bpsLabel(policy.commissionBps[0] ?? 0)} · F2{' '}
                {bpsLabel(policy.commissionBps[1] ?? 0)} · F3 {bpsLabel(policy.commissionBps[2] ?? 0)} giá trị đơn.
                {payoutRule(policy.payout)}
              </AppText>
            </View>
          ) : null}

          <AppText weight="bold" size={18} color={Colors.text} style={styles.sectionTitle}>
            Lịch sử thưởng
          </AppText>
          {items === null ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
          ) : items.length === 0 ? (
            <AppText size={14} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
              Chưa có khoản thưởng nào — mời thêm thành viên để bắt đầu nhận thưởng.
            </AppText>
          ) : (
            <>
              {items.map((e) => (
                <View key={e.id} style={styles.earnRow}>
                  <View style={{ flex: 1 }}>
                    <AppText size={14} weight="semiBold">
                      Đơn {e.orderCode} · F{e.depth}
                    </AppText>
                    <AppText size={12} color={Colors.textSecondary}>
                      Tháng {e.month.slice(5, 7)}/{e.month.slice(0, 4)} · {EARNING_STATUS_LABEL[e.status]}
                    </AppText>
                  </View>
                  <AppText size={15} weight="bold" color={e.status === 'forfeited' ? Colors.textMuted : Colors.primary}>
                    +{formatVnd(e.amount)}
                  </AppText>
                </View>
              ))}
              {items.length < total ? <Button title="Xem thêm" variant="ghost" loading={loadingMore} onPress={() => void more()} style={{ marginTop: Spacing.sm }} /> : null}
            </>
          )}

          {policy ? (
            <>
              <AppText weight="bold" size={18} color={Colors.text} style={styles.sectionTitle}>
                Các cấp thành viên
              </AppText>
              {policy.levels.map((l) => (
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
            </>
          ) : null}
        </View>
      )}

      <Dialog
        visible={explain}
        onClose={() => setExplain(false)}
        title="Cách tính tiền thưởng"
        message={
          policy
            ? `Khi thành viên trực tiếp (F1), cấp 2 (F2), cấp 3 (F3) hoàn tất chuyến, bạn được tạm tính thưởng lần lượt ${policy.commissionBps
                .map(bpsLabel)
                .join(' / ')} giá trị đơn. Cuối tháng, thưởng được cộng vào ví nếu bạn đủ điều kiện; không đủ điều kiện thì khoản tạm tính bị huỷ.`
            : 'Thưởng được tính theo chuyến hoàn tất của các thành viên trong cộng đồng của bạn.'
        }
        actions={[{ label: 'Đồng ý', onPress: () => setExplain(false) }]}
      />
    </Screen>
  );
}

/** "Điều kiện nhận thưởng tháng: ít nhất 1 đơn, chi tiêu tối thiểu đ100.000." (rỗng nếu không có điều kiện) */
function payoutRule(p: { minMonthlyOrders: number; minMonthlyAmount: number }): string {
  const parts = [
    p.minMonthlyOrders > 0 ? `ít nhất ${p.minMonthlyOrders} đơn của chính bạn` : '',
    p.minMonthlyAmount > 0 ? `chi tiêu tối thiểu ${formatVnd(p.minMonthlyAmount)}` : '',
  ].filter(Boolean);
  return parts.length ? ` Điều kiện nhận thưởng tháng: ${parts.join(', ')}.` : '';
}

const Sum: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.sumCell}>
    <AppText size={12} color={Colors.textSecondary} align="center">
      {label}
    </AppText>
    <AppText size={15} weight="bold" align="center" style={{ marginTop: 2 }}>
      {formatVnd(value)}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  center: { paddingTop: Spacing['3xl'], alignItems: 'center', paddingHorizontal: Spacing.screen },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
  sectionTitle: { marginTop: Spacing['2xl'], marginBottom: Spacing.xs },
  bonusBlock: { alignItems: 'center' },
  sumRow: { flexDirection: 'row', marginTop: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt, paddingVertical: Spacing.md },
  sumCell: { flex: 1 },
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
  earnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  levelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
});
