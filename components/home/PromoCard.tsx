// PromoCard — thẻ khuyến mãi nhỏ (2 thẻ / hàng): ảnh 16:10 bo góc + nhãn ưu đãi vàng, tag dịch vụ, tiêu đề 2 dòng, HSD
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { PromoItem } from '@/constants/mock';

interface PromoCardProps {
  item: PromoItem;
  width: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PromoCard: React.FC<PromoCardProps> = ({ item, width, onPress, style }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.92 }, style]} accessibilityRole="button" accessibilityLabel={item.title}>
      <View style={styles.imageWrap}>
        {!failed ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <View style={[styles.image, styles.fallback]}>
            <Icon name={Icons.ticket} size={30} color={Colors.primarySoft} />
          </View>
        )}
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
  image: { width: '100%', aspectRatio: 16 / 10 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
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
