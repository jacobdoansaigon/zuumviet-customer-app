// Đánh giá tài xế — Figma "Tìm tài xế 1.6.2a" (modal: X, avatar, sao, ghi chú 2x2, yêu thích/chặn, Gửi đánh giá)
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Avatar, Button, Chip, Icon, Icons, Screen } from '@/components/ui';
import { RATING_TAGS, type ActivityOrder } from '@/constants/mockOrders';
import { fetchActivityOrder } from '@/components/activity/activityApi';
import { setLocalRating, withLocalRating } from '@/components/activity/ratingStore';
import { RatingStars } from '@/components/activity/RatingStars';

export default function RateDriverScreen() {
  const { id, stars: starsParam } = useLocalSearchParams<{ id: string; stars?: string }>();
  const orderId = String(id ?? '');
  const [order, setOrder] = useState<ActivityOrder | null>(null);
  const [stars, setStars] = useState(() => {
    const n = Number(starsParam);
    return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
  });
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchActivityOrder(orderId).then((o) => {
      if (!alive || !o) return;
      const v = withLocalRating(o);
      setOrder(v);
      if (v.rating) {
        if (!starsParam) setStars(v.rating.stars);
        setTags(v.rating.tags);
        setFavorite(v.rating.favorite);
        setBlocked(v.rating.blocked);
      }
    });
    return () => {
      alive = false;
    };
  }, [orderId, starsParam]);

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const positive = stars === 0 || stars >= 4;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/orders/${orderId}`);
  };

  const submit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    // TODO: gọi API đánh giá tài xế khi BE sẵn sàng; hiện lưu cục bộ (ratingStore)
    await new Promise((r) => setTimeout(r, 400));
    setLocalRating(orderId, { stars, tags, favorite, blocked });
    setSubmitting(false);
    close();
  };

  const driver = order?.driver;

  return (
    <Screen
      header={<AppHeader variant="light" left="close" onLeftPress={close} title="Đánh giá tài xế" />}
      footer={<Button title="Gửi đánh giá" flat disabled={stars === 0} loading={submitting} onPress={submit} />}
      footerPadded={false}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Avatar uri={driver?.avatar} name={driver?.name ?? 'Tài xế'} size={72} />
        {driver ? (
          <AppText weight="bold" size={16} style={{ marginTop: Spacing.sm }}>
            {driver.name}
          </AppText>
        ) : null}
        {driver?.plate ? (
          <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {[driver.plate, driver.vehicle].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}

        <AppText weight="bold" size={18} align="center" style={styles.question}>
          Chuyến đi của bạn thế nào?
        </AppText>
        <AppText size={15} color={Colors.textSecondary} align="center" style={styles.hint}>
          {positive ? 'Bạn hài lòng với chuyến đi chứ?' : 'Hãy đánh giá để chúng tôi cải thiện thêm'}
        </AppText>

        <RatingStars value={stars} size={32} gap={10} onChange={setStars} style={styles.stars} />

        <AppText weight="semiBold" size={15} color={Colors.primary} style={styles.notesTitle}>
          Ghi chú cho tài xế
        </AppText>
        <View style={styles.grid}>
          {RATING_TAGS.map((t) => (
            <Chip key={t} label={t} active={tags.includes(t)} onPress={() => toggleTag(t)} style={styles.chip} />
          ))}
        </View>

        {positive ? (
          <Pressable onPress={() => { setFavorite((v) => !v); setBlocked(false); }} style={styles.link} hitSlop={8}>
            <Icon name={favorite ? Icons.heart : Icons.heartOutline} size={20} color={Colors.primary} />
            <AppText size={15} weight="semiBold" color={Colors.primary} style={styles.linkText}>
              {favorite ? 'Đã thêm tài xế vào yêu thích' : 'Thêm vào tài xế yêu thích'}
            </AppText>
          </Pressable>
        ) : (
          <Pressable onPress={() => { setBlocked((v) => !v); setFavorite(false); }} style={styles.link} hitSlop={8}>
            <Icon name={Icons.block} size={20} color={Colors.error} />
            <AppText size={15} weight="semiBold" color={Colors.text} style={styles.linkText}>
              {blocked ? 'Đã thêm tài xế vào danh sách chặn' : 'Chặn tài xế'}
            </AppText>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  question: { marginTop: Spacing.xl },
  hint: { marginTop: Spacing.sm },
  stars: { marginTop: Spacing.lg },
  notesTitle: { marginTop: Spacing['2xl'], alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md, width: '100%' },
  chip: { width: '47%', flexGrow: 1, justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl, paddingVertical: Spacing.sm },
  linkText: { marginLeft: Spacing.sm },
});
