// Cộng đồng của tôi — Figma Cộng đồng (0-9085):
//   Chưa tham gia (OTP 0.1): minh hoạ + "Bạn chưa là thành viên trong cộng đồng ZuumViet" + "Tham gia cộng đồng"
//   Đã tham gia (1.1a/1.1b): header + icon thêm người; hồ sơ nhóm trưởng; 2 stat card; danh sách
//   "Thành viên cấp 1: 24/24" hoặc "Rất tiếc bạn chưa có thành viên nào!" + "Mời thành viên tham gia"
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Button, StatCard, Icons, Icon } from '@/components/ui';
import { CommunityProfile, MemberRow } from '@/components/community';
import { useCommunity } from '@/services/communityStore';
import { MOCK_COMMUNITY, formatVnd } from '@/constants/mock';
import { getStoredCustomer, getDisplayName } from '@/services/api';
import { localAvatarStore } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityScreen() {
  useStatusBarStyle('dark');
  const { joined, members } = useCommunity();
  const [name, setName] = useState(MOCK_COMMUNITY.leader.name);
  const avatar = localAvatarStore.use();

  useEffect(() => {
    getStoredCustomer().then((c) => {
      if (c) setName(getDisplayName(c, MOCK_COMMUNITY.leader.name));
    });
  }, []);

  if (!joined) {
    return (
      <Screen header={<AppHeader title="Cộng đồng của tôi" variant="light" left="none" />}>
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="ion:people"
            title="Bạn chưa là thành viên trong cộng đồng ZuumViet"
            actionLabel="Tham gia cộng đồng"
            onAction={() => router.push('/community/join')}
          />
        </View>
      </Screen>
    );
  }

  const leader = MOCK_COMMUNITY.leader;

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CommunityProfile name={name} role={leader.role} code={leader.code} revenue={leader.revenue} avatarUri={avatar} />

        <View style={styles.stats}>
          <StatCard icon={Icons.network} value={String(leader.members)} label="thành viên" />
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/community/rewards')}>
            <StatCard icon={Icons.chart} value={formatVnd(leader.reward)} label="Tiền thưởng" />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/community/rewards')} style={styles.rewardLink}>
          <Icon name="mci:gift-outline" size={20} color={Colors.primary} />
          <AppText size={14} weight="semiBold" color={Colors.primary} style={{ flex: 1, marginLeft: Spacing.sm }}>
            Mục tiêu & tiền thưởng {MOCK_COMMUNITY.rewards.month}
          </AppText>
          <Icon name={Icons.chevronRight} size={18} color={Colors.primary} />
        </Pressable>

        {members.length === 0 ? (
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
        ) : (
          <View style={styles.members}>
            <AppText weight="bold" size={15} color={Colors.text} style={styles.sectionTitle}>
              Thành viên cấp 1: {MOCK_COMMUNITY.level1.count}/{MOCK_COMMUNITY.level1.capacity}
            </AppText>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} onPress={() => router.push('/community/rewards')} />
            ))}
            <Button
              title="Mời thành viên tham gia"
              variant="outline"
              onPress={() => router.push('/community/invite')}
              style={styles.inviteBtn}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, justifyContent: 'center' },
  content: { paddingBottom: Spacing['2xl'] },
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
