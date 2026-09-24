// Chi tiết tin tức — Figma News 1.1/1.2 (0-8516 / 3459-60808): header lavender, ảnh hero ~180,
// tiêu đề 22 bold tím, ngày xám 13, nội dung 15 line-height 1.4.
// id = "all" → danh sách toàn bộ tin (link "Tất cả" trên Home).
import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, EmptyState, Icon } from '@/components/ui';
import { NewsCard } from '@/components/home';
import { MOCK_NEWS } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function NewsDetailScreen() {
  useStatusBarStyle('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const [imgFailed, setImgFailed] = useState(false);

  if (id === 'all') {
    return (
      <Screen header={<AppHeader title="Tin tức" variant="light" left="back" />} background={Colors.white}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {MOCK_NEWS.map((n) => (
            <NewsCard key={n.id} item={n} onPress={() => router.push(`/news/${n.id}`)} />
          ))}
        </ScrollView>
      </Screen>
    );
  }

  const item = MOCK_NEWS.find((n) => n.id === id);

  if (!item) {
    return (
      <Screen header={<AppHeader title="Tin tức" variant="light" left="back" />}>
        <EmptyState icon="ion:newspaper-outline" title="Không tìm thấy bài viết" actionLabel="Quay lại" onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<AppHeader title={item.title} variant="light" left="back" />} scroll>
      <View style={styles.heroWrap}>
        {!imgFailed ? (
          <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" onError={() => setImgFailed(true)} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Icon name="ion:newspaper-outline" size={48} color={Colors.primarySoft} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <AppText weight="bold" size={22} color={Colors.primary} style={styles.title}>
          {item.title}
        </AppText>
        <AppText size={13} color={Colors.textSecondary} style={styles.date}>
          {item.date}
        </AppText>
        {item.body.map((p, i) => (
          <AppText key={i} size={15} color={Colors.gray800} style={styles.paragraph}>
            {p}
          </AppText>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.screen, paddingBottom: Spacing['2xl'] },
  heroWrap: { backgroundColor: Colors.primaryBg },
  hero: { width: '100%', height: 200 },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'] },
  title: { lineHeight: 30 },
  date: { marginTop: Spacing.sm },
  paragraph: { marginTop: Spacing.base, lineHeight: 21 },
});
