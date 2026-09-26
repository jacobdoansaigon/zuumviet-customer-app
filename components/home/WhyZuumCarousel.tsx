// WhyZuumCarousel — "Tại sao chọn ZuumViet?": 1 thẻ / màn, cuộn ngang qua 4 khác biệt, có chấm chỉ trang.
// Mỗi thẻ 1 gradient riêng (thay vì tím lặp lại cả 4 — dễ chìm giữa header/nút cũng tím) — chọn theo
// đúng ý nghĩa nội dung: vàng (thưởng/thu nhập), teal (giá/tiền bạc, trùng màu "thành công" sẵn có),
// xanh dương (an toàn/xác minh), tím thương hiệu dành riêng cho thẻ nói về chính ứng dụng ZuumViet.
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Palette, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, type IconName } from '@/components/ui';
import { WHY_ZUUM, type WhyZuumItem } from '@/constants/mock';

const GAP = Spacing.md;

/** [đậm, nhạt] theo id trong WHY_ZUUM (constants/mock.ts) — lặp vòng nếu sau này thêm thẻ mới */
const CARD_GRADIENTS: [string, string][] = [
  [Palette.warning[700], Colors.warning], // w1 Cộng đồng chia sẻ thu nhập
  [Palette.success[700], Colors.success], // w2 Giá rõ ràng, không phụ phí ẩn
  [Colors.infoDark, Colors.info], // w3 Tài xế được xác minh
  [Colors.primary, Colors.primaryLight], // w4 Một ứng dụng, mọi nhu cầu (giữ tím thương hiệu)
];

interface WhyZuumCarouselProps {
  items?: WhyZuumItem[];
  /** padding ngang của vùng nội dung cha (để thẻ tràn mép khi cuộn) */
  inset?: number;
}

export const WhyZuumCarousel: React.FC<WhyZuumCarouselProps> = ({ items = WHY_ZUUM, inset = Spacing.screen }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - inset * 2;
  const [active, setActive] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (i !== active && i >= 0 && i < items.length) setActive(i);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -inset }}
        contentContainerStyle={[styles.content, { paddingHorizontal: inset, gap: GAP }]}
      >
        {items.map((it, idx) => (
          <LinearGradient
            key={it.id}
            colors={CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { width: cardWidth }]}
          >
            <View style={styles.iconWrap}>
              <Icon name={it.icon as IconName} size={28} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={11} weight="semiBold" color="rgba(255,255,255,0.75)">
                {`${idx + 1}/${items.length}`}
              </AppText>
              <AppText size={16} weight="bold" color={Colors.white} numberOfLines={2} style={styles.title}>
                {it.title}
              </AppText>
              <AppText size={13} color="rgba(255,255,255,0.92)" numberOfLines={3} style={styles.desc}>
                {it.description}
              </AppText>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {items.map((it, i) => (
          <View
            key={it.id}
            style={[styles.dot, i === active && [styles.dotActive, { backgroundColor: CARD_GRADIENTS[i % CARD_GRADIENTS.length][1] }]]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: Spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    minHeight: 128,
    ...Shadow.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  title: { marginTop: 2, lineHeight: 22 },
  desc: { marginTop: 4, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gray300 },
  dotActive: { width: 18 },
});

export default WhyZuumCarousel;
