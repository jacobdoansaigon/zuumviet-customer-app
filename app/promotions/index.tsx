// Danh sách khuyến mãi — link "Tất cả" trên Home: lưới 2 cột cuộn dọc
import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Screen } from '@/components/ui';
import { PromoCard } from '@/components/home';
import { MOCK_PROMOS } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const GAP = Spacing.md;

export default function PromotionsScreen() {
  useStatusBarStyle('dark');
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - Spacing.screen * 2 - GAP) / 2);

  return (
    <Screen header={<AppHeader title="Khuyến mãi" variant="light" left="back" />} background={Colors.white}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <AppText size={13} color={Colors.textSecondary} style={styles.intro}>
          Nhập mã ở bước xác nhận đơn để áp dụng ưu đãi.
        </AppText>
        <View style={styles.grid}>
          {MOCK_PROMOS.map((p) => (
            <PromoCard key={p.id} item={p} width={cardWidth} onPress={() => router.push(`/promotions/${p.id}`)} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing['2xl'] },
  intro: { marginTop: Spacing.base, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
