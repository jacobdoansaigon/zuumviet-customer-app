// Trang chủ — Figma HOME 1.2 (3385-663): header tím chào theo giờ + avatar, lưới dịch vụ đè header,
// thẻ ví thưởng gradient (pill số thành viên bên phải),
// "Gợi ý cho bạn" (đặt lại chuyến gần đây của chính khách, bấm → mở đặt với lộ trình thật của đơn cũ),
// "Tại sao chọn ZuumViet?" (1 thẻ / màn, cuộn ngang 4 khác biệt),
// "Dành cho bạn / Tất cả" (2 hàng × 2 thẻ, cuộn ngang), "Đối tác của ZuumViet" (banner quảng cáo cuộn ngang),
// footer app (logo, liên kết, công ty, phiên bản), banner chuyến đang đi nổi trên tab bar.
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { SectionHeader } from '@/components/ui';
import {
  HomeHeader,
  ServiceCard,
  WalletCard,
  PromoGrid,
  WhyZuumCarousel,
  PartnerBanner,
  AppFooter,
  ActivitySuggestions,
  ActiveTripBanner,
  buildReorderSuggestions,
  describeActiveOrder,
  type HomeServiceKey,
  type ActiveTripInfo,
  type ReorderSuggestion,
} from '@/components/home';
import { listOrders } from '@/services/orders';
import { ensureCatalog } from '@/services/catalog';
import { useRealtime, useRealtimeRefetch } from '@/hooks/useRealtime';
import { displayName, formatPhone, refreshProfile, restoreSession, useProfile } from '@/services/session';
import { MOCK_PROMOS, getGreeting } from '@/constants/mock';
import { isMember, loadAffiliate, totalMembers, useAffiliate } from '@/services/affiliate';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const HEADER_OVERLAP = 40;

export default function HomeScreen() {
  useStatusBarStyle('light');
  const customer = useProfile();
  const [activeTrip, setActiveTrip] = useState<ActiveTripInfo | null>(null);
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const walletBalance = useWalletBalance();
  const affiliate = useAffiliate();

  const loadOrders = useCallback(async () => {
    await ensureCatalog().catch(() => null);
    try {
      const [active, history] = await Promise.all([listOrders('active', 1, 5), listOrders('history', 1, 20)]);
      const current = active.items[0];
      setActiveTrip(current ? describeActiveOrder(current) : null);
      setSuggestions(buildReorderSuggestions(history.items));
    } catch {
      // mạng lỗi → giữ nguyên những gì đang hiện
    }
  }, []);

  // đơn đổi trạng thái / kết nối lại realtime → cập nhật banner chuyến đang đi
  useRealtime('order.updated', () => void loadOrders());
  useRealtimeRefetch(() => void loadOrders());

  useEffect(() => {
    void restoreSession().then((ok) => {
      if (!ok) router.replace('/');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setGreeting(getGreeting());
      void refreshProfile().catch(() => undefined);
      void loadAffiliate().catch(() => undefined);
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

  const name = displayName(customer, customer?.phone ? formatPhone(customer.phone) : 'bạn');
  const avatarUri = customer?.avatarUrl ?? null;

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
              label="Số dư ví ZuumViet"
              members={isMember(affiliate) ? totalMembers(affiliate) : undefined}
              onPress={() => router.push('/wallet')}
              onMembersPress={() => router.push('/community')}
            />
          </View>

          {suggestions.length ? (
            <View style={styles.section}>
              <ActivitySuggestions
                items={suggestions}
                onPress={(s) => router.push({ pathname: '/booking', params: { service: s.service, reorder: s.orderId } })}
              />
            </View>
          ) : null}

          <SectionHeader title="Tại sao chọn ZuumViet?" style={styles.newsHeader} />
          <WhyZuumCarousel />

          <SectionHeader title="Dành cho bạn" actionLabel="Tất cả" onAction={() => router.push('/promotions')} style={styles.newsHeader} />
          <PromoGrid items={MOCK_PROMOS} onPress={(p) => router.push(`/promotions/${p.id}`)} />

          <SectionHeader title="Đối tác của ZuumViet" style={styles.newsHeader} />
          <PartnerBanner />

          <AppFooter note="Ưu đãi & đối tác đang là dữ liệu mẫu (demo)" />
        </View>
      </ScrollView>

      {activeTrip ? (
        <ActiveTripBanner trip={activeTrip} onPress={() => router.push({ pathname: '/booking/tracking', params: { orderId: activeTrip.id } })} bottom={Spacing.md} />
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
  newsHeader: { marginTop: Spacing.lg, marginBottom: Spacing.xs },
});
