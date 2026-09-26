// PromoCard — thẻ khuyến mãi nhỏ (2 thẻ / hàng): khối icon+gradient 16:10 theo đúng dịch vụ (promoVisual)
// + nhãn ưu đãi vàng, tag dịch vụ, tiêu đề 2 dòng, HSD. Trước đây dùng ảnh chụp ngẫu nhiên (picsum) không
// liên quan gì tới nội dung — đổi sang icon để LUÔN đúng, không phụ thuộc tải ảnh ngoài mạng.
import React from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon } from '@/components/ui';
import type { PromoItem } from '@/constants/mock';
import { promoVisual } from './promoVisual';

interface PromoCardProps {
  item: PromoItem;
  width: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PromoCard: React.FC<PromoCardProps> = ({ item, width, onPress, style }) => {
  const { icon, colors } = promoVisual(item);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.92 }, style]} accessibilityRole="button" accessibilityLabel={item.title}>
      <View style={styles.imageWrap}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.image}>
          <View style={styles.iconWrap}>
            <Icon name={icon} size={30} color={Colors.white} />
          </View>
        </LinearGradient>
        <View style={styles.badge}>
          <AppText size={12} weight="extraBold" color={Colors.dark}>
            {item.discount}
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText size={11} weight="semiBold" color={Colors.primary} numberOfLines={1}>
          {item.tag.toUpperCase()}
        </AppText>
        <AppText size={13} weight="bold" color={Colors.text} numberOfLines={2} style={styles.title}>
          {item.title}
        </AppText>
        <AppText size={11} color={Colors.textMuted} numberOfLines={1} style={styles.expiry}>
          HSD {item.expiry}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  imageWrap: { backgroundColor: Colors.primaryBg },
  image: { width: '100%', aspectRatio: 16 / 10, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: Spacing.sm,
    top: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { marginTop: 2, lineHeight: 18, minHeight: 36 },
  expiry: { marginTop: 4 },
});

export default PromoCard;
