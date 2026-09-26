// Chi tiết khuyến mãi: khối hero icon+gradient theo đúng dịch vụ (promoVisual) + nhãn ưu đãi, tiêu đề,
// mã (khung gạch đứt), HSD, điều kiện, nút "Đặt ngay"
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader, AppText, Button, EmptyState, Icon, Icons, Screen } from '@/components/ui';
import { promoVisual } from '@/components/home';
import { MOCK_PROMOS } from '@/constants/mock';
import { SERVICE_GROUPS, toServiceKey } from '@/constants/mockBooking';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function PromotionDetailScreen() {
  useStatusBarStyle('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = MOCK_PROMOS.find((p) => p.id === id);

  if (!item) {
    return (
      <Screen header={<AppHeader title="Khuyến mãi" variant="light" left="back" />}>
        <EmptyState icon={Icons.ticket} title="Không tìm thấy ưu đãi" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  const serviceKey = toServiceKey(item.service);
  const serviceTitle = SERVICE_GROUPS[serviceKey].title;
  const { icon, colors } = promoVisual(item);

  return (
    <Screen
      header={<AppHeader title="Khuyến mãi" variant="light" left="back" />}
      scroll
      footer={<Button title={`Đặt ${serviceTitle} ngay`} onPress={() => router.push({ pathname: '/booking', params: { service: serviceKey } })} />}
    >
      <View style={styles.heroWrap}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Icon name={icon} size={48} color={Colors.white} />
          </View>
        </LinearGradient>
        <View style={styles.badge}>
          <AppText size={14} weight="extraBold" color={Colors.dark}>
            {item.discount}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <AppText size={12} weight="semiBold" color={Colors.primary}>
          {item.tag.toUpperCase()}
        </AppText>
        <AppText weight="bold" size={22} color={Colors.text} style={styles.title}>
          {item.title}
        </AppText>
        <AppText size={15} color={Colors.gray800} style={styles.summary}>
          {item.summary}
        </AppText>

        <View style={styles.codeBox}>
          <View style={{ flex: 1 }}>
            <AppText size={11} color={Colors.textSecondary}>
              Mã ưu đãi
            </AppText>
            <AppText size={20} weight="extraBold" color={Colors.primary} style={{ letterSpacing: 1 }}>
              {item.code}
            </AppText>
          </View>
          <View style={styles.expiryPill}>
            <Icon name={Icons.clock} size={14} color={Colors.textSecondary} />
            <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
              HSD {item.expiry}
            </AppText>
          </View>
        </View>
        <AppText size={12} color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
          Nhập mã ở mục "Mã giảm giá" tại bước xác nhận đơn.
        </AppText>

        <AppText weight="bold" size={15} style={styles.sectionTitle}>
          Điều kiện áp dụng
        </AppText>
        {item.conditions.map((c, i) => (
          <View key={i} style={styles.condRow}>
            <Icon name={Icons.checkCircle} size={16} color={Colors.success} style={{ marginTop: 2 }} />
            <AppText size={14} color={Colors.gray800} style={styles.condText}>
              {c}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: { backgroundColor: Colors.primaryBg },
  hero: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: Spacing.screen,
    top: Spacing.base,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base, paddingBottom: Spacing['2xl'] },
  title: { marginTop: Spacing.xs, lineHeight: 28 },
  summary: { marginTop: Spacing.sm, lineHeight: 22 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.primaryBg,
  },
  expiryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  condRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  condText: { flex: 1, marginLeft: Spacing.sm, lineHeight: 20 },
});
