// Cộng đồng của tôi — Figma Cộng đồng (0-9085). Dữ liệu GET /v1/customer/affiliate (+ /members?depth=1):
//   hồ sơ (cấp, mã giới thiệu của tôi, thưởng đã nhận); người giới thiệu (hoặc nút nhập mã nếu còn được nhập);
//   2 stat card (tổng thành viên 3 tầng / thưởng tạm tính tháng này); tiến độ lên cấp; danh sách F1
//   "Thành viên cấp 1: n/maxF1" hoặc "Rất tiếc bạn chưa có thành viên nào!" + "Mời thành viên tham gia".
// Khách tự vào cộng đồng khi đăng ký — không có "rời cộng đồng".
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Button, StatCard, Icons, Icon } from '@/components/ui';
import { CommunityProfile, MemberRow } from '@/components/community';
import { isMember, listMembers, loadAffiliate, totalMembers, useAffiliate, type AffiliateMemberItem } from '@/services/affiliate';
import { displayName, useProfile } from '@/services/session';
import { formatVnd } from '@/services/bookingStore';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityScreen() {
  useStatusBarStyle('dark');
  const aff = useAffiliate();
  const profile = useProfile();
  const [members, setMembers] = useState<AffiliateMemberItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const a = await loadAffiliate();
      if (isMember(a)) setMembers((await listMembers(1, 1, 50)).items);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được cộng đồng'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!aff) {
    return (
      <Screen header={<AppHeader title="Cộng đồng của tôi" variant="light" left="none" />}>
        <View style={styles.emptyWrap}>
          {error ? (
            <EmptyState icon="ion:people" title={error} actionLabel="Thử lại" onAction={() => void load()} />
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </View>
      </Screen>
    );
  }

  if (!isMember(aff)) {
    return (
      <Screen header={<AppHeader title="Cộng đồng của tôi" variant="light" left="none" />}>
        <View style={styles.emptyWrap}>
          <EmptyState icon="ion:people" title={aff.message || 'Bạn chưa là thành viên trong cộng đồng ZuumViet'} />
        </View>
      </Screen>
    );
  }

  const levelName = (key: string) => aff.policy.levels.find((l) => l.key === key)?.name ?? key;
  const next = aff.nextLevel;
  const needs = next
    ? (['f1', 'f2', 'f3'] as const).filter((k) => next.need[k] > 0).map((k) => `${k.toUpperCase()} ${aff.counts[k]}/${next.need[k]}`)
    : [];

  return (
    <Screen
      header={
        <AppHeader
          title="Cộng đồng của tôi"
          variant="light"
          left="none"
          right={{ icon: Icons.addPerson, onPress: () => router.push('/community/invite'), label: 'Mời thành viên' }}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <CommunityProfile
          name={displayName(profile)}
          role={`Thành viên ${aff.level.name}`}
          code={aff.code}
          stat={{ label: 'Đã nhận', value: formatVnd(aff.earnings.paid, { space: true }) }}
          avatarUri={profile?.avatarUrl}
        />

        {aff.referrer ? (
          <View style={styles.referrer}>
            <Icon name="ion:person-circle-outline" size={20} color={Colors.primary} />
            <AppText size={14} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
              Người giới thiệu:{' '}
              <AppText size={14} weight="bold" color={Colors.text}>
                {aff.referrer.fullName}
              </AppText>{' '}
              ({aff.referrer.code})
            </AppText>
          </View>
        ) : aff.canSetReferrer ? (
          <Pressable onPress={() => router.push('/community/join')} style={styles.rewardLink}>
            <Icon name={Icons.addPerson} size={20} color={Colors.primary} />
            <AppText size={14} weight="semiBold" color={Colors.primary} style={{ flex: 1, marginLeft: Spacing.sm }}>
              Nhập mã người giới thiệu
            </AppText>
            <Icon name={Icons.chevronRight} size={18} color={Colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.stats}>
          <StatCard icon={Icons.network} value={String(totalMembers(aff))} label="thành viên" />
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/community/rewards')}>
            <StatCard icon={Icons.chart} value={formatVnd(aff.earnings.thisMonthPending)} label="Thưởng tháng này" />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/community/rewards')} style={styles.rewardLink}>
          <Icon name="mci:gift-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <AppText size={14} weight="semiBold" color={Colors.primary}>
              Tiền thưởng & chính sách
            </AppText>
            {next ? (
              <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Lên cấp {next.name}: {needs.join(' · ')}
              </AppText>
            ) : (
              <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Bạn đang ở cấp cao nhất
              </AppText>
            )}
          </View>
          <Icon name={Icons.chevronRight} size={18} color={Colors.primary} />
        </Pressable>

        {members && members.length === 0 ? (
          <View style={styles.noMembers}>
            <AppText size={16} color={Colors.textSecondary} align="center">
              Rất tiếc bạn chưa có thành viên nào!
            </AppText>
            <Button
              title="Mời thành viên tham gia"
              onPress={() => router.push('/community/invite')}
              fullWidth={false}
              size="md"
              style={{ marginTop: Spacing.lg, paddingHorizontal: Spacing['2xl'] }}
            />
          </View>
        ) : members ? (
          <View style={styles.members}>
            <AppText weight="bold" size={15} color={Colors.text} style={styles.sectionTitle}>
              Thành viên cấp 1: {aff.counts.f1}/{aff.policy.maxF1}
            </AppText>
            {members.map((m) => (
              <MemberRow key={m.memberId} member={m} levelName={levelName(m.level)} />
            ))}
            <Button title="Mời thành viên tham gia" variant="outline" onPress={() => router.push('/community/invite')} style={styles.inviteBtn} />
          </View>
        ) : (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: Spacing['2xl'] },
  referrer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.screen, marginTop: Spacing.md },
  stats: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.screen, marginTop: Spacing.lg },
  rewardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
  },
  noMembers: { alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing['3xl'] },
  members: { marginTop: Spacing.lg },
  sectionTitle: { paddingHorizontal: Spacing.screen, marginBottom: Spacing.xs },
  inviteBtn: { marginHorizontal: Spacing.screen, marginTop: Spacing.lg },
});
