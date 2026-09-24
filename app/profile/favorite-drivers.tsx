// Tài xế yêu thích — Figma TÀI XẾ YÊU THÍCH (24): header "Tài xế yêu thích (24)"; nhóm theo loại xe
// "Zuum Luxury - Black (6)" (label xám); dòng avatar 40 + tên bold 15 + biển số/xe xám 12 +
// "4.9 ★" + "156 đánh giá" + tim đỏ (bấm bỏ yêu thích).
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Toast, Dialog, Icons } from '@/components/ui';
import { DriverRow } from '@/components/profile';
import { useFavoriteDrivers, favoriteDriverActions, countFavoriteDrivers } from '@/services/profileStore';
import type { FavoriteDriver } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function FavoriteDriversScreen() {
  useStatusBarStyle('light');
  const groups = useFavoriteDrivers();
  const total = countFavoriteDrivers(groups);
  const [pending, setPending] = useState<FavoriteDriver | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const sections = groups.map((g) => ({ title: `${g.vehicle} (${g.drivers.length})`, data: g.drivers }));

  return (
    <Screen header={<AppHeader title={`Tài xế yêu thích (${total})`} variant="dark" left="back" />}>
      {total === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon={Icons.heartOutline} title="Bạn chưa có tài xế yêu thích nào!" description="Thêm tài xế vào yêu thích từ màn đánh giá sau mỗi chuyến đi." />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(d) => d.id}
          renderSectionHeader={({ section }) => (
            <AppText size={13} weight="semiBold" color={Colors.textSecondary} style={styles.sectionHeader}>
              {section.title}
            </AppText>
          )}
          renderItem={({ item }) => <DriverRow driver={item} onToggleFavorite={() => setPending(item)} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Dialog
        visible={!!pending}
        onClose={() => setPending(null)}
        title="Bỏ yêu thích?"
        message={pending ? `${pending.name} sẽ được xoá khỏi danh sách tài xế yêu thích.` : undefined}
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setPending(null) },
          {
            label: 'Đồng ý',
            onPress: () => {
              if (pending) {
                favoriteDriverActions.remove(pending.id);
                setToast(`Đã bỏ yêu thích ${pending.name}`);
              }
              setPending(null);
            },
          },
        ]}
      />
      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing['2xl'] },
  sectionHeader: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.white },
  emptyWrap: { flex: 1, justifyContent: 'center' },
});
