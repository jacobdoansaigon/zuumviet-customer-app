// PartnerBanner — banner quảng cáo đối tác dưới cùng trang chủ: 1 banner / màn, cuộn ngang, chấm chỉ trang.
// Nền gradient theo màu đối tác (thay bằng ảnh banner thật qua `image` khi có), nhãn "Quảng cáo" góc phải.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Image, Linking, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { PARTNER_ADS, type PartnerAd } from '@/constants/mock';

const GAP = Spacing.md;

interface PartnerBannerProps {
  items?: PartnerAd[];
  inset?: number;
  onPress?: (ad: PartnerAd) => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const PartnerBanner: React.FC<PartnerBannerProps> = ({ items = PARTNER_ADS, inset = Spacing.screen, onPress }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - inset * 2;
  const [active, setActive] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (i !== active && i >= 0 && i < items.length) setActive(i);
  };

  const open = (ad: PartnerAd) => {
    if (onPress) return onPress(ad);
    Linking.openURL(ad.url).catch(() => undefined);
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
        {items.map((ad) => (
          <Pressable key={ad.id} onPress={() => open(ad)} style={({ pressed }) => [{ width: cardWidth }, pressed && { opacity: 0.92 }]} accessibilityRole="link" accessibilityLabel={`${ad.partner}: ${ad.headline}`}>
            <LinearGradient colors={ad.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              {ad.image ? <Image source={{ uri: ad.image }} style={styles.image} resizeMode="cover" /> : null}
              <View style={styles.adTag}>
                <AppText size={9} weight="semiBold" color="rgba(255,255,255,0.9)">
                  QUẢNG CÁO
                </AppText>
              </View>
              <View style={styles.logo}>
                <AppText size={14} weight="extraBold" color={ad.colors[0]}>
                  {initials(ad.partner)}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={11} weight="semiBold" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                  {ad.partner.toUpperCase()}
                </AppText>
                <AppText size={15} weight="bold" color={Colors.white} numberOfLines={2} style={styles.headline}>
                  {ad.headline}
                </AppText>
                <AppText size={12} color="rgba(255,255,255,0.9)" numberOfLines={2} style={styles.desc}>
                  {ad.description}
                </AppText>
                <View style={styles.ctaRow}>
                  <AppText size={12} weight="bold" color={Colors.white}>
                    {ad.cta}
                  </AppText>
                  <Icon name={Icons.arrowRight} size={14} color={Colors.white} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((ad, i) => (
            <View key={ad.id} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      ) : null}
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
    minHeight: 120,
    overflow: 'hidden',
    ...Shadow.md,
  },
  image: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.35 },
  adTag: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headline: { marginTop: 2, lineHeight: 20 },
  desc: { marginTop: 2, lineHeight: 16 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gray300 },
  dotActive: { width: 18, backgroundColor: Colors.primary },
});

export default PartnerBanner;
