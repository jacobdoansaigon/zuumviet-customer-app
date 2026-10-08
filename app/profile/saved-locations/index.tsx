// Vị trí đã lưu — Figma VỊ TRÍ ĐÃ LƯU (2): header tím "Vị trí đã lưu (2)"; dòng icon nhà/toà nhà +
// tên bold 15 + địa chỉ xám 13 + chevron; chip "Thêm địa điểm". Dữ liệu: GET /v1/customer/addresses (tối đa 20).
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Screen, ListRow, Chip, EmptyState, Icons } from '@/components/ui';
import { loadSavedAddresses, useSavedAddresses, SAVED_KIND_LABEL } from '@/services/addresses';
import { errorMessage } from '@/services/zuum';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function SavedLocationsScreen() {
  useStatusBarStyle('light');
  const list = useSavedAddresses();
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await loadSavedAddresses();
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được vị trí đã lưu'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const locations = list ?? [];

  return (
    <Screen header={<AppHeader title={`Vị trí đã lưu (${locations.length})`} variant="dark" left="back" />}>
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
        {list === null && !error ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['2xl'] }} />
        ) : error ? (
          <AppText size={14} color={Colors.error} align="center" style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.screen }}>
            {error}
          </AppText>
        ) : locations.length === 0 ? (
          <EmptyState icon={Icons.bookmark} title="Bạn chưa lưu địa điểm nào!" compact />
        ) : (
          locations.map((l) => (
            <ListRow
              key={l.id}
              icon={l.kind === 'home' ? Icons.homeAddr : l.kind === 'work' ? Icons.office : Icons.bookmark}
              label={l.label || SAVED_KIND_LABEL[l.kind]}
              sublabel={l.address}
              onPress={() => router.push({ pathname: '/profile/saved-locations/add', params: { id: l.id } })}
            />
          ))
        )}

        <View style={styles.chips}>
          {locations.length < 20 ? <Chip label="Thêm địa điểm" icon={Icons.bookmark} onPress={() => router.push('/profile/saved-locations/add')} /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.screen, marginTop: Spacing.lg },
});
