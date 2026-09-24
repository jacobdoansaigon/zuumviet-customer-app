// Trang chủ — Figma HOME 1.2 (3385-663): header tím chào theo giờ + avatar, lưới dịch vụ đè header,
// thẻ ví gradient, 2 stat card, "Tại sao chọn ZuumViet?" (1 thẻ / màn, cuộn ngang 4 khác biệt),
// "Dành cho bạn / Tất cả" (2 hàng × 2 thẻ, cuộn ngang), banner chuyến đang đi nổi trên tab bar.
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, SectionHeader, StatCard, Icons } from '@/components/ui';
import {
  HomeHeader,
  ServiceCard,
  WalletCard,
  PromoGrid,
  WhyZuumCarousel,
  ActiveTripBanner,
  describeActiveOrder,
  type HomeServiceKey,
  type ActiveTripInfo,
} from '@/components/home';
import {
  getStoredCustomer,
  orderApi,
  isActiveOrder,
  getDisplayName,
  type CustomerProfile,
} from '@/services/api';
import { MOCK_PROMOS, MOCK_COMMUNITY, getGreeting } from '@/constants/mock';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { localAvatarStore } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const HEADER_OVERLAP = 40;

export default function HomeScreen() {
  useStatusBarStyle('light');
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTripInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const localAvatar = localAvatarStore.use();
  const walletBalance = useWalletBalance();

  const loadOrders = useCallback(async () => {
    try {
      const res = await orderApi.getOrders();
      const items = res?.items ?? [];
      const active = items.find(isActiveOrder);
      setActiveTrip(active ? describeActiveOrder(active) : null);
    } catch {
      // chưa cấu hình API / chưa có đơn → không hiện banner
      setActiveTrip(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const c = await getStoredCustomer();
      if (!c) {
        router.replace('/');
        return;
      }
      setCustomer(c);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setGreeting(getGreeting());
      getStoredCustomer().then((c) => c && setCustomer(c));
      void loadOrders();
    }, [loadOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const openService = (key: HomeServiceKey) => {
    router.push({ pathname: '/booking', params: { service: key } });
  };

  const name = getDisplayName(customer, customer?.phone ? String(customer.phone) : 'bạn');
  const avatarUri = localAvatar ?? (typeof customer?.avatar_url === 'string' ? customer.avatar_url : null);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, activeTrip ? { paddingBottom: 120 } : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <HomeHeader
          greeting={greeting}
          name={name}
          avatarUri={avatarUri}
          overlap={HEADER_OVERLAP}
          onAvatarPress={() => router.push('/account')}
        />

        <View style={styles.body}>
          <View style={{ marginTop: -HEADER_OVERLAP }}>
            <ServiceCard onSelect={openService} />
          </View>

          <View style={styles.section}>
            <WalletCard
              balance={walletBalance}
              onPress={() => router.push('/wallet')}
              onTopUp={() => router.push('/wallet/topup')}
            />
          </View>

          <View style={[styles.section, styles.stats]}>
            <StatCard icon={Icons.network} value={String(MOCK_COMMUNITY.homeStats.members)} label="thành viên" />
            <StatCard icon={Icons.chart} value={String(MOCK_COMMUNITY.homeStats.points)} label="điểm thưởng" />
          </View>

          <SectionHeader title="Tại sao chọn ZuumViet?" style={styles.newsHeader} />
          <WhyZuumCarousel />

          <SectionHeader title="Dành cho bạn" actionLabel="Tất cả" onAction={() => router.push('/promotions')} style={styles.newsHeader} />
          <PromoGrid items={MOCK_PROMOS} onPress={(p) => router.push(`/promotions/${p.id}`)} />

          <AppText size={11} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Ưu đãi & số dư ví đang là dữ liệu mẫu (demo)
          </AppText>
        </View>
      </ScrollView>

      {activeTrip ? (
        <ActiveTripBanner trip={activeTrip} onPress={() => router.push(`/booking/tracking?orderId=${activeTrip.id}`)} bottom={Spacing.md} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingBottom: Spacing.xl },
  body: { paddingHorizontal: Spacing.screen },
  section: { marginTop: Spacing.base },
  stats: { flexDirection: 'row', gap: Spacing.md },
  newsHeader: { marginTop: Spacing.lg, marginBottom: Spacing.xs },
});
