// WhyZuumCarousel — "Tại sao chọn ZuumViet?": banner ảnh 2:1 (người thật, áo tím ZuumViet), cuộn ngang 4 thẻ.
// Ảnh để chủ thể bên phải; nửa trái phủ gradient tím thương hiệu để chữ trắng luôn đọc rõ (chữ do app vẽ, không in
// trên ảnh — tiếng Việt luôn đúng dấu, sửa nội dung không phải vẽ lại). Thẻ hẹp hơn màn một chút để lộ mép thẻ sau.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, ImageBackground, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Colors, Spacing, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui';
import { WHY_ZUUM, type WhyZuumItem } from '@/constants/content';

const GAP = Spacing.md;
/** phần thẻ sau lộ ra ở mép phải — báo cho khách biết vuốt được */
const PEEK = 28;
const RADIUS = 16;

interface WhyZuumCarouselProps {
  items?: WhyZuumItem[];
  /** padding ngang của vùng nội dung cha (để thẻ tràn mép khi cuộn) */
  inset?: number;
}

export const WhyZuumCarousel: React.FC<WhyZuumCarouselProps> = ({ items = WHY_ZUUM, inset = Spacing.screen }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - inset * 2 - PEEK;
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
        {items.map((it) => {
          const go = it.cta ? () => router.push(it.cta!.href as Href) : undefined;
          return (
            <Pressable
              key={it.id}
              onPress={go}
              disabled={!go}
              style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && { opacity: 0.94 }]}
              accessibilityRole={go ? 'button' : undefined}
              accessibilityLabel={`${it.title}. ${it.description}`}
            >
              <ImageBackground source={it.image} resizeMode="cover" style={styles.image} imageStyle={styles.imageFill}>
                <LinearGradient
                  colors={['rgba(52,18,76,0.95)', 'rgba(89,38,124,0.78)', 'rgba(89,38,124,0)']}
                  locations={[0, 0.45, 0.78]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[StyleSheet.absoluteFill, styles.imageRadius]}
                />
                <View style={styles.text}>
                  <AppText size={17} weight="extraBold" color={Colors.white} numberOfLines={2} style={styles.title}>
                    {it.title}
                  </AppText>
                  <AppText size={12.5} color="rgba(255,255,255,0.9)" numberOfLines={2} style={styles.desc}>
                    {it.description}
                  </AppText>
                  {it.cta ? (
                    <View style={styles.cta}>
                      <AppText size={12} weight="extraBold" color={Colors.primaryDark}>
                        {it.cta.label}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {items.map((it, i) => (
          <View key={it.id} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: Spacing.xs },
  card: { borderRadius: RADIUS, backgroundColor: Colors.primary, ...Shadow.md },
  image: { width: '100%', aspectRatio: 2, justifyContent: 'center' },
  imageRadius: { borderRadius: RADIUS },
  // ImageBackground lấy width/height của style cho ảnh bên trong — style chỉ có aspectRatio nên phải ép ảnh lấp khung
  // (không thì web hiện ảnh theo kích thước gốc, phóng to và tràn khung)
  imageFill: { width: '100%', height: '100%', borderRadius: RADIUS },
  text: { width: '60%', paddingLeft: Spacing.base, paddingRight: Spacing.xs },
  title: { lineHeight: 22 },
  desc: { marginTop: 4, lineHeight: 17 },
  cta: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gray300 },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});

export default WhyZuumCarousel;
