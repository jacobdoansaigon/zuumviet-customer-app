// Đánh giá tài xế — Figma "Tìm tài xế 1.6.2a" (X, avatar, sao, nhãn 2x2, nhận xét, Gửi đánh giá)
// → POST /v1/customer/orders/:id/rating {stars 1-5, tags, comment} — 1 lần, trong 7 ngày sau khi hoàn tất (canRate).
// Yêu thích / chặn tài xế chưa có trên API → không hiện.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppHeader, AppText, Avatar, Button, Chip, ErrorSheet, Screen, TextField } from '@/components/ui';
import { getOrder, rateOrder, type OrderDetail } from '@/services/orders';
import { errorMessage } from '@/services/zuum';
import { RatingStars } from '@/components/activity/RatingStars';
import { RATING_TAGS_BAD, RATING_TAGS_GOOD } from '@/components/activity/orderUtils';

export default function RateDriverScreen() {
  const { id, stars: starsParam } = useLocalSearchParams<{ id: string; stars?: string }>();
  const orderId = String(id ?? '');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stars, setStars] = useState(() => {
    const n = Number(starsParam);
    return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
  });
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getOrder(orderId)
      .then((o) => {
        if (!alive) return;
        setOrder(o);
        if (o.rating) {
          setStars(o.rating.stars);
          setTags(o.rating.tags);
          setComment(o.rating.comment ?? '');
        }
      })
      .catch((e) => alive && setLoadError(errorMessage(e, 'Không tải được chuyến đi')));
    return () => {
      alive = false;
    };
  }, [orderId]);

  const positive = stars === 0 || stars >= 4;
  const suggestions = positive ? RATING_TAGS_GOOD : RATING_TAGS_BAD;
  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const readOnly = !!order?.rating || (order != null && !order.canRate);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/orders/${orderId}`);
  };

  const submit = async () => {
    if (stars === 0 || readOnly || submitting) return;
    setSubmitting(true);
    try {
      await rateOrder(orderId, {
        stars,
        // chỉ gửi nhãn hợp với số sao đang chọn (đổi sao sau khi chọn nhãn)
        ...(tags.length ? { tags: tags.filter((t) => suggestions.includes(t)) } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      close();
    } catch (e) {
      setError(errorMessage(e, 'Không gửi được đánh giá'));
    } finally {
      setSubmitting(false);
    }
  };

  const partner = order?.partner;
  const vehicle = order?.vehicle;

  return (
    <Screen
      header={<AppHeader variant="light" left="close" onLeftPress={close} title="Đánh giá tài xế" />}
      footer={
        readOnly ? (
          <Button title="Đóng" flat variant="secondary" onPress={close} />
        ) : (
          <Button title="Gửi đánh giá" flat disabled={stars === 0 || !order} loading={submitting} onPress={submit} />
        )
      }
      footerPadded={false}
    >
      {!order && !loadError ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {loadError ? (
            <AppText size={14} color={Colors.error} align="center">
              {loadError}
            </AppText>
          ) : null}
          <Avatar uri={partner?.photoUrl} name={partner?.fullName ?? 'Tài xế'} size={72} />
          {partner ? (
            <AppText weight="bold" size={16} style={{ marginTop: Spacing.sm }}>
              {partner.fullName}
            </AppText>
          ) : null}
          {vehicle ? (
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {[vehicle.plate, [vehicle.brand, vehicle.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
            </AppText>
          ) : null}

          <AppText weight="bold" size={18} align="center" style={styles.question}>
            {order?.rating ? 'Bạn đã đánh giá chuyến đi này' : 'Chuyến đi của bạn thế nào?'}
          </AppText>
          <AppText size={15} color={Colors.textSecondary} align="center" style={styles.hint}>
            {readOnly && !order?.rating ? 'Đã hết thời gian đánh giá (7 ngày sau khi hoàn tất)' : positive ? 'Bạn hài lòng với chuyến đi chứ?' : 'Hãy đánh giá để chúng tôi cải thiện thêm'}
          </AppText>

          <RatingStars value={stars} size={32} gap={10} onChange={readOnly ? undefined : setStars} style={styles.stars} />

          <AppText weight="semiBold" size={15} color={Colors.primary} style={styles.notesTitle}>
            Ghi chú cho tài xế
          </AppText>
          <View style={styles.grid}>
            {(readOnly && order?.rating ? order.rating.tags : suggestions).map((t) => (
              <Chip key={t} label={t} active={tags.includes(t)} onPress={readOnly ? undefined : () => toggleTag(t)} style={styles.chip} />
            ))}
          </View>

          <TextField
            label="Nhận xét"
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ thêm về chuyến đi (không bắt buộc)"
            multiline
            maxLength={500}
            editable={!readOnly}
            containerStyle={styles.comment}
          />
        </ScrollView>
      )}
      <ErrorSheet visible={!!error} title="Chưa gửi được" message={error ?? ''} actionLabel="Đóng" onAction={() => setError(null)} onClose={() => setError(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  question: { marginTop: Spacing.xl },
  hint: { marginTop: Spacing.sm },
  stars: { marginTop: Spacing.lg },
  notesTitle: { marginTop: Spacing['2xl'], alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md, width: '100%' },
  chip: { width: '47%', flexGrow: 1, justifyContent: 'center' },
  comment: { marginTop: Spacing.xl, width: '100%' },
});
