// Vị trí đã lưu — Figma VỊ TRÍ ĐÃ LƯU (2): header tím "Vị trí đã lưu (2)"; dòng icon nhà/toà nhà +
// "Nhà" bold 15 + địa chỉ xám 13 + chevron; chips "Thêm địa điểm" / "Định vị trên bản đồ".
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Spacing } from '@/constants/theme';
import { AppHeader, Screen, ListRow, Chip, EmptyState, Icons } from '@/components/ui';
import { useSavedLocations } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function SavedLocationsScreen() {
  useStatusBarStyle('light');
  const locations = useSavedLocations();

  return (
    <Screen header={<AppHeader title={`Vị trí đã lưu (${locations.length})`} variant="dark" left="back" />}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {locations.length === 0 ? (
          <EmptyState icon={Icons.bookmark} title="Bạn chưa lưu địa điểm nào!" compact />
        ) : (
          locations.map((l) => (
            <ListRow
              key={l.id}
              icon={l.icon}
              label={l.name}
              sublabel={l.address}
              onPress={() => router.push({ pathname: '/profile/saved-locations/add', params: { id: l.id } })}
            />
          ))
        )}

        <View style={styles.chips}>
          <Chip label="Thêm địa điểm" icon={Icons.bookmark} onPress={() => router.push('/profile/saved-locations/add')} />
          <Chip label="Định vị trên bản đồ" icon={Icons.locationFilled} onPress={() => router.push('/booking/location')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['2xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.screen, marginTop: Spacing.lg },
});

